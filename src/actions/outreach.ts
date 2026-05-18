"use server";

import { db } from "@/db";
import { leads, campaignConfigs, outreachLogs } from "@/db/schema";
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

    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: "system", content: prompt + " Retorne JSON: {score: number, analysis: string}" }, { role: "user", content: JSON.stringify(lead) }],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
      });
      const result = JSON.parse(completion.choices[0].message.content || "{}");
      await db.update(leads).set({ aiScore: result.score, aiAnalysis: result.analysis, status: result.score >= 7 ? "qualified" : "discarded" }).where(eq(leads.id, id));
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

  const [config] = await db.select().from(campaignConfigs).where(eq(campaignConfigs.userId, userId));
  const evolutionUrl = process.env.EVOLUTION_API_URL;
  const evolutionKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE;
  if (!evolutionUrl || !evolutionKey || !instance) return { success: false, error: "Erro Config" };

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
      await fetch(`${evolutionUrl}/message/sendText/${instance}`, {
        method: "POST", headers: { "Content-Type": "application/json", "apikey": evolutionKey },
        body: JSON.stringify({ number: lead.phone, text: message, delay: 1200, linkPreview: true }),
      });
      await db.update(leads).set({ status: "contacted" }).where(eq(leads.id, lead.id));
      await db.insert(outreachLogs).values({ leadId: lead.id, status: "sent" });
    } catch (e) { console.error(e); }
  }
  revalidatePath("/");
  return { success: true };
}