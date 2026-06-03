import crypto from "node:crypto";
import { sql as drizzleSql, eq } from "drizzle-orm";
import OpenAI from "openai";
import { db } from "@/db";
import { semanticCache, ttsAudioCache } from "@/db/schema";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Retorna o áudio base64 se já estiver cacheado para o respectivo texto.
 */
export async function getCachedAudio(text: string): Promise<string | null> {
	try {
		const cleanText = text.trim();
		if (!cleanText) return null;

		const hash = crypto.createHash("sha256").update(cleanText).digest("hex");
		const [cached] = await db
			.select()
			.from(ttsAudioCache)
			.where(eq(ttsAudioCache.textHash, hash));

		return cached ? cached.base64Audio : null;
	} catch (error) {
		console.error("Erro ao ler cache de áudio:", error);
		return null;
	}
}

/**
 * Salva o áudio base64 no banco de dados para evitar reprocessamento do TTS.
 */
export async function saveCachedAudio(
	text: string,
	base64Audio: string,
): Promise<void> {
	try {
		const cleanText = text.trim();
		if (!cleanText || !base64Audio) return;

		const hash = crypto.createHash("sha256").update(cleanText).digest("hex");
		await db
			.insert(ttsAudioCache)
			.values({
				textHash: hash,
				text: cleanText,
				base64Audio,
			})
			.onConflictDoNothing();
	} catch (error) {
		console.error("Erro ao salvar cache de áudio:", error);
	}
}

/**
 * Realiza uma busca vetorial no cache de respostas (RAG Cache).
 * Retorna a resposta se a similaridade de cosseno for maior que 96% (distância < 0.04).
 */
export async function getSemanticCache(
	userId: number | null,
	queryText: string,
): Promise<string | null> {
	if (!userId || !queryText.trim()) return null;
	try {
		// 1. Gerar o embedding da pergunta
		const queryEmbeddingResponse = await openai.embeddings.create({
			model: "text-embedding-3-small",
			input: queryText.trim(),
		});
		const queryEmbedding = queryEmbeddingResponse.data[0].embedding;
		const vectorStr = `[${queryEmbedding.join(",")}]`;

		// 2. Buscar no cache filtrando por distância cosseno
		const similarityQuery = drizzleSql`
			SELECT response, (embedding <=> ${vectorStr}::vector) AS distance
			FROM semantic_cache
			WHERE user_id = ${userId}
			ORDER BY embedding <=> ${vectorStr}::vector
			LIMIT 1
		`;
		const result = await db.execute(similarityQuery);

		if (result.rows && result.rows.length > 0) {
			const row = result.rows[0] as any;
			const distance = Number(row.distance);
			// Distância de cosseno < 0.04 equivale a similaridade > 96%
			if (distance < 0.04) {
				return row.response;
			}
		}
	} catch (error) {
		console.error("Erro ao ler cache semântico:", error);
	}
	return null;
}

/**
 * Armazena a pergunta e resposta geradas no cache semântico de embeddings.
 */
export async function saveSemanticCache(
	userId: number | null,
	queryText: string,
	responseText: string,
): Promise<void> {
	if (!userId || !queryText.trim() || !responseText.trim()) return;
	try {
		// 1. Gerar embedding para salvar
		const queryEmbeddingResponse = await openai.embeddings.create({
			model: "text-embedding-3-small",
			input: queryText.trim(),
		});
		const queryEmbedding = queryEmbeddingResponse.data[0].embedding;

		// 2. Salvar no banco
		await db.insert(semanticCache).values({
			userId,
			query: queryText.trim(),
			response: responseText.trim(),
			embedding: queryEmbedding,
		});
	} catch (error) {
		console.error("Erro ao salvar cache semântico:", error);
	}
}
