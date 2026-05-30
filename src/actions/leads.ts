"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { chatHistory, leads } from "@/db/schema";
import { auth } from "@/lib/auth";

const VALID_STAGES = [
	"raw",
	"qualified",
	"in_queue",
	"contacted",
	"interested",
	"human_intervention",
	"discarded",
] as const;
type KanbanStage = (typeof VALID_STAGES)[number];

export async function getLeadChatAction(leadId: number) {
	const session = await auth();
	const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;
	if (!userId) return [];

	// Verify the lead belongs to the user first
	const [lead] = await db
		.select()
		.from(leads)
		.where(and(eq(leads.id, leadId), eq(leads.userId, userId)));
	if (!lead) return [];

	return db
		.select()
		.from(chatHistory)
		.where(eq(chatHistory.leadId, leadId))
		.orderBy(chatHistory.createdAt);
}

export async function moveLeadAction(leadId: number, newStatus: string) {
	if (!VALID_STAGES.includes(newStatus as KanbanStage)) {
		return { success: false, error: "Status inválido." };
	}

	const session = await auth();
	const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;
	if (!userId) return { success: false, error: "Usuário não autenticado." };

	try {
		const [lead] = await db
			.select()
			.from(leads)
			.where(and(eq(leads.id, leadId), eq(leads.userId, userId)));
		if (!lead) return { success: false, error: "Lead não encontrado." };

		await db
			.update(leads)
			.set({ status: newStatus as KanbanStage, updatedAt: new Date() })
			.where(eq(leads.id, leadId));
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
		const [lead] = await db
			.select()
			.from(leads)
			.where(and(eq(leads.id, leadId), eq(leads.userId, userId)));
		if (!lead) return { success: false, error: "Lead não encontrado." };

		await db.delete(leads).where(eq(leads.id, leadId));
		revalidatePath("/");
		return { success: true };
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		return { success: false, error: message };
	}
}

export async function updateLeadAction(
	leadId: number,
	data: {
		name?: string;
		phone?: string;
		website?: string;
		niche?: string;
		city?: string;
		state?: string;
	},
) {
	const session = await auth();
	const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;
	if (!userId) return { success: false, error: "Usuário não autenticado." };

	try {
		const [lead] = await db
			.select()
			.from(leads)
			.where(and(eq(leads.id, leadId), eq(leads.userId, userId)));
		if (!lead) return { success: false, error: "Lead não encontrado." };

		await db
			.update(leads)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(leads.id, leadId));
		revalidatePath("/");
		return { success: true };
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		return { success: false, error: message };
	}
}

export async function getConversationsAction() {
	const session = await auth();
	const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;
	if (!userId) return [];

	try {
		const results = await db
			.select({
				lead: leads,
				lastMessage: {
					content: chatHistory.content,
					createdAt: chatHistory.createdAt,
					role: chatHistory.role,
				},
			})
			.from(leads)
			.innerJoin(chatHistory, eq(leads.id, chatHistory.leadId))
			.where(eq(leads.userId, userId))
			.orderBy(desc(chatHistory.createdAt));

		const uniqueConversationsMap = new Map<number, any>();
		for (const row of results) {
			if (!uniqueConversationsMap.has(row.lead.id)) {
				uniqueConversationsMap.set(row.lead.id, row);
			}
		}

		return Array.from(uniqueConversationsMap.values());
	} catch (_error) {
		return [];
	}
}
