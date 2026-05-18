"use server";

import { db } from "@/db";
import { leads, chatHistory } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

const VALID_STAGES = ["raw", "qualified", "in_queue", "contacted", "interested", "discarded"] as const;
type KanbanStage = typeof VALID_STAGES[number];

export async function getLeadChatAction(leadId: number) {
  return db.select().from(chatHistory).where(eq(chatHistory.leadId, leadId)).orderBy(chatHistory.createdAt);
}

export async function moveLeadAction(leadId: number, newStatus: string) {
  if (!VALID_STAGES.includes(newStatus as KanbanStage)) {
    return { success: false, error: "Status inválido." };
  }

  try {
    const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
    if (!lead) return { success: false, error: "Lead não encontrado." };

    await db.update(leads).set({ status: newStatus as KanbanStage, updatedAt: new Date() }).where(eq(leads.id, leadId));
    revalidatePath("/");
    return { success: true, newStatus };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

export async function deleteLeadAction(leadId: number) {
  try {
    const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
    if (!lead) return { success: false, error: "Lead não encontrado." };

    await db.delete(leads).where(eq(leads.id, leadId));
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

export async function updateLeadAction(leadId: number, data: {
  name?: string;
  phone?: string;
  website?: string;
  niche?: string;
  city?: string;
  state?: string;
}) {
  try {
    const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
    if (!lead) return { success: false, error: "Lead não encontrado." };

    await db.update(leads).set({ ...data, updatedAt: new Date() }).where(eq(leads.id, leadId));
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}