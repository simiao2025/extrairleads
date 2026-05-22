"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import OpenAI from "openai";
import { db } from "@/db";
import { campaignConfigs, campaigns, chatHistory, leads, outreachLogs, users } from "@/db/schema";
import { auth } from "@/lib/auth";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function qualifyLeadsAction(leadIds: number[]) {
  for (const id of leadIds) {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    if (!lead) continue;

    // Load config specific to the lead's owner (userId)
    const [config] = lead.userId
      ? await db.select().from(campaignConfigs).where(eq(campaignConfigs.userId, lead.userId))
      : [];
    const prompt = config?.agent1Prompt || "Qualifique o lead.";

    // Mapear metadados adicionais para preencher o prompt de qualificação
    const meta = (lead.metadata || {}) as any;
    const reviewsArr = Array.isArray(meta.reviews) ? meta.reviews : [];
    const reviewsText = reviewsArr
      .map(
        (r: any) => `- Nota ${r.rating}: "${r.snippet || r.text || ""}" (${r.date || "recente"})`,
      )
      .join("\n");

    const formattedPrompt = prompt
      .replace(/{nome}/g, lead.name || "")
      .replace(/{categoria}/g, lead.niche || meta.category || "")
      .replace(
        /{categorias_adicionais}/g,
        Array.isArray(meta.additionalCategories) ? meta.additionalCategories.join(", ") : "",
      )
      .replace(/{endereco}/g, meta.address || "")
      .replace(/{cidade}/g, lead.city || "")
      .replace(/{bairro}/g, meta.suburb || meta.neighborhood || "")
      .replace(/{site}/g, lead.website || "null")
      .replace(
        /{redes}/g,
        Array.isArray(meta.socialMedia) ? meta.socialMedia.join(", ") : "Nenhuma",
      )
      .replace(/{fotos}/g, meta.photosCount || "0")
      .replace(/{nota}/g, String(meta.rating || ""))
      .replace(/{total_avaliacoes}/g, String(meta.reviewsCount || "0"))
      .replace(/{texto, nota, data}/g, reviewsText || "Nenhuma avaliação recente")
      .replace(/{horario}/g, meta.operatingHours || "Não especificado")
      .replace(/{faixa_preco}/g, meta.priceRange || "Não especificado")
      .replace(
        /{atributos}/g,
        Array.isArray(meta.attributes) ? meta.attributes.join(", ") : "Nenhum",
      )
      .replace(/{data_criacao_perfil}/g, meta.profileAge || "Não especificado");

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: formattedPrompt },
          {
            role: "user",
            content: `Analise as informações do seguinte lead: ${JSON.stringify(lead)}`,
          },
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
      });
      const result = JSON.parse(completion.choices[0].message.content || "{}");
      const scoreNum = Number(result.score) || 0;
      const parsedScore = Math.round(scoreNum);

      await db
        .update(leads)
        .set({
          aiScore: parsedScore,
          aiAnalysis: result.analysis,
          status: "qualified",
          updatedAt: new Date(),
        })
        .where(eq(leads.id, id));
    } catch (_e) {
    }
  }
}

export async function qualifyPendingLeadsAction(campaignId?: number) {
  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;
  if (!userId) return { success: false, error: "Usuário não autenticado." };

  const conditions = [eq(leads.status, "raw"), eq(leads.userId, userId)];
  if (campaignId) conditions.push(eq(leads.campaignId, campaignId));

  const rawLeads = await db
    .select()
    .from(leads)
    .where(and(...conditions));
  if (rawLeads.length === 0)
    return { success: true, count: 0, message: "Nenhum lead pendente de análise." };

  await qualifyLeadsAction(rawLeads.map((l) => l.id));
  revalidatePath("/");
  return { success: true, count: rawLeads.length };
}

export async function startOutreachAction(campaignId?: number) {
  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;
  if (!userId) return { success: false, error: "Usuário não autenticado." };

  const [dbUser] = await db.select().from(users).where(eq(users.id, userId));
  const [config] = await db
    .select()
    .from(campaignConfigs)
    .where(eq(campaignConfigs.userId, userId));

  const provider = dbUser?.whatsappProvider || "evolution";
  const evolutionUrl = process.env.EVOLUTION_API_URL;
  const instanceName = dbUser?.whatsappInstanceName;
  const instanceToken = dbUser?.whatsappInstanceToken;

  if (provider === "evolution" && (!evolutionUrl || !instanceName || !instanceToken)) {
    return {
      success: false,
      error: "WhatsApp Evolution não configurado. Vá em Configurações para emparelhar seu WhatsApp primeiro.",
    };
  }

  if (provider === "meta_official" && (!dbUser?.metaAccessToken || !dbUser?.metaPhoneNumberId)) {
    return {
      success: false,
      error: "Credenciais da Meta não configuradas. Vá em Configurações.",
    };
  }

  const conditions = [eq(leads.status, "qualified"), eq(leads.userId, userId)];
  if (campaignId) {
    conditions.push(eq(leads.campaignId, campaignId));
  }

  const qualifiedLeads = await db
    .select({
      lead: leads,
      campaignMetaTemplate: campaigns.metaTemplateName,
    })
    .from(leads)
    .leftJoin(campaigns, eq(leads.campaignId, campaigns.id))
    .where(and(...conditions))
    .limit(config?.weeklyLimit || 5);

  for (const { lead, campaignMetaTemplate } of qualifiedLeads) {
    if (!lead.phone) continue;
    try {
      if (provider === "meta_official") {
        if (!campaignMetaTemplate) {
          console.error("Campanha sem Template Meta configurado");
          continue;
        }
        const phoneStr = lead.phone.replace(/\D/g, "");
        const metaResponse = await fetch(`https://graph.facebook.com/v19.0/${dbUser.metaPhoneNumberId}/messages`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${dbUser.metaAccessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: phoneStr,
            type: "template",
            template: {
              name: campaignMetaTemplate,
              language: { code: "pt_BR" }
            }
          }),
        });

        if (!metaResponse.ok) {
          console.error(await metaResponse.text());
          continue;
        }

        await db.insert(chatHistory).values({
          leadId: lead.id,
          role: "assistant",
          content: `[Template Oficial Enviado: ${campaignMetaTemplate}]`,
          type: "text",
        });

        await db.update(leads).set({ status: "contacted" }).where(eq(leads.id, lead.id));
        await db.insert(outreachLogs).values({ leadId: lead.id, status: "sent" });
      } else {
        const completion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: config?.agent2Prompt || "Abordagem curta e direta." },
            {
              role: "user",
              content: `DADOS DO LEAD:
Empresa: ${lead.name}
Nicho: ${lead.niche}
Localização: ${lead.city}, ${lead.state}
Análise Técnica: ${lead.aiAnalysis}`,
            },
          ],
          model: "llama-3.3-70b-versatile",
        });
        const message = completion.choices[0].message.content;

        const response = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: instanceToken as string,
          },
          body: JSON.stringify({ number: lead.phone, text: message, delay: 1200, linkPreview: true }),
        });

        if (!response.ok) {
          await response.text(); // consume body
          continue;
        }

        await db.update(leads).set({ status: "contacted" }).where(eq(leads.id, lead.id));
        await db.insert(outreachLogs).values({ leadId: lead.id, status: "sent" });
      }
    } catch (_e) {
    }
  }
  revalidatePath("/");
  return { success: true };
}

export async function followUpLeadsAction(campaignId?: number) {
  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;
  if (!userId) return { success: false, error: "Usuário não autenticado." };

  const [dbUser] = await db.select().from(users).where(eq(users.id, userId));
  const [config] = await db
    .select()
    .from(campaignConfigs)
    .where(eq(campaignConfigs.userId, userId));

  const instanceName = dbUser?.whatsappInstanceName;
  const instanceToken = dbUser?.whatsappInstanceToken;
  const evolutionUrl = process.env.EVOLUTION_API_URL || "https://api.evolution.com";

  if (!instanceName || !instanceToken) {
    return { success: false, error: "WhatsApp não configurado." };
  }

  // Buscar leads contactados
  const conditions = [eq(leads.status, "contacted"), eq(leads.userId, userId)];
  if (campaignId) conditions.push(eq(leads.campaignId, campaignId));

  const contactedLeads = await db
    .select()
    .from(leads)
    .where(and(...conditions))
    .limit(config?.weeklyLimit || 5);

  let count = 0;
  for (const lead of contactedLeads) {
    if (!lead.phone) continue;

    // Verificar se o lead respondeu (se tem mensagens do usuário)
    const history = await db.select().from(chatHistory).where(eq(chatHistory.leadId, lead.id));
    const hasUserReply = history.some((h) => h.role === "user");

    // Só manda follow-up se o cliente ainda NÃO respondeu
    if (!hasUserReply) {
      try {
        const completion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: config?.agent2Prompt || "SDR focado em follow-up." },
            {
              role: "user",
              content: `DADOS DO LEAD:
Empresa: ${lead.name}
Análise Técnica: ${lead.aiAnalysis}
O cliente não respondeu nosso primeiro contato. Gere UMA MENSAGEM CURTA DE FOLLOW-UP (bump) para tentar reengajar, ex: "Oi [Nome], conseguiu ver a mensagem acima?". Seja natural e breve.`,
            },
          ],
          model: "llama-3.3-70b-versatile",
        });
        const message = completion.choices[0].message.content;

        const response = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: instanceToken },
          body: JSON.stringify({ number: lead.phone, text: message, delay: 1200 }),
        });

        if (response.ok) {
          count++;
          await db.insert(chatHistory).values({
            leadId: lead.id,
            role: "assistant",
            content: message,
            type: "text",
          });
        }
      } catch (_e) {
      }
    }
  }
  revalidatePath("/");
  return { success: true, count };
}

export async function generateAiSuggestionAction(leadId: number) {
  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;
  if (!userId) return { success: false, error: "Usuário não autenticado." };

  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
  if (!lead) return { success: false, error: "Lead não encontrado." };

  const [config] = await db
    .select()
    .from(campaignConfigs)
    .where(eq(campaignConfigs.userId, userId));

  const systemPrompt = config?.agent2Prompt || "Vendedor B2B direto e amigável.";

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `DADOS DO LEAD:
Empresa: ${lead.name}
Nicho: ${lead.niche || ""}
Localização: ${lead.city || ""}, ${lead.state || ""}
Análise Técnica da IA: ${lead.aiAnalysis || "Nenhuma análise prévia."}

Gere uma sugestão de mensagem inicial de prospecção ou follow-up para este lead no WhatsApp. Seja natural, humano, breve e focado em gerar resposta. NÃO use placeholders.`,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });
    
    const message = completion.choices[0].message.content || "";
    return { success: true, suggestion: message.trim() };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
