"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import OpenAI from "openai";
import { db } from "@/db";
import { campaignConfigs, chatHistory, leads, outreachLogs, users } from "@/db/schema";
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
      const _isQualified = scoreNum >= 7;

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

export async function qualifyPendingLeadsAction() {
  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;
  if (!userId) return { success: false, error: "Usuário não autenticado." };

  const rawLeads = await db
    .select()
    .from(leads)
    .where(and(eq(leads.status, "raw"), eq(leads.userId, userId)));
  if (rawLeads.length === 0)
    return { success: true, count: 0, message: "Nenhum lead pendente de análise." };

  await qualifyLeadsAction(rawLeads.map((l) => l.id));
  revalidatePath("/");
  return { success: true, count: rawLeads.length };
}

export async function startOutreachAction() {
  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;
  if (!userId) return { success: false, error: "Usuário não autenticado." };

  const [dbUser] = await db.select().from(users).where(eq(users.id, userId));
  const [config] = await db
    .select()
    .from(campaignConfigs)
    .where(eq(campaignConfigs.userId, userId));

  const evolutionUrl = process.env.EVOLUTION_API_URL;
  const instanceName = dbUser?.whatsappInstanceName;
  const instanceToken = dbUser?.whatsappInstanceToken;

  if (!evolutionUrl || !instanceName || !instanceToken) {
    return {
      success: false,
      error: "WhatsApp não configurado. Vá em Configurações para emparelhar seu WhatsApp primeiro.",
    };
  }

  const qualifiedLeads = await db
    .select()
    .from(leads)
    .where(and(eq(leads.status, "qualified"), eq(leads.userId, userId)))
    .limit(config?.weeklyLimit || 5);

  for (const lead of qualifiedLeads) {
    if (!lead.phone) continue;
    try {
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
          apikey: instanceToken, // Token individual da instância
        },
        body: JSON.stringify({ number: lead.phone, text: message, delay: 1200, linkPreview: true }),
      });

      if (!response.ok) {
        const _errTxt = await response.text();
        continue;
      }

      await db.update(leads).set({ status: "contacted" }).where(eq(leads.id, lead.id));
      await db.insert(outreachLogs).values({ leadId: lead.id, status: "sent" });
    } catch (_e) {
    }
  }
  revalidatePath("/");
  return { success: true };
}

export async function followUpLeadsAction() {
  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;
  if (!userId) return { success: false, error: "Usuário não autenticado." };

  const [dbUser] = await db.select().from(users).where(eq(users.id, userId));
  const [config] = await db
    .select()
    .from(campaignConfigs)
    .where(eq(campaignConfigs.userId, userId));

  const evolutionUrl = process.env.EVOLUTION_API_URL;
  const instanceName = dbUser?.whatsappInstanceName;
  const instanceToken = dbUser?.whatsappInstanceToken;

  if (!evolutionUrl || !instanceName || !instanceToken) {
    return { success: false, error: "WhatsApp não configurado." };
  }

  // Buscar leads contactados
  const contactedLeads = await db
    .select()
    .from(leads)
    .where(and(eq(leads.status, "contacted"), eq(leads.userId, userId)))
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
