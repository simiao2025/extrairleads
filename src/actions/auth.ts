"use server";

import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import argon2 from "@node-rs/argon2";
import crypto from "crypto";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto.").regex(/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/, "Nome inválido."),
  email: z.string().trim().toLowerCase().email("Email inválido."),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
});

interface RegisterResult {
  success: boolean;
  error?: string;
  message?: string;
}

// Em memória: Rate limiting muito básico por IP/sessão não é ideal em server action puro sem o request,
// então vamos focar na sanitização estrita e Zero Enumeration por enquanto.
// Para rate limit real distribuído, a recomendação é usar @upstash/ratelimit com headers no Middleware.

export async function registerAction(
  nameRaw: string,
  emailRaw: string,
  passwordRaw: string
): Promise<RegisterResult> {
  try {
    // 1. Sanitização estrita (Zod) OWASP A06
    const validation = registerSchema.safeParse({ name: nameRaw, email: emailRaw, password: passwordRaw });
    if (!validation.success) {
      // Fail-closed sem vazar detalhes excessivos
      return { success: false, error: validation.error.issues[0].message };
    }

    const { name, email, password } = validation.data;

    // 2. Zero Account Enumeration (OWASP A07)
    // Procuramos o usuário, mas se ele existir, disfarçamos.
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser) {
      // Se existir, nós não criamos o usuário novamente nem enviamos erro.
      // Apenas simulamos o mesmo fluxo externo de sucesso para evitar enumeração.
      // Nota: Na vida real, poderíamos enviar um e-mail de "Você já tem conta, faça login".
      return { 
        success: true, 
        message: "E-mail de confirmação enviado! Verifique sua caixa de entrada." 
      };
    }

    // 3. Argon2id para Hashing Forte (OWASP A05)
    // Substitui o antigo bcrypt
    const hashedPassword = await argon2.hash(password);

    // 4. Inserção Segura
    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      onboardingStatus: "PENDING_INFO",
      emailVerified: null, // Forçar confirmação por e-mail
    });

    // 5. Token criptograficamente seguro (OWASP A02)
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await db.insert(verificationTokens).values({
      identifier: email,
      token: token,
      expires: expires,
    });

    // Enviar e-mail de ativação via Resend API
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const activationLink = `${baseUrl}/api/auth/confirm?token=${token}&email=${encodeURIComponent(email)}`;
    
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "ExtrairLeads <onboarding@resend.dev>",
            to: email,
            subject: "Ative sua conta - ExtrairLeads",
            html: `
              <div style="font-family: sans-serif; background-color: #050505; color: #f4f4f5; padding: 40px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
                <h2 style="color: #ffffff; font-size: 24px; font-weight: bold; margin-bottom: 20px;">Ative sua conta de prospecção</h2>
                <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">
                  Olá, <strong>${name}</strong>!<br/><br/>
                  Obrigado por se cadastrar no <strong>ExtrairLeads</strong>, a inteligência neural de vendas corporativas B2B.<br/>
                  Para ativar o acesso a sua conta e prosseguir para o onboarding, clique no link de ativação segura abaixo:
                </p>
                <div style="margin: 35px 0; text-align: center;">
                  <a href="${activationLink}" style="background-color: #ffffff; color: #000000; font-weight: bold; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; display: inline-block; transition: background-color 0.2s;">
                    Confirmar e Ativar Conta
                  </a>
                </div>
                <p style="color: #71717a; font-size: 12px; line-height: 1.5;">
                  Se o botão acima não funcionar, copie e cole este link no seu navegador:<br/>
                  <a href="${activationLink}" style="color: #10b981; text-decoration: none; word-break: break-all;">${activationLink}</a>
                </p>
                <hr style="border: 0; border-top: 1px solid #1f1f22; margin: 25px 0;" />
                <p style="color: #52525b; font-size: 11px; text-align: center;">
                  Este é um e-mail transacional de segurança. Se você não solicitou este cadastro, por favor desconsidere.
                </p>
              </div>
            `,
          }),
        });
      } catch (err) {
        console.error("[registerAction] Erro silencioso no envio de e-mail.");
      }
    }

    return { 
      success: true, 
      message: "E-mail de confirmação enviado! Verifique sua caixa de entrada." 
    };
  } catch (error: unknown) {
    // Fail-closed (OWASP A10): Erros internos NUNCA vazam stack trace
    console.error("[registerAction] Erro Crítico:", error);
    return { success: false, error: "Serviço temporariamente indisponível. Tente novamente." };
  }
}

const forgotPasswordRateLimit = new Map<string, { count: number; resetAt: number }>();

function checkForgotRateLimit(email: string): boolean {
  const now = Date.now();
  const entry = forgotPasswordRateLimit.get(email);
  if (!entry || now > entry.resetAt) {
    forgotPasswordRateLimit.set(email, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 3) return false;
  entry.count++;
  return true;
}

export async function forgotPasswordAction(emailRaw: string): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    if (!checkForgotRateLimit(emailRaw.toLowerCase().trim())) {
      return { success: false, error: "Muitas tentativas. Tente novamente em 15 minutos." };
    }

    const email = emailRaw.toLowerCase().trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: "E-mail inválido." };
    }

    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      return { success: true, message: "Se o e-mail estiver cadastrado, você receberá um link de recuperação." };
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await db.insert(verificationTokens).values({
      identifier: `reset:${email}`,
      token,
      expires,
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetLink = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "ExtrairLeads <onboarding@resend.dev>",
            to: email,
            subject: "Recuperação de Senha - ExtrairLeads",
            html: `
<div style="font-family: sans-serif; background-color: #050505; color: #f4f4f5; padding: 40px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
  <h2 style="color: #ffffff; font-size: 24px; font-weight: bold; margin-bottom: 20px;">Recuperação de Senha</h2>
  <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">
    Olá!<br/><br/>
    Recebemos uma solicitação para redefinir a senha da sua conta no <strong>ExtrairLeads</strong>.<br/>
    Clique no link abaixo para definir uma nova senha:
  </p>
  <div style="margin: 35px 0; text-align: center;">
    <a href="${resetLink}" style="background-color: #ffffff; color: #000000; font-weight: bold; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; display: inline-block;">
      Redefinir Senha
    </a>
  </div>
  <p style="color: #71717a; font-size: 12px; line-height: 1.5;">
    Se o botão acima não funcionar, copie e cole este link no seu navegador:<br/>
    <a href="${resetLink}" style="color: #10b981; text-decoration: none; word-break: break-all;">${resetLink}</a>
  </p>
  <p style="color: #71717a; font-size: 12px; line-height: 1.5;">
    Este link expira em <strong>1 hora</strong>. Se você não solicitou esta recuperação, desconsidere este e-mail.
  </p>
  <hr style="border: 0; border-top: 1px solid #1f1f22; margin: 25px 0;" />
  <p style="color: #52525b; font-size: 11px; text-align: center;">
    Este é um e-mail transacional de segurança. Não responda a este e-mail.
  </p>
</div>
`,
          }),
        });
      } catch (err) {
        console.error("[forgotPasswordAction] Erro silencioso no envio de e-mail.");
      }
    }

    return { success: true, message: "Se o e-mail estiver cadastrado, você receberá um link de recuperação." };
  } catch (error: unknown) {
    console.error("[forgotPasswordAction] Erro Crítico:", error);
    return { success: false, error: "Serviço temporariamente indisponível. Tente novamente." };
  }
}

export async function resetPasswordAction(tokenRaw: string, emailRaw: string, newPasswordRaw: string): Promise<{ success: boolean; error?: string }> {
  try {
    const token = tokenRaw?.trim();
    const email = emailRaw?.toLowerCase().trim();
    const newPassword = newPasswordRaw;

    if (!token || !email || !newPassword) {
      return { success: false, error: "Dados insuficientes para redefinir a senha." };
    }

    if (newPassword.length < 8) {
      return { success: false, error: "A nova senha deve ter pelo menos 8 caracteres." };
    }

    const [dbToken] = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.token, token),
          eq(verificationTokens.identifier, `reset:${email}`)
        )
      );

    if (!dbToken || new Date() > new Date(dbToken.expires)) {
      return { success: false, error: "Link de recuperação expirado ou inválido. Solicite um novo." };
    }

    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      return { success: false, error: "Conta não encontrada." };
    }

    const hashedPassword = await argon2.hash(newPassword);

    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.email, email));

    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.id, dbToken.id));

    return { success: true };
  } catch (error: unknown) {
    console.error("[resetPasswordAction] Erro Crítico:", error);
    return { success: false, error: "Serviço temporariamente indisponível. Tente novamente." };
  }
}

export async function checkEmailVerifiedAction(email: string): Promise<{ success: boolean; verified: boolean; error?: string }> {
  try {
    const cleanEmail = email.toLowerCase().trim();
    const [user] = await db.select().from(users).where(eq(users.email, cleanEmail));
    if (!user) {
      return { success: false, verified: false, error: "Usuário não encontrado." };
    }
    return { success: true, verified: !!user.emailVerified };
  } catch (err) {
    console.error("[checkEmailVerifiedAction] Erro:", err);
    return { success: false, verified: false, error: "Erro ao verificar status do e-mail." };
  }
}
