"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
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
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId));

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
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId));

  if (!campaign || campaign.userId !== userId) {
    throw new Error("Campanha não encontrada ou não autorizada");
  }

  await db
    .update(campaigns)
    .set({ autoOutreach })
    .where(eq(campaigns.id, campaignId));

  revalidatePath("/campaigns");
}
