"use server";

import { db } from "@/db";
import { leads, campaignConfigs, outreachLogs, users } from "@/db/schema";
import { revalidatePath } from "next/cache";
import OpenAI from "openai";
import { eq, and } from "drizzle-orm";
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
      .map((r: any) => `- Nota ${r.rating}: "${r.snippet || r.text || ""}" (${r.date || "recente"})`)
      .join("\n");

    const formattedPrompt = prompt
      .replace(/{nome}/g, lead.name || "")
      .replace(/{categoria}/g, lead.niche || meta.category || "")
      .replace(/{categorias_adicionais}/g, Array.isArray(meta.additionalCategories) ? meta.additionalCategories.join(", ") : "")
      .replace(/{endereco}/g, meta.address || "")
      .replace(/{cidade}/g, lead.city || "")
      .replace(/{bairro}/g, meta.suburb || meta.neighborhood || "")
      .replace(/{site}/g, lead.website || "null")
      .replace(/{redes}/g, Array.isArray(meta.socialMedia) ? meta.socialMedia.join(", ") : "Nenhuma")
      .replace(/{fotos}/g, meta.photosCount || "0")
      .replace(/{nota}/g, String(meta.rating || ""))
      .replace(/{total_avaliacoes}/g, String(meta.reviewsCount || "0"))
      .replace(/{texto, nota, data}/g, reviewsText || "Nenhuma avaliação recente")
      .replace(/{horario}/g, meta.operatingHours || "Não especificado")
      .replace(/{faixa_preco}/g, meta.priceRange || "Não especificado")
      .replace(/{atributos}/g, Array.isArray(meta.attributes) ? meta.attributes.join(", ") : "Nenhum")
      .replace(/{data_criacao_perfil}/g, meta.profileAge || "Não especificado");

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: formattedPrompt },
          { role: "user", content: `Analise as informações do seguinte lead: ${JSON.stringify(lead)}` }
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
      });
      const result = JSON.parse(completion.choices[0].message.content || "{}");
      const scoreNum = Number(result.score) || 0;
      const parsedScore = Math.round(scoreNum);
      const isQualified = scoreNum >= 7;

      await db
        .update(leads)
        .set({ 
          aiScore: parsedScore, 
          aiAnalysis: result.analysis, 
          status: "qualified",
          updatedAt: new Date()
        })
        .where(eq(leads.id, id));
    } catch (e) { console.error(e); }
  }
}

export async function qualifyPendingLeadsAction() {
  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;
  if (!userId) return { success: false, error: "Usuário não autenticado." };

  const rawLeads = await db.select().from(leads).where(and(eq(leads.status, "raw"), eq(leads.userId, userId)));
  if (rawLeads.length === 0) return { success: true, count: 0, message: "Nenhum lead pendente de análise." };

  await qualifyLeadsAction(rawLeads.map(l => l.id));
  revalidatePath("/");
  return { success: true, count: rawLeads.length };
}

export async function startOutreachAction() {
  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;
  if (!userId) return { success: false, error: "Usuário não autenticado." };

  const [dbUser] = await db.select().from(users).where(eq(users.id, userId));
  const [config] = await db.select().from(campaignConfigs).where(eq(campaignConfigs.userId, userId));
  
  const evolutionUrl = process.env.EVOLUTION_API_URL;
  const instanceName = dbUser?.whatsappInstanceName;
  const instanceToken = dbUser?.whatsappInstanceToken;

  if (!evolutionUrl || !instanceName || !instanceToken) {
    return { 
      success: false, 
      error: "WhatsApp não configurado. Vá em Configurações para emparelhar seu WhatsApp primeiro." 
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
          { role: "user", content: `DADOS DO LEAD:
Empresa: ${lead.name}
Nicho: ${lead.niche}
Localização: ${lead.city}, ${lead.state}
Análise Técnica: ${lead.aiAnalysis}` }
        ],
        model: "llama-3.3-70b-versatile",
      });
      const message = completion.choices[0].message.content;
      
      console.log(`[Outreach] Enviando mensagem via Evolution Go para lead ${lead.name} (${lead.phone}) usando instância ${instanceName}`);
      
      const response = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
        method: "POST", 
        headers: { 
          "Content-Type": "application/json", 
          "apikey": instanceToken // Token individual da instância
        },
        body: JSON.stringify({ number: lead.phone, text: message, delay: 1200, linkPreview: true }),
      });

      if (!response.ok) {
        const errTxt = await response.text();
        console.error(`Erro ao enviar mensagem para ${lead.phone}:`, errTxt);
        continue;
      }

      await db.update(leads).set({ status: "contacted" }).where(eq(leads.id, lead.id));
      await db.insert(outreachLogs).values({ leadId: lead.id, status: "sent" });
    } catch (e) { console.error(e); }
  }
  revalidatePath("/");
  return { success: true };
}