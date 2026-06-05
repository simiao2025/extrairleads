import OpenAI from "openai";
import { and, desc, eq, sql as drizzleSql } from "drizzle-orm";
import { db } from "@/db";
import { appointments, campaignConfigs, chatHistory, leads } from "@/db/schema";
import { getSemanticCache, saveSemanticCache } from "@/lib/cache";
import { z } from "zod";

const groq = new OpenAI({
	apiKey: process.env.GROQ_API_KEY,
	baseURL: "https://api.groq.com/openai/v1",
});

async function getSemanticContext(ownerUserId: number | null, textContent: string): Promise<string> {
	if (!ownerUserId || !process.env.OPENAI_API_KEY) return "";
	try {
		const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
		const queryEmbeddingResponse = await openai.embeddings.create({
			model: "text-embedding-3-small",
			input: textContent,
		});
		const queryEmbedding = queryEmbeddingResponse.data[0].embedding;
		const vectorStr = `[${queryEmbedding.join(",")}]`;

		const similarityQuery = drizzleSql`
			SELECT title, content 
			FROM knowledge_base 
			WHERE user_id = ${ownerUserId}
			ORDER BY embedding <=> ${vectorStr}::vector
			LIMIT 3
		`;
		const relatedDocs = await db.execute(similarityQuery);

		if (relatedDocs.rows && relatedDocs.rows.length > 0) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return relatedDocs.rows.map((row: any) => `- ${row.title}: ${row.content}`).join("\n");
		}
	} catch (err) {
		console.error("[getSemanticContext] Erro:", err);
	}
	return "";
}

async function getChatHistory(leadId: number): Promise<string> {
	const history = await db
		.select()
		.from(chatHistory)
		.where(eq(chatHistory.leadId, leadId))
		.orderBy(desc(chatHistory.createdAt))
		.limit(10);

	return history
		.reverse()
		.map((h) => `${h.role === "user" ? "Cliente" : "SDR"}: ${h.content}`)
		.join("\n");
}

const updateLeadSchema = z.object({
	name: z.string().min(1),
	niche: z.string().optional(),
	city: z.string().optional(),
	state: z.string().optional(),
	website: z.string().optional(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleToolsExecution(toolCalls: any[], lead: any) {
	let forceAudio = false;
	let overrideText = "";

	for (const toolCall of toolCalls) {
		const toolName = toolCall.function.name;
		
		try {
			const toolArgs = JSON.parse(toolCall.function.arguments);

			if (toolName === "update_lead_info") {
				const parsed = updateLeadSchema.parse(toolArgs);
				await db
					.update(leads)
					.set({
						name: parsed.name,
						niche: parsed.niche || lead.niche,
						city: parsed.city || lead.city,
						state: parsed.state || lead.state,
						website: parsed.website || lead.website,
						status: "qualified",
						updatedAt: new Date(),
					})
					.where(eq(leads.id, lead.id));
			} else if (toolName === "create_appointment") {
				const scheduledDate = new Date(toolArgs.dateStr);
				await db.insert(appointments).values({
					leadId: lead.id,
					scheduledAt: scheduledDate,
					notes: toolArgs.notes || "Agendado autonomamente via IA SDR",
					status: "confirmed",
				});
				await db.update(leads).set({ status: "interested" }).where(eq(leads.id, lead.id));
			} else if (toolName === "escalate_to_human") {
				await db.update(leads).set({ status: "human_intervention" }).where(eq(leads.id, lead.id));
			} else if (toolName === "send_voice_note") {
				forceAudio = true;
				overrideText = toolArgs.text_to_speak;
			}
		} catch (err) {
			console.error(`Erro ao executar ferramenta ${toolName}:`, err);
		}
	}

	return { forceAudio, overrideText };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function processAIResponse(lead: any, textContent: string, ownerUserId: number | null) {
	const ragContext = await getSemanticContext(ownerUserId, textContent);
	const formattedHistory = await getChatHistory(lead.id);

	let aiResponseText = ownerUserId ? await getSemanticCache(ownerUserId, textContent) : null;
	let forceAudio = false;

	if (!aiResponseText) {
		const [config] = ownerUserId
			? await db.select().from(campaignConfigs).where(eq(campaignConfigs.userId, ownerUserId))
			: [];

		const systemPrompt = `${config?.agent2Prompt || "Você é um SDR focado em abordagens."}

DADOS E ANÁLISE PRÉVIA DO LEAD:
- Empresa/Contato: ${lead.name}
- Segmento/Nicho: ${lead.niche || "Não informado"}
- Cidade: ${lead.city || "Não informada"}
- Site: ${lead.website || "Não informado"}
- Dossiê Mapeado: ${lead.aiAnalysis || "Nenhuma análise prévia disponível."}

DIRETRIZES DE AUTONOMIA:
- Chame 'update_lead_info' para atualizar dados da empresa.
- Chame 'create_appointment' para fechar agendamentos.
- Chame 'escalate_to_human' para transbordo.
- Chame 'send_voice_note' estrategicamente para enviar áudios curtos.

BASE DE CONHECIMENTO (RAG):
${ragContext || "Nenhuma informação cadastrada."}

HISTÓRICO DA CONVERSA:
${formattedHistory}
`;

		const tools = [
			{
				type: "function" as const,
				function: {
					name: "update_lead_info",
					description: "Atualiza dados cadastrais da empresa/lead e muda status para qualificado.",
					parameters: {
						type: "object",
						properties: {
							name: { type: "string", description: "Nome real da empresa/contato." },
							niche: { type: "string" },
							city: { type: "string" },
							state: { type: "string" },
							website: { type: "string" },
						},
						required: ["name"],
					},
				},
			},
			{
				type: "function" as const,
				function: {
					name: "create_appointment",
					description: "Agenda uma reunião oficial na agenda com o lead.",
					parameters: {
						type: "object",
						properties: {
							dateStr: { type: "string", description: "Data/hora ISO: '2026-05-20T14:00:00Z'" },
							notes: { type: "string" },
						},
						required: ["dateStr"],
					},
				},
			},
			{
				type: "function" as const,
				function: {
					name: "escalate_to_human",
					description: "Transborda para um humano.",
					parameters: {
						type: "object",
						properties: { reason: { type: "string" } },
						required: ["reason"],
					},
				},
			},
			{
				type: "function" as const,
				function: {
					name: "send_voice_note",
					description: "Envia áudio natural curto.",
					parameters: {
						type: "object",
						properties: { text_to_speak: { type: "string" } },
						required: ["text_to_speak"],
					},
				},
			},
		];

		const completion = await groq.chat.completions.create({
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: textContent },
			],
			model: "llama-3.3-70b-versatile",
			tools,
			tool_choice: "auto",
		});

		const choice = completion.choices[0];
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const toolCalls = choice.message.tool_calls as any[];
		aiResponseText = choice.message.content || "";

		if (toolCalls && toolCalls.length > 0) {
			const execution = await handleToolsExecution(toolCalls, lead);
			forceAudio = execution.forceAudio;
			const overrideText = execution.overrideText;

			if (overrideText) {
				aiResponseText = overrideText;
			} else {
				const secondCompletion = await groq.chat.completions.create({
					messages: [
						{ role: "system", content: systemPrompt },
						{ role: "user", content: textContent },
						choice.message,
						...toolCalls.map((tc) => ({
							role: "tool" as const,
							tool_call_id: tc.id,
							name: tc.function.name,
							content: "Success",
						})),
					],
					model: "llama-3.3-70b-versatile",
				});
				aiResponseText = secondCompletion.choices[0].message.content || "";
			}
		}

		if (aiResponseText.trim() && (!toolCalls || toolCalls.length === 0) && ownerUserId) {
			await saveSemanticCache(ownerUserId, textContent, aiResponseText);
		}
	}

	return { aiResponseText, forceAudio };
}
