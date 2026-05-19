# Confirmação de E-mail & Onboarding B2B Automático

> **For Antigravity:** REQUIRED SUB-SKILL: Load executing-plans to implement this plan task-by-task.

**Goal:** Implementar o fluxo nativo de registro com verificação de e-mail por link de confirmação de uso único (tabela `verification_tokens`), impedindo login de contas não confirmadas e efetuando o onboarding de perfil + criação de instância no Evolution Go v3 automaticamente após o primeiro login.

**Architecture:** 
1. O registro do usuário cria o registro no Neon com `emailVerified = null` e `onboardingStatus = 'PENDING_INFO'`.
2. Um token de 32 bytes é inserido na tabela `verification_tokens` com validade de 24 horas, e um link é enviado pelo Resend REST API.
3. O endpoint `GET /api/auth/confirm` valida o token, define `emailVerified = Now()` e redireciona para `/login?success=verified`.
4. NextAuth impede login se `emailVerified` for nulo. Após login bem-sucedido, o layout redireciona para `/onboarding/info`, que ao ser salvo cria a instância no Evolution Go v3 de forma isolada e libera o painel.

**Tech Stack:** Next.js (App Router), Auth.js (NextAuth v5), Drizzle ORM, Neon PostgreSQL, Resend REST API, Evolution Go v3.

---

### Task 1: Endpoint de Ativação de Conta
**Files:**
- Create: `src/app/api/auth/confirm/route.ts`

**Step 1: Criar o endpoint de confirmação de token**
Implementar o handler `GET` que recebe `token` e `email` por query, valida se o token existe e não está expirado, atualiza o usuário marcando `emailVerified` com o timestamp atual, exclui o token usado para evitar reaproveitamento, e redireciona para `/login?success=email_verified`.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  if (!token || !email) {
    return NextResponse.redirect(new URL("/login?error=token_invalid", request.url));
  }

  // Busca o token no banco
  const [dbToken] = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.token, token),
        eq(verificationTokens.identifier, email)
      )
    );

  if (!dbToken || new Date() > new Date(dbToken.expires)) {
    return NextResponse.redirect(new URL("/login?error=token_expired", request.url));
  }

  // Atualiza o e-mail do usuário como verificado
  await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.email, email));

  // Remove o token utilizado
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.id, dbToken.id));

  return NextResponse.redirect(
    new URL("/login?success=email_verified", request.url)
  );
}
```

---

### Task 2: Registro de Conta com Envio de E-mail
**Files:**
- Modify: `src/actions/auth.ts`

**Step 1: Atualizar o registerAction para enviar e-mail de ativação**
Modificar a função `registerAction` para criar o usuário com status `onboardingStatus = 'PENDING_INFO'`, gerar o token temporário via `crypto.randomBytes(32).toString('hex')`, salvá-lo na tabela `verification_tokens` com expiração de 24 horas, e enviar o link de ativação corporativo via Resend.

```typescript
import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function registerAction(name: string, email: string, password: string) {
  // ... validações básicas ...
  
  // Cria o usuário pendente de verificação
  const hashedPassword = await bcrypt.hash(password, 12);
  const cleanEmail = email.toLowerCase().trim();
  
  const [newUser] = await db.insert(users).values({
    name: name.trim(),
    email: cleanEmail,
    password: hashedPassword,
    onboardingStatus: "PENDING_INFO",
  }).returning();

  // Gera e insere token de confirmação
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
  
  await db.insert(verificationTokens).values({
    identifier: cleanEmail,
    token: token,
    expires: expires,
  });

  // Envia e-mail de ativação via Resend API
  const activationLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/confirm?token=${token}&email=${encodeURIComponent(cleanEmail)}`;
  
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
              <h2 style="color: #ffffff; font-size: 24px; font-weight: bold;">Ative sua conta de prospecção</h2>
              <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">
                Olá, ${name.trim()}! Obrigado por se cadastrar no <strong>ExtrairLeads</strong>. Para ativar seu acesso e prosseguir ao onboarding de sua conta, clique no botão de ativação segura abaixo:
              </p>
              <div style="margin: 30px 0; text-align: center;">
                <a href="${activationLink}" style="background-color: #ffffff; color: #000000; font-weight: bold; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; display: inline-block;">
                  Confirmar e Ativar Conta
                </a>
              </div>
              <p style="color: #71717a; font-size: 12px;">
                Se o botão não funcionar, copie e cole o link no seu navegador:<br/>
                <a href="${activationLink}" style="color: #10b981; text-decoration: none;">${activationLink}</a>
              </p>
            </div>
          `,
        }),
      });
    } catch (err) {
      console.error("Erro ao enviar e-mail de ativação:", err);
    }
  }

  return { success: true, message: "E-mail de confirmação enviado com sucesso!" };
}
```

---

### Task 3: Bloqueio de Login no NextAuth
**Files:**
- Modify: `src/lib/auth.ts:16-39`

**Step 1: Adicionar a verificação de e-mail confirmado no authorize**
Modificar a função `authorize` para validar se `user.emailVerified` não é nulo. Se for nulo, retornar um erro customizado ou nulo para impedir o login imediato de contas não confirmadas.

```typescript
        const [user] = await db.select().from(users).where(eq(users.email, email));
        if (!user || !user.password) {
          return null;
        }

        // Impede login se o e-mail não estiver verificado
        if (!user.emailVerified) {
          throw new Error("Por favor, ative sua conta pelo link enviado no seu e-mail.");
        }

        const isValid = await bcrypt.compare(password, user.password);
```

---

### Task 4: Feedback de Sucesso e Erros na Tela de Login
**Files:**
- Modify: `src/app/login/page.tsx`

**Step 1: Tratar query params de sucesso/erro e mensagem de registro**
Modificar a tela de login para capturar os query parameters (`success`, `error`) e exibir mensagens correspondentes caso o usuário venha do redirecionamento de confirmação de e-mail. Ao registrar com sucesso, exibir uma mensagem clara na tela informando que o e-mail de ativação foi enviado.

---

### Task 5: Simplificação do Onboarding (Fim do Redirecionamento de Senha)
**Files:**
- Modify: `src/actions/onboarding.ts`
- Modify: `src/app/(dashboard)/layout.tsx`

**Step 1: Mesclar criação de WhatsApp diretamente no saveOnboardingInfoAction**
Como o usuário já escolheu sua própria senha no registro, podemos remover a tela `/onboarding/change-password/page.tsx` e o status `PENDING_PASSWORD`.
Atualizar o `saveOnboardingInfoAction` para salvar os dados, gerar a instância do Evolution Go v3 baseada no CPF/CNPJ, salvar as credenciais e definir o status diretamente para `COMPLETED`.

```typescript
// No saveOnboardingInfoAction:
// ... salva dados cadastrais ...
// ... chama Evolution Go v3 createInstance usando o CPF/CNPJ limpo ...
// ... atualiza o status de onboarding diretamente para COMPLETED no banco ...
```

**Step 2: Atualizar o Layout do Dashboard**
Remover a verificação e redirecionamento de `PENDING_PASSWORD`, mantendo apenas o redirecionamento para `/onboarding/info` caso o status seja `PENDING_INFO`.

---

## Plano de Verificação

### Testes Manuais
1. **Fluxo de Registro:** Registrar um novo usuário. Verificar se ele é salvo no Neon com `emailVerified = null` e `onboardingStatus = 'PENDING_INFO'`.
2. **Impedimento de Acesso:** Tentar efetuar login imediatamente sem clicar no link do e-mail. Garantir que o login seja bloqueado com a mensagem de ativação pendente.
3. **Ativação da Conta:** Clicar no link recebido por e-mail. Verificar se é redirecionado para `/login?success=email_verified` e se `emailVerified` foi atualizado com o timestamp atual no Neon.
4. **Onboarding & Prospecção:** Efetuar o login. Garantir que seja direcionado para `/onboarding/info`. Preencher os dados, confirmar o CEP, clicar em Salvar e garantir o redirecionamento final para o Dashboard e que a instância WhatsApp foi provisionada com sucesso na Evolution Go v3.
