"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import OpenAI from "openai";
import { db } from "@/db";
import {
	campaignConfigs,
	campaigns,
	chatHistory,
	leads,
	outreachLogs,
	scrapingJobs,
	users,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import {
	buildFollowUpPrompt,
	buildInitialOutreachPrompt,
	buildSuggestionPrompt,
} from "@/lib/prompts";

const groq = new OpenAI({
	apiKey: process.env.GROQ_API_KEY,
	baseURL: "https://api.groq.com/openai/v1",
});

export async function qualifyLeadsAction(leadIds: number[], jobId?: number) {
	let progress = 0;
	const CONCURRENCY_LIMIT = 4; // Process in parallel chunks of 4 to maximize speed while respecting Groq TPM

	async function qualifySingleLead(id: number, retries = 3): Promise<void> {
		const [lead] = await db.select().from(leads).where(eq(leads.id, id));
		if (!lead) return;

		// Load config specific to the lead's owner (userId)
		const [config] = lead.userId
			? await db
					.select()
					.from(campaignConfigs)
					.where(eq(campaignConfigs.userId, lead.userId))
			: [];
		const prompt = config?.agent1Prompt || "Qualifique o lead.";

		// Mapear metadados adicionais para preencher o prompt de qualificação
		const meta = (lead.metadata || {}) as any;
		const reviewsArr = Array.isArray(meta.reviews) ? meta.reviews : [];
		const reviewsText = reviewsArr
			.map(
				(r: any) =>
					`- Nota ${r.rating}: "${r.snippet || r.text || ""}" (${r.date || "recente"})`,
			)
			.join("\n");

		// Instrução de JSON limpa para alinhar com o banco e evitar conflitos cognitivos no Llama
		const cleanInstruction = `\n\nIMPORTANTE: Retorne EXCLUSIVAMENTE um objeto JSON válido contendo exatamente dois campos:
{
  "score": número (de 0 a 100),
  "analysis": "uma string contendo a sua análise estratégica completa"
}
Não adicione nenhum outro campo adicional ou aninhamento como 'score_breakdown' ou 'classificacao' no JSON final.`;

		const formattedPrompt = prompt
			.replace(/{nome}/g, lead.name || "")
			.replace(/{categoria}/g, lead.niche || meta.category || "")
			.replace(
				/{categorias_adicionais}/g,
				Array.isArray(meta.additionalCategories)
					? meta.additionalCategories.join(", ")
					: "",
			)
			.replace(/{endereco}/g, meta.address || "")
			.replace(/{cidade}/g, lead.city || "")
			.replace(/{bairro}/g, meta.suburb || meta.neighborhood || "")
			.replace(/{site}/g, lead.website || "null")
			.replace(
				/{redes}/g,
				Array.isArray(meta.socialMedia)
					? meta.socialMedia.join(", ")
					: "Nenhuma",
			)
			.replace(/{fotos}/g, meta.photosCount || "0")
			.replace(/{nota}/g, String(meta.rating || ""))
			.replace(/{total_avaliacoes}/g, String(meta.reviewsCount || "0"))
			.replace(
				/{texto, nota, data}/g,
				reviewsText || "Nenhuma avaliação recente",
			)
			.replace(/{horario}/g, meta.operatingHours || "Não especificado")
			.replace(/{faixa_preco}/g, meta.priceRange || "Não especificado")
			.replace(
				/{atributos}/g,
				Array.isArray(meta.attributes) ? meta.attributes.join(", ") : "Nenhum",
			)
			.replace(/{data_criacao_perfil}/g, meta.profileAge || "Não especificado");

		try {
			const completion = await groq.chat.completions.create({
				messages: [
					{
						role: "system",
						content: formattedPrompt + cleanInstruction,
					},
					{
						role: "user",
						content: `Analise as informações do seguinte lead: ${JSON.stringify(lead)}`,
					},
				],
				model: "llama-3.3-70b-versatile",
				response_format: { type: "json_object" },
			});
			const result = JSON.parse(completion.choices[0].message.content || "{}");
			const scoreNum = Number(result.score) || 0;
			const parsedScore = Math.round(scoreNum);

			await db
				.update(leads)
				.set({
					aiScore: parsedScore,
					aiAnalysis: result.analysis,
					status: "qualified",
					updatedAt: new Date(),
				})
				.where(eq(leads.id, id));
		} catch (e: any) {
			console.error(
				`Erro ao qualificar o lead ${id} (Tentativas restantes: ${retries}):`,
				e.message,
			);
			if (retries > 0) {
				const delay = e.status === 429 ? 6000 : 2000;
				await new Promise((resolve) => setTimeout(resolve, delay));
				return qualifySingleLead(id, retries - 1);
			}
		}
	}

	// Executa em lotes paralelos controlados para máximo ganho de performance
	for (let i = 0; i < leadIds.length; i += CONCURRENCY_LIMIT) {
		const chunk = leadIds.slice(i, i + CONCURRENCY_LIMIT);
		await Promise.all(
			chunk.map(async (id) => {
				await qualifySingleLead(id);
				progress++;
				if (jobId) {
					await db
						.update(scrapingJobs)
						.set({ currentProgress: progress })
						.where(eq(scrapingJobs.id, jobId));
				}
			}),
		);

		// Breve Throttle entre lotes para segurança de limite de token (TPM) da Groq
		if (i + CONCURRENCY_LIMIT < leadIds.length) {
			await new Promise((resolve) => setTimeout(resolve, 1500));
		}
	}
}

export async function qualifyPendingLeadsAction(campaignId?: number) {
	const session = await auth();
	const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;
	if (!userId) return { success: false, error: "Usuário não autenticado." };

	const conditions = [eq(leads.status, "raw"), eq(leads.userId, userId)];
	if (campaignId) conditions.push(eq(leads.campaignId, campaignId));

	const rawLeads = await db
		.select()
		.from(leads)
		.where(and(...conditions));
	if (rawLeads.length === 0)
		return {
			success: true,
			count: 0,
			message: "Nenhum lead pendente de análise.",
		};

	// Create a tracking job
	const [job] = await db
		.insert(scrapingJobs)
		.values({
			campaignId: campaignId || null,
			userId,
			status: "qualifying",
			totalExpected: rawLeads.length,
			currentProgress: 0,
			jobType: "qualify_only",
		})
		.returning();

	// Run in background — with proper error handling to avoid stuck jobs
	runQualifyJobInBackground(
		rawLeads.map((l) => l.id),
		job.id,
		campaignId,
		userId,
	).catch(async (err) => {
		console.error(`[qualifyBackground] Job ${job.id} falhou:`, err);
		try {
			await db
				.update(scrapingJobs)
				.set({ status: "failed" })
				.where(eq(scrapingJobs.id, job.id));
		} catch (dbErr) {
			console.error(
				`[qualifyBackground] Falha ao marcar job ${job.id} como failed:`,
				dbErr,
			);
		}
	});

	return { success: true, count: rawLeads.length, jobId: job.id };
}

async function runQualifyJobInBackground(
	leadIds: number[],
	jobId: number,
	campaignId?: number,
	userId?: number,
) {
	await qualifyLeadsAction(leadIds, jobId);
	await db
		.update(scrapingJobs)
		.set({ status: "completed" })
		.where(eq(scrapingJobs.id, jobId));

	if (campaignId) {
		const [campaign] = await db
			.select()
			.from(campaigns)
			.where(eq(campaigns.id, campaignId));
		if (campaign?.autoOutreach === "true") {
			await startOutreachAction(campaignId, userId);
		}
	}
	revalidatePath("/");
}

export async function startOutreachAction(
	campaignId?: number,
	backgroundUserId?: number | null,
) {
	const session = !backgroundUserId ? await auth() : null;
	const userId =
		backgroundUserId ||
		(session?.user?.id ? parseInt(session.user.id, 10) : null);
	if (!userId) return { success: false, error: "Usuário não autenticado." };

	const [dbUser] = await db.select().from(users).where(eq(users.id, userId));
	const [config] = await db
		.select()
		.from(campaignConfigs)
		.where(eq(campaignConfigs.userId, userId));

	const provider = dbUser?.whatsappProvider || "evolution";
	const evolutionUrl = process.env.EVOLUTION_API_URL;
	const instanceName = dbUser?.whatsappInstanceName;
	const instanceToken = dbUser?.whatsappInstanceToken;

	if (
		provider === "evolution" &&
		(!evolutionUrl || !instanceName || !instanceToken)
	) {
		return {
			success: false,
			error:
				"WhatsApp Evolution não configurado. Vá em Configurações para emparelhar seu WhatsApp primeiro.",
		};
	}

	if (
		provider === "meta_official" &&
		(!dbUser?.metaAccessToken || !dbUser?.metaPhoneNumberId)
	) {
		return {
			success: false,
			error: "Credenciais da Meta não configuradas. Vá em Configurações.",
		};
	}

	const conditions = [eq(leads.status, "qualified"), eq(leads.userId, userId)];
	if (campaignId) {
		conditions.push(eq(leads.campaignId, campaignId));
	}

	const qualifiedLeads = await db
		.select({
			lead: leads,
			campaignMetaTemplate: campaigns.metaTemplateName,
		})
		.from(leads)
		.leftJoin(campaigns, eq(leads.campaignId, campaigns.id))
		.where(and(...conditions))
		.limit(config?.weeklyLimit || 5);

	let sent = 0;
	let failed = 0;
	const errors: string[] = [];

	for (const { lead, campaignMetaTemplate } of qualifiedLeads) {
		if (!lead.phone) continue;
		try {
			if (provider === "meta_official") {
				if (!campaignMetaTemplate) {
					console.error(
						`[outreach] Lead ${lead.id}: Campanha sem Template Meta configurado`,
					);
					failed++;
					errors.push(`Lead ${lead.id}: template Meta ausente`);
					continue;
				}
				const phoneStr = lead.phone.replace(/\D/g, "");
				const metaResponse = await fetch(
					`https://graph.facebook.com/v19.0/${dbUser.metaPhoneNumberId}/messages`,
					{
						method: "POST",
						headers: {
							Authorization: `Bearer ${dbUser.metaAccessToken}`,
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							messaging_product: "whatsapp",
							recipient_type: "individual",
							to: phoneStr,
							type: "template",
							template: {
								name: campaignMetaTemplate,
								language: { code: "pt_BR" },
							},
						}),
					},
				);

				if (!metaResponse.ok) {
					const errBody = await metaResponse.text();
					console.error(`[outreach] Lead ${lead.id} Meta API erro:`, errBody);
					failed++;
					errors.push(`Lead ${lead.id}: Meta API ${metaResponse.status}`);
					continue;
				}

				await db.insert(chatHistory).values({
					leadId: lead.id,
					role: "assistant",
					content: `[Template Oficial Enviado: ${campaignMetaTemplate}]`,
					type: "text",
				});

				await db
					.update(leads)
					.set({ status: "contacted" })
					.where(eq(leads.id, lead.id));
				await db
					.insert(outreachLogs)
					.values({ leadId: lead.id, status: "sent" });
				sent++;
			} else {
				const completion = await groq.chat.completions.create({
					messages: [
						{
							role: "system",
							content: buildInitialOutreachPrompt({
								agent2Prompt: config?.agent2Prompt ?? undefined,
							}),
						},
						{
							role: "user",
							content: `DADOS DO LEAD:
Empresa: ${lead.name}
Nicho: ${lead.niche}
Localização: ${lead.city}, ${lead.state}
Dores/Oportunidades (Uso Interno): ${lead.aiAnalysis || "Sem análise disponível"}`,
						},
					],
					model: "llama-3.3-70b-versatile",
				});
				const message = completion.choices[0].message.content;

				const response = await fetch(`${evolutionUrl}/send/text`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						apikey: instanceToken as string,
					},
					body: JSON.stringify({
						instance: instanceName,
						number: lead.phone,
						text: message,
						delay: 1200,
						linkPreview: true,
					}),
				});

				if (!response.ok) {
					const errBody = await response.text();
					console.error(
						`[outreach] Lead ${lead.id} Evolution API erro:`,
						errBody,
					);
					failed++;
					errors.push(`Lead ${lead.id}: Evolution API ${response.status}`);
					continue;
				}

				// FIX: Gravar chatHistory também no fluxo Evolution (antes estava faltando)
				await db.insert(chatHistory).values({
					leadId: lead.id,
					role: "assistant",
					content: message,
					type: "text",
				});

				await db
					.update(leads)
					.set({ status: "contacted" })
					.where(eq(leads.id, lead.id));
				await db
					.insert(outreachLogs)
					.values({ leadId: lead.id, status: "sent" });
				sent++;
			}

			// Throttle entre envios para evitar ban do WhatsApp por spam
			await new Promise((resolve) => setTimeout(resolve, 2000));
		} catch (err) {
			const errMsg = err instanceof Error ? err.message : String(err);
			console.error(`[outreach] Erro ao abordar lead ${lead.id}:`, errMsg);
			failed++;
			errors.push(`Lead ${lead.id}: ${errMsg}`);
		}
	}
	revalidatePath("/");
	return { success: true, sent, failed, errors: errors.slice(0, 10) };
}

export async function followUpLeadsAction(campaignId?: number) {
	const session = await auth();
	const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;
	if (!userId) return { success: false, error: "Usuário não autenticado." };

	const [dbUser] = await db.select().from(users).where(eq(users.id, userId));
	const [config] = await db
		.select()
		.from(campaignConfigs)
		.where(eq(campaignConfigs.userId, userId));

	const instanceName = dbUser?.whatsappInstanceName;
	const instanceToken = dbUser?.whatsappInstanceToken;
	const evolutionUrl =
		process.env.EVOLUTION_API_URL || "https://api.evolution.com";

	if (!instanceName || !instanceToken) {
		return { success: false, error: "WhatsApp não configurado." };
	}

	// Intervalo mínimo entre follow-ups (24 horas)
	const FOLLOWUP_COOLDOWN_MS = 24 * 60 * 60 * 1000;

	// Buscar leads contactados
	const conditions = [eq(leads.status, "contacted"), eq(leads.userId, userId)];
	if (campaignId) conditions.push(eq(leads.campaignId, campaignId));

	const contactedLeads = await db
		.select()
		.from(leads)
		.where(and(...conditions))
		.limit(config?.weeklyLimit || 5);

	// Otimização: buscar todo chatHistory relevante em batch (resolve N+1)
	const leadIds = contactedLeads.map((l) => l.id);
	const allHistory =
		leadIds.length > 0
			? await db
					.select()
					.from(chatHistory)
					.where(inArray(chatHistory.leadId, leadIds))
			: [];

	// Agrupar histórico por leadId para acesso O(1)
	const historyByLead = new Map<number, typeof allHistory>();
	for (const h of allHistory) {
		if (!h.leadId) continue;
		const arr = historyByLead.get(h.leadId) || [];
		arr.push(h);
		historyByLead.set(h.leadId, arr);
	}

	let count = 0;
	let skipped = 0;
	let failed = 0;
	const errors: string[] = [];

	for (const lead of contactedLeads) {
		if (!lead.phone) continue;

		const history = historyByLead.get(lead.id) || [];
		const hasUserReply = history.some((h) => h.role === "user");

		// Só manda follow-up se o cliente ainda NÃO respondeu
		if (hasUserReply) {
			skipped++;
			continue;
		}

		// Anti-spam: verificar último follow-up enviado (cooldown de 48h)
		const lastAssistantMsg = history
			.filter((h) => h.role === "assistant" && h.createdAt)
			.sort((a, b) => {
				const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
				const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
				return tb - ta;
			})[0];

		if (lastAssistantMsg?.createdAt) {
			const timeSinceLastMsg =
				Date.now() - new Date(lastAssistantMsg.createdAt).getTime();
			if (timeSinceLastMsg < FOLLOWUP_COOLDOWN_MS) {
				skipped++;
				continue;
			}
		}

		try {
			const completion = await groq.chat.completions.create({
				messages: [
					{
						role: "system",
						content: buildFollowUpPrompt({
							agent2Prompt: config?.agent2Prompt ?? undefined,
						}),
					},
					{
						role: "user",
						content: `Nome da Empresa: ${lead.name}`,
					},
				],
				model: "llama-3.3-70b-versatile",
			});
			const message = completion.choices[0].message.content;

			const response = await fetch(`${evolutionUrl}/send/text`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					apikey: instanceToken,
				},
				body: JSON.stringify({
					instance: instanceName,
					number: lead.phone,
					text: message,
					delay: 1200,
				}),
			});

			if (response.ok) {
				count++;
				await db.insert(chatHistory).values({
					leadId: lead.id,
					role: "assistant",
					content: message,
					type: "text",
				});
			} else {
				const errBody = await response.text();
				console.error(
					`[followup] Lead ${lead.id} Evolution API erro:`,
					errBody,
				);
				failed++;
				errors.push(`Lead ${lead.id}: Evolution API ${response.status}`);
			}
		} catch (err) {
			const errMsg = err instanceof Error ? err.message : String(err);
			console.error(
				`[followup] Erro ao enviar follow-up para lead ${lead.id}:`,
				errMsg,
			);
			failed++;
			errors.push(`Lead ${lead.id}: ${errMsg}`);
		}
	}

	revalidatePath("/");
	return { success: true, count, skipped, failed, errors: errors.slice(0, 10) };
}

export async function generateAiSuggestionAction(leadId: number) {
	const session = await auth();
	const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;
	if (!userId) return { success: false, error: "Usuário não autenticado." };

	const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
	if (!lead) return { success: false, error: "Lead não encontrado." };

	const [config] = await db
		.select()
		.from(campaignConfigs)
		.where(eq(campaignConfigs.userId, userId));

	const systemPrompt = buildSuggestionPrompt({
		agent2Prompt: config?.agent2Prompt ?? undefined,
		lead: {
			name: lead.name,
			niche: lead.niche,
			city: lead.city,
			website: lead.website,
			aiAnalysis: lead.aiAnalysis,
		},
	});

	try {
		const completion = await groq.chat.completions.create({
			messages: [{ role: "system", content: systemPrompt }],
			model: "llama-3.3-70b-versatile",
		});

		const message = completion.choices[0].message.content || "";
		return { success: true, suggestion: message.trim() };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}
