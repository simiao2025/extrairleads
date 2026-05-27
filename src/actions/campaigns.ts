"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { campaigns, leads } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function createCampaignAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Não autorizado");
  }

  const userId = parseInt(session.user.id, 10);
  const name = formData.get("name") as string;
  const niche = formData.get("niche") as string;
  const city = formData.get("city") as string;
  const state = formData.get("state") as string;
  const autoOutreach = (formData.get("autoOutreach") as string) || "false";
  const metaTemplateName = (formData.get("metaTemplateName") as string) || null;

  if (!name || !niche || !city) {
    throw new Error("Nome, nicho e cidade são obrigatórios.");
  }

  await db.insert(campaigns).values({
    userId,
    name,
    niche,
    city,
    state,
    autoOutreach,
    metaTemplateName,
  });

  revalidatePath("/campaigns");
}

export async function deleteCampaignAction(campaignId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Não autorizado");
  }

  const userId = parseInt(session.user.id, 10);

  // Verify ownership
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId));

  if (!campaign || campaign.userId !== userId) {
    throw new Error("Campanha não encontrada ou não autorizada");
  }

  await db.delete(campaigns).where(eq(campaigns.id, campaignId));
  revalidatePath("/campaigns");
}

export async function toggleCampaignAutomationAction(campaignId: number, autoOutreach: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Não autorizado");
  }

  const userId = parseInt(session.user.id, 10);

  // Verify ownership
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId));

  if (!campaign || campaign.userId !== userId) {
    throw new Error("Campanha não encontrada ou não autorizada");
  }

  await db.update(campaigns).set({ autoOutreach }).where(eq(campaigns.id, campaignId));

  revalidatePath("/campaigns");
}

export async function getCampaignDetailsAction(campaignId: number) {
  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;
  if (!userId) return null;

  try {
    // 1. Buscar a campanha garantindo propriedade
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)));

    if (!campaign) return null;

    // 2. Buscar estatísticas dos leads dessa campanha
    const [stats] = await db
      .select({
        total: sql<number>`count(${leads.id})`,
        qualified: sql<number>`count(CASE WHEN ${leads.status} = 'qualified' THEN 1 END)`,
        contacted: sql<number>`count(CASE WHEN ${leads.status} = 'contacted' THEN 1 END)`,
        interested: sql<number>`count(CASE WHEN ${leads.status} = 'interested' THEN 1 END)`,
        humanIntervention: sql<number>`count(CASE WHEN ${leads.status} = 'human_intervention' THEN 1 END)`,
      })
      .from(leads)
      .where(eq(leads.campaignId, campaignId));

    // 3. Buscar os leads dessa campanha
    const campaignLeads = await db
      .select()
      .from(leads)
      .where(eq(leads.campaignId, campaignId))
      .orderBy(leads.createdAt);

    return {
      campaign,
      stats: stats || { total: 0, qualified: 0, contacted: 0, interested: 0, humanIntervention: 0 },
      leads: campaignLeads,
    };
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: error logging is required for server actions diagnostics
    console.error("Erro ao carregar detalhes da campanha:", error);
    return null;
  }
}
