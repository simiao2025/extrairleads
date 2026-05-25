"use server";

import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";

const onboardingSchema = z.object({
  phone: z.string().min(10, "Telefone inválido."),
  address: z.string().min(5, "Endereço inválido."),
  city: z.string().min(2, "Cidade inválida."),
  uf: z.string().length(2, "UF deve ter 2 letras."),
  cep: z.string().min(8, "CEP inválido."),
  cpfCnpj: z.string().min(11, "CPF/CNPJ inválido."),
});

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

    const validation = onboardingSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    const { phone, address, city, uf, cep, cpfCnpj } = validation.data;

    const [dbUser] = await db.select().from(users).where(eq(users.email, session.user.email));

    if (!dbUser) {
      return { success: false, error: "Usuário não encontrado." };
    }

    const instanceName = cpfCnpj.toString().replace(/\D/g, "");
    const instanceToken = crypto.randomUUID();

    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const globalKey = process.env.EVOLUTION_GLOBAL_API_KEY;

    if (!evolutionUrl || !globalKey) {
      console.error("ERRO CRÍTICO: Configurações da Evolution API ausentes no servidor (.env)");
      return {
        success: false,
        error: "Serviço de WhatsApp temporariamente indisponível (Erro de configuração).",
      };
    }

    try {
      const response = await fetch(`${evolutionUrl}/instance/create`, {
        method: "POST",
        headers: {
          apikey: globalKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instanceName: instanceName,
          name: instanceName, // Evolution v3 requer o campo 'name'
          token: instanceToken,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Falha na Evolution API:", response.status, errorText);

        // Se a instância já existir (ex: CPF já usado antes), o Evolution pode retornar 400/409
        if (response.status === 409 || errorText.includes("already exists")) {
          return {
            success: false,
            error: "Já existe uma instância para este CPF/CNPJ no sistema.",
          };
        }

        return {
          success: false,
          error: `Falha ao criar instância no WhatsApp: ${response.statusText}`,
        };
      }
    } catch (err: any) {
      console.error("Erro de rede ao conectar com Evolution API:", err);
      return {
        success: false,
        error: "Falha de comunicação com o servidor do WhatsApp. Tente novamente.",
      };
    }

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
    console.error("Erro inesperado no saveOnboardingInfoAction:", error);
    return { success: false, error: "Erro interno ao processar onboarding." };
  }
}

// Action obsoleta mantida temporariamente vazia para evitar quebras em referências
export async function changeOnboardingPasswordAction(_password: string) {
  return { success: true };
}
