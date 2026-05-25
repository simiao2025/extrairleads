"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, leads, chatHistory } from "@/db/schema";
import { auth } from "@/lib/auth";

const GLOBAL_KEY = process.env.EVOLUTION_GLOBAL_API_KEY || "abcslirm2026";

// Auxiliar para obter dados do usuário logado
async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.email) return null;

  const [user] = await db.select().from(users).where(eq(users.email, session.user.email));
  return user;
}

export async function checkWhatsAppConnectionAction() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    if (!user.cpfCnpj && !user.whatsappInstanceName) {
      // Não cria a instância prematuramente se o usuário ainda não tiver preenchido o CPF no Onboarding
      return { success: false, state: "DISCONNECTED", error: "Conclua o onboarding para criar a instância." };
    }

    const instanceName = user.whatsappInstanceName || user.cpfCnpj?.toString().replace(/\D/g, "");
                         
    if (!instanceName) {
      return { success: false, error: "Falha catastrófica ao gerar nome da instância." };
    }

    const evolutionUrl = process.env.EVOLUTION_API_URL;
    if (!evolutionUrl) {
      return {
        success: false,
        error: "Serviço de WhatsApp temporariamente fora de serviço (URL não configurada).",
      };
    }

    // Consulta a lista de instâncias na API global do Evolution Go v3
    const response = await fetch(`${evolutionUrl}/instance/all`, {
      method: "GET",
      headers: {
        apikey: GLOBAL_KEY,
      },
    });

    if (!response.ok) {
      await response.text(); // consume body
      return { success: false, error: "Erro ao ler status no servidor." };
    }

    const resJson = await response.json();
    const instancesList = resJson?.data || [];
    const foundInstance = instancesList.find((inst: any) => inst.name === instanceName);

    if (!foundInstance) {
      const token =
        user.whatsappInstanceToken ||
        Math.random().toString(36).substring(2) + Date.now().toString(36);

      const createRes = await fetch(`${evolutionUrl}/instance/create`, {
        method: "POST",
        headers: {
          apikey: GLOBAL_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instanceName: instanceName,
          name: instanceName,
          token: token,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
        }),
      });

      if (createRes.ok) {
        // Atualiza os dados de WhatsApp no banco
        await db
          .update(users)
          .set({
            whatsappInstanceName: instanceName,
            whatsappInstanceToken: token,
          })
          .where(eq(users.id, user.id));
      }

      return { success: true, connected: false, state: "DISCONNECTED" };
    }

    // Se a instância existe, garantimos que o token local esteja em sincronia com o token da API do Evolution Go
    const serverToken = foundInstance.token;
    if (user.whatsappInstanceToken !== serverToken || user.whatsappInstanceName !== instanceName) {
      await db
        .update(users)
        .set({
          whatsappInstanceName: instanceName,
          whatsappInstanceToken: serverToken,
        })
        .where(eq(users.id, user.id));
    }

    const connected = foundInstance.connected === true;
    const state = connected ? "CONNECTED" : "DISCONNECTED";

    return {
      success: true,
      connected,
      state,
      instanceName,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getWhatsAppQrCodeAction() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const instanceName = user.whatsappInstanceName;
    if (!instanceName) {
      return { success: false, error: "Nenhuma instância ativa configurada." };
    }

    const evolutionUrl = process.env.EVOLUTION_API_URL;
    if (!evolutionUrl) {
      return { success: false, error: "URL do Evolution Go não configurada." };
    }

    // Primeiro buscamos a lista de instâncias para garantir que temos o token correto
    const listRes = await fetch(`${evolutionUrl}/instance/all`, {
      method: "GET",
      headers: {
        apikey: GLOBAL_KEY,
      },
    });

    let token = user.whatsappInstanceToken;
    if (listRes.ok) {
      const listData = await listRes.json();
      const found = listData?.data?.find((inst: any) => inst.name === instanceName);
      if (found) {
        token = found.token;
        // Atualiza no banco se estiver diferente
        if (user.whatsappInstanceToken !== token) {
          await db.update(users).set({ whatsappInstanceToken: token }).where(eq(users.id, user.id));
        }
      }
    }

    if (!token) {
      return { success: false, error: "Token da instância não encontrado no servidor." };
    }

    // Obtém o QR Code de conexão chamando a rota correta do Evolution Go v3 com cabeçalhos apropriados
    const response = await fetch(`${evolutionUrl}/instance/qr`, {
      method: "GET",
      headers: {
        apikey: token,
        instance: instanceName,
      },
    });

    if (!response.ok) {
      await response.text(); // consume body
      return { success: false, error: "Não foi possível gerar o QR Code no servidor." };
    }

    const resJson = await response.json();

    // O Evolution Go v3 retorna o QR code no campo resJson.data.Qrcode
    const qrImage =
      resJson?.data?.Qrcode || resJson?.base64 || resJson?.qrcode?.base64 || resJson?.code || null;
    if (!qrImage) {
      return { success: false, error: "Nenhum código QR retornado do servidor." };
    }

    return {
      success: true,
      qrCode: qrImage,
      instanceName,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function sendManualWhatsAppMessageAction(leadId: number, text: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Usuário não autenticado." };

    const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
    if (!lead || !lead.phone) {
      return { success: false, error: "Lead não encontrado ou sem número de telefone." };
    }

    const provider = user.whatsappProvider || "evolution";

    if (provider === "meta_official") {
      const { metaAccessToken, metaPhoneNumberId } = user;
      if (!metaAccessToken || !metaPhoneNumberId) {
        return { success: false, error: "Credenciais da Meta não configuradas." };
      }

      const phoneStr = lead.phone.replace(/\D/g, "");

      const metaResponse = await fetch(`https://graph.facebook.com/v19.0/${metaPhoneNumberId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${metaAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: phoneStr,
          type: "text",
          text: {
            preview_url: false,
            body: text
          }
        }),
      });

      if (!metaResponse.ok) {
        const errorText = await metaResponse.text();
        return { success: false, error: `Falha na API da Meta: ${errorText}` };
      }
    } else {
      const instanceName = user.whatsappInstanceName;
      const instanceToken = user.whatsappInstanceToken;
      const evolutionUrl = process.env.EVOLUTION_API_URL;

      if (!evolutionUrl || !instanceName || !instanceToken) {
        return { success: false, error: "WhatsApp Evolution não configurado." };
      }

      const response = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: instanceToken,
        },
        body: JSON.stringify({ number: lead.phone, text, delay: 1200 }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Falha na API do WhatsApp: ${errorText}` };
      }
    }

    await db.insert(chatHistory).values({
      leadId: lead.id,
      role: "assistant",
      content: text,
      type: "text",
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getWhatsAppSettingsAction() {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Não autenticado." };

    return {
      success: true,
      provider: user.whatsappProvider || "evolution",
      metaAccessToken: user.metaAccessToken,
      metaPhoneNumberId: user.metaPhoneNumberId,
      metaWabaId: user.metaWabaId,
      notificationsEnabled: user.notificationsEnabled === 1,
      name: user.name,
      email: user.email,
      plan: user.plan || "Starter",
      leadsBalance: user.leadsBalance ?? 0,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function saveWhatsAppSettingsAction(data: {
  provider: "evolution" | "meta_official";
  metaAccessToken?: string;
  metaPhoneNumberId?: string;
  metaWabaId?: string;
  notificationsEnabled?: boolean;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Não autenticado." };

    await db.update(users)
      .set({
        whatsappProvider: data.provider,
        metaAccessToken: data.metaAccessToken || null,
        metaPhoneNumberId: data.metaPhoneNumberId || null,
        metaWabaId: data.metaWabaId || null,
        notificationsEnabled: data.notificationsEnabled ? 1 : 0,
      })
      .where(eq(users.id, user.id));

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
