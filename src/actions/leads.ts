"use server";

import { db } from "@/db";
import { leads, chatHistory } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

const VALID_STAGES = ["raw", "qualified", "in_queue", "contacted", "interested", "discarded"] as const;
type KanbanStage = typeof VALID_STAGES[number];

export async function getLeadChatAction(leadId: number) {
  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;
  if (!userId) return [];

  // Verify the lead belongs to the user first
  const [lead] = await db.select().from(leads).where(and(eq(leads.id, leadId), eq(leads.userId, userId)));
  if (!lead) return [];

  return db.select().from(chatHistory).where(eq(chatHistory.leadId, leadId)).orderBy(chatHistory.createdAt);
}

export async function moveLeadAction(leadId: number, newStatus: string) {
  if (!VALID_STAGES.includes(newStatus as KanbanStage)) {
    return { success: false, error: "Status inválido." };
  }

  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;
  if (!userId) return { success: false, error: "Usuário não autenticado." };

  try {
    const [lead] = await db.select().from(leads).where(and(eq(leads.id, leadId), eq(leads.userId, userId)));
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
  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;
  if (!userId) return { success: false, error: "Usuário não autenticado." };

  try {
    const [lead] = await db.select().from(leads).where(and(eq(leads.id, leadId), eq(leads.userId, userId)));
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
  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;
  if (!userId) return { success: false, error: "Usuário não autenticado." };

  try {
    const [lead] = await db.select().from(leads).where(and(eq(leads.id, leadId), eq(leads.userId, userId)));
    if (!lead) return { success: false, error: "Lead não encontrado." };

    await db.update(leads).set({ ...data, updatedAt: new Date() }).where(eq(leads.id, leadId));
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}