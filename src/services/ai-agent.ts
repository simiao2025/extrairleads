import { desc, sql as drizzleSql, eq } from "drizzle-orm";
import OpenAI from "openai";
import { z } from "zod";
import { db } from "@/db";
import { appointments, campaignConfigs, chatHistory, leads } from "@/db/schema";
import { getSemanticCache, saveSemanticCache } from "@/lib/cache";
import { buildConversationPrompt } from "@/lib/prompts";

const groq = new OpenAI({
	apiKey: process.env.GROQ_API_KEY || "dummy-key-to-prevent-crash",
	baseURL: "https://api.groq.com/openai/v1",
});

export async function getSemanticContext(
	ownerUserId: number | null,
	textContent: string,
): Promise<string> {
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
			return relatedDocs.rows
				.map((row: any) => `- ${row.title}: ${row.content}`)
				.join("\n");
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
				await db
					.update(leads)
					.set({ status: "interested" })
					.where(eq(leads.id, lead.id));
			} else if (toolName === "escalate_to_human") {
				await db
					.update(leads)
					.set({ status: "human_intervention" })
					.where(eq(leads.id, lead.id));
			}
			// send_voice_note removido — sem envio de áudio
		} catch (err) {
			console.error(`Erro ao executar ferramenta ${toolName}:`, err);
		}
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function processAIResponse(
	lead: any,
	textContent: string,
	ownerUserId: number | null,
) {
	const ragContext = await getSemanticContext(ownerUserId, textContent);
	const formattedHistory = await getChatHistory(lead.id);

	let aiResponseText = ownerUserId
		? await getSemanticCache(ownerUserId, textContent)
		: null;

	if (!aiResponseText) {
		const [config] = ownerUserId
			? await db
					.select()
					.from(campaignConfigs)
					.where(eq(campaignConfigs.userId, ownerUserId))
			: [];

		const systemPrompt = buildConversationPrompt({
			agent2Prompt: config?.agent2Prompt ?? undefined,
			lead: {
				name: lead.name,
				niche: lead.niche,
				city: lead.city,
				state: lead.state,
				website: lead.website,
				aiAnalysis: lead.aiAnalysis,
			},
			ragContext,
			formattedHistory,
		});

		const tools = [
			{
				type: "function" as const,
				function: {
					name: "update_lead_info",
					description:
						"Atualiza dados cadastrais da empresa/lead e muda status para qualificado.",
					parameters: {
						type: "object",
						properties: {
							name: {
								type: "string",
								description: "Nome real da empresa/contato.",
							},
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
							dateStr: {
								type: "string",
								description: "Data/hora ISO: '2026-05-20T14:00:00Z'",
							},
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
			await handleToolsExecution(toolCalls, lead);

			if (!aiResponseText?.trim()) {
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

		if (
			aiResponseText.trim() &&
			(!toolCalls || toolCalls.length === 0) &&
			ownerUserId
		) {
			await saveSemanticCache(ownerUserId, textContent, aiResponseText);
		}
	}

	return { aiResponseText };
}
