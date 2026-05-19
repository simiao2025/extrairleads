"use server";

import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

interface RegisterResult {
  success: boolean;
  error?: string;
  message?: string;
}

export async function registerAction(
  name: string,
  email: string,
  password: string
): Promise<RegisterResult> {
  try {
    // Validações básicas
    if (!name || name.trim().length < 2) {
      return { success: false, error: "Nome deve ter pelo menos 2 caracteres." };
    }

    if (!email || !email.includes("@")) {
      return { success: false, error: "Email inválido." };
    }

    if (!password || password.length < 6) {
      return { success: false, error: "Senha deve ter pelo menos 6 caracteres." };
    }

    const cleanEmail = email.toLowerCase().trim();

    // Verificar se o email já existe
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail));

    if (existingUser) {
      return { success: false, error: "Este email já está cadastrado." };
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar o usuário pendente de confirmação
    await db.insert(users).values({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      onboardingStatus: "PENDING_INFO",
      emailVerified: null, // Forçar confirmação por e-mail
    });

    // Gerar token de verificação seguro de uso único
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // Expirar em 24h

    // Salvar token no banco
    await db.insert(verificationTokens).values({
      identifier: cleanEmail,
      token: token,
      expires: expires,
    });

    // Montar link seguro de ativação
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const activationLink = `${baseUrl}/api/auth/confirm?token=${token}&email=${encodeURIComponent(cleanEmail)}`;

    // Enviar e-mail de ativação via Resend API
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
            to: cleanEmail,
            subject: "Ative sua conta - ExtrairLeads",
            html: `
              <div style="font-family: sans-serif; background-color: #050505; color: #f4f4f5; padding: 40px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
                <h2 style="color: #ffffff; font-size: 24px; font-weight: bold; margin-bottom: 20px;">Ative sua conta de prospecção</h2>
                <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">
                  Olá, <strong>${name.trim()}</strong>!<br/><br/>
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
        console.error("[registerAction] Erro no envio do Resend:", err);
      }
    } else {
      console.warn("[registerAction] RESEND_API_KEY ausente no .env. Link de ativação:", activationLink);
    }

    return { 
      success: true, 
      message: "E-mail de confirmação enviado! Verifique sua caixa de entrada." 
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[registerAction] Erro:", message);
    return { success: false, error: "Erro interno ao criar conta. Tente novamente." };
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
