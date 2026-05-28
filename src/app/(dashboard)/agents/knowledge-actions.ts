"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import OpenAI from "openai";
import { db } from "@/db";
import { knowledgeBase } from "@/db/schema";
import { auth } from "@/lib/auth";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getKnowledgeBaseAction() {
  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;
  if (!userId) return [];

  return db
    .select({
      id: knowledgeBase.id,
      title: knowledgeBase.title,
      content: knowledgeBase.content,
      createdAt: knowledgeBase.createdAt,
    })
    .from(knowledgeBase)
    .where(eq(knowledgeBase.userId, userId))
    .orderBy(desc(knowledgeBase.createdAt));
}

export async function saveKnowledgeAction(formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;
  if (!userId) throw new Error("Usuário não autenticado.");

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  if (!title || !content) {
    throw new Error("Título e conteúdo são obrigatórios.");
  }
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: content,
  });

  const embedding = embeddingResponse.data[0].embedding;

  // 2. Salvar no Banco de Dados
  await db.insert(knowledgeBase).values({
    userId,
    title,
    content,
    embedding,
  });

  revalidatePath("/knowledge");
  revalidatePath("/");
}

export async function deleteKnowledgeAction(id: number) {
  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;
  if (!userId) throw new Error("Usuário não autenticado.");

  await db
    .delete(knowledgeBase)
    .where(and(eq(knowledgeBase.id, id), eq(knowledgeBase.userId, userId)));

  revalidatePath("/knowledge");
  revalidatePath("/");
}

export async function updateKnowledgeAction(id: number, title: string, content: string) {
  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;
  if (!userId) throw new Error("Usuário não autenticado.");

  if (!title || !content) {
    throw new Error("Título e conteúdo são obrigatórios.");
  }

  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: content,
  });

  const embedding = embeddingResponse.data[0].embedding;

  await db
    .update(knowledgeBase)
    .set({
      title,
      content,
      embedding,
    })
    .where(and(eq(knowledgeBase.id, id), eq(knowledgeBase.userId, userId)));

  revalidatePath("/knowledge");
  revalidatePath("/");
}
