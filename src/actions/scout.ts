"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { scoutMemory } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function saveScoutMemoryAction(
	type: string,
	content: string,
	metadata?: Record<string, unknown>,
) {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error("Não autorizado");
	}

	const userId = parseInt(session.user.id, 10);

	await db.insert(scoutMemory).values({
		userId,
		type,
		content,
		metadata: metadata ?? null,
	});

	revalidatePath("/");
}

export async function getScoutMemoriesAction() {
	const session = await auth();
	if (!session?.user?.id) {
		return [];
	}

	const userId = parseInt(session.user.id, 10);

	return db
		.select()
		.from(scoutMemory)
		.where(eq(scoutMemory.userId, userId))
		.orderBy(desc(scoutMemory.createdAt))
		.limit(20);
}

export async function clearScoutMemoryAction() {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error("Não autorizado");
	}

	const userId = parseInt(session.user.id, 10);

	await db.delete(scoutMemory).where(eq(scoutMemory.userId, userId));

	revalidatePath("/");
}
