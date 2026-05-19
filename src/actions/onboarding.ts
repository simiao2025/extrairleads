"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import crypto from "crypto";

export async function saveOnboardingInfoAction(data: {
  phone: string;
  address: string;
  city: string;
  uf: string;
  cep: string;
  cpfCnpj: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Sessão expirada. Faça login novamente." };
    }

    const { phone, address, city, uf, cep, cpfCnpj } = data;
    if (!phone || !address || !city || !uf || !cep || !cpfCnpj) {
      return { success: false, error: "Todos os campos obrigatórios devem ser preenchidos." };
    }

    // Busca o usuário logado para capturar dados
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email));

    if (!dbUser) {
      return { success: false, error: "Usuário não encontrado." };
    }

    // CPF ou CNPJ limpo de caracteres especiais para nomear a instância do Evolution Go
    const instanceName = cpfCnpj.toString().replace(/\D/g, "");
    const instanceToken = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);

    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const globalKey = process.env.EVOLUTION_GLOBAL_API_KEY || "abcslirm2026";

    if (evolutionUrl) {
      try {
        console.log(`[Onboarding] Tentando criar instância no Evolution Go: ${instanceName} via url: ${evolutionUrl}`);
        const response = await fetch(`${evolutionUrl}/instance/create`, {
          method: "POST",
          headers: {
            "apikey": globalKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            instanceName: instanceName,
            name: instanceName,
            token: instanceToken,
            qrcode: true,
            integration: "WHATSAPP-BAILEYS",
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error("[Onboarding] Evolution Go - Falha ao criar instância:", errText);
        } else {
          const resJson = await response.json();
          console.log("[Onboarding] Instância criada com sucesso no Evolution Go:", JSON.stringify(resJson));
        }
      } catch (err) {
        console.error("[Onboarding] Evolution Go - Exceção na requisição de criação de instância:", err);
      }
    } else {
      console.warn("[Onboarding] Aviso: EVOLUTION_API_URL não está configurada no .env.");
    }

    // Atualiza dados cadastrais e conclui onboarding
    await db
      .update(users)
      .set({
        phone,
        address,
        city,
        uf,
        cep,
        cpfCnpj,
        onboardingStatus: "COMPLETED",
        whatsappInstanceName: instanceName,
        whatsappInstanceToken: instanceToken,
      })
      .where(eq(users.email, session.user.email));

    return { success: true };
  } catch (error: any) {
    console.error("Erro em saveOnboardingInfoAction:", error);
    return { success: false, error: error.message };
  }
}

// Action obsoleta mantida temporariamente vazia para evitar quebras em referências
export async function changeOnboardingPasswordAction(password: string) {
  return { success: true };
}
