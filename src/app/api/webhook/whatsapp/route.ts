import fs from "node:fs";
import path from "node:path";
import { desc, sql as drizzleSql, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/db";
import {
	appointments,
	campaignConfigs,
	chatHistory,
	leads,
	users,
} from "@/db/schema";

const groq = new OpenAI({
	apiKey: process.env.GROQ_API_KEY,
	baseURL: "https://api.groq.com/openai/v1",
});

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		if (body.event !== "messages.upsert")
			return NextResponse.json({ ok: true });

		const instanceName = body.instance;
		const messageData = body.data;
		const remoteJid = messageData.key?.remoteJid;
		if (!remoteJid || messageData.key?.fromMe)
			return NextResponse.json({ ok: true });

		const phone = remoteJid.split("@")[0];

		// Localizar o dono da instância WhatsApp (multi-tenant)
		const [owner] = await db
			.select()
			.from(users)
			.where(eq(users.whatsappInstanceName, instanceName));
		const ownerUserId = owner?.id || null;
		const instanceToken =
			owner?.whatsappInstanceToken || process.env.EVOLUTION_API_KEY!;
		const evolutionUrl =
			process.env.EVOLUTION_API_URL ||
			"https://evolution-api.brasilonthebox.shop";

		// 1. Localizar ou Auto-Cadastrar o Lead
		let [lead] = await db.select().from(leads).where(eq(leads.phone, phone));
		if (!lead) {
			const [newLead] = await db
				.insert(leads)
				.values({
					userId: ownerUserId,
					phone: phone,
					name: "Contato WhatsApp",
					status: "raw",
				})
				.returning();
			lead = newLead;
		}

		// 2. Extrair Texto / Transcrever Áudio se necessário
		let textContent = "";
		const conversation = messageData.message?.conversation;
		const extendedText = messageData.message?.extendedTextMessage?.text;
		const audioMessage = messageData.message?.audioMessage;

		if (conversation) {
			textContent = conversation;
		} else if (extendedText) {
			textContent = extendedText;
		} else if (audioMessage) {
			try {
				const downloadUrl = `${evolutionUrl}/media/download/${instanceName}`;
				const mediaRes = await fetch(downloadUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						apikey: instanceToken,
					},
					body: JSON.stringify({ message: messageData }),
				});

				if (mediaRes.ok) {
					const mediaData = await mediaRes.json();
					const base64Audio = mediaData.base64;
					if (base64Audio) {
						const buffer = Buffer.from(base64Audio, "base64");
						const tempFile = path.join(process.cwd(), `temp-${Date.now()}.mp3`);
						fs.writeFileSync(tempFile, buffer);

						const transcriptionResponse =
							await openai.audio.transcriptions.create({
								file: fs.createReadStream(tempFile),
								model: "whisper-1",
							});

						textContent = transcriptionResponse.text;

						try {
							fs.unlinkSync(tempFile);
						} catch (_e) {}
					}
				} else {
				}
			} catch (_err) {}
		}

		if (!textContent.trim()) return NextResponse.json({ ok: true });

		// 3. Salvar Histórico do Usuário
		await db.insert(chatHistory).values({
			leadId: lead.id,
			role: "user",
			content: textContent,
			type: audioMessage ? "audio" : "text",
		});

		// 4. RAG - Busca Semântica Vetorial (Neon Postgres pgvector)
		let ragContext = "";
		if (ownerUserId) {
			try {
				const queryEmbeddingResponse = await openai.embeddings.create({
					model: "text-embedding-3-small",
					input: textContent,
				});
				const queryEmbedding = queryEmbeddingResponse.data[0].embedding;
				const vectorStr = `[${queryEmbedding.join(",")}]`;

				// Busca os 3 blocos de conhecimento do usuário com menor distância cosseno (<=>)
				const similarityQuery = drizzleSql`
          SELECT title, content 
          FROM knowledge_base 
          WHERE user_id = ${ownerUserId}
          ORDER BY embedding <=> ${vectorStr}::vector
          LIMIT 3
        `;
				const relatedDocs = await db.execute(similarityQuery);

				if (relatedDocs.rows && relatedDocs.rows.length > 0) {
					ragContext = relatedDocs.rows
						.map((row: any) => `- ${row.title}: ${row.content}`)
						.join("\n");
				}
			} catch (_ragErr) {}
		}

		// 5. Buscar Histórico Recente de Conversa
		const history = await db
			.select()
			.from(chatHistory)
			.where(eq(chatHistory.leadId, lead.id))
			.orderBy(desc(chatHistory.createdAt))
			.limit(10);

		const formattedHistory = history
			.reverse()
			.map((h) => `${h.role === "user" ? "Cliente" : "SDR"}: ${h.content}`)
			.join("\n");

		// 6. Configurar Prompt de Sistema & Chamada Llama 3.3
		const [config] = ownerUserId
			? await db
					.select()
					.from(campaignConfigs)
					.where(eq(campaignConfigs.userId, ownerUserId))
			: [];

		const systemPrompt = `${config?.agent2Prompt || "Você é um SDR focado em abordagens."}

DADOS E ANÁLISE PRÉVIA DO LEAD (Use isso para orientar sua abordagem e citar as dores/forças exatas mapeadas pelo Analista):
- Empresa/Contato: ${lead.name}
- Segmento/Nicho: ${lead.niche || "Não informado"}
- Cidade: ${lead.city || "Não informada"}
- Site: ${lead.website || "Não informado"}
- Nota da IA (Score): ${lead.aiScore || "Sem nota"}
- Dossiê Mapeado (Pontos Fortes, Dores e Estratégia Recomendada):
${lead.aiAnalysis || "Nenhuma análise prévia disponível."}

DIRETRIZES DE AUTONOMIA (FERRAMENTAS):
- Você possui total autonomia para CADASTRAR/ATUALIZAR dados da empresa/contato chamando a ferramenta 'update_lead_info'. Chame-a assim que descobrir o nome da empresa, ramo, cidade ou site.
- Você possui autonomia para FECHAR AGENDAMENTOS chamando a ferramenta 'create_appointment'. Chame-a quando o lead concordar com uma data e hora para conversarmos.
- Você possui autonomia para TRANSBORDAR PARA HUMANO chamando a ferramenta 'escalate_to_human'. Chame-a se o cliente fizer perguntas financeiras complexas, se irritar, ou estiver pronto para pagar.
- Você possui autonomia para ENVIAR ÁUDIOS chamando a ferramenta 'send_voice_note'. Use isso estrategicamente para quebrar o gelo, contornar objeções críticas ou gerar extrema empatia.

BASE DE CONHECIMENTO (RAG):
Use apenas as seguintes informações corporativas oficiais para esclarecer dúvidas e apresentar produtos/serviços:
${ragContext || "Nenhuma informação específica cadastrada. Use bom senso profissional."}

HISTÓRICO DA CONVERSA:
${formattedHistory}
`;

		// Definição das Ferramentas Autônomas (Tool Use)
		const tools = [
			{
				type: "function" as const,
				function: {
					name: "update_lead_info",
					description:
						"Atualiza os dados cadastrais da empresa/lead e muda seu status para qualificado ('qualified'). Chame esta ferramenta assim que identificar o nome da empresa, o nicho de mercado ou a cidade do contato.",
					parameters: {
						type: "object",
						properties: {
							name: {
								type: "string",
								description: "Nome real da empresa ou do contato.",
							},
							niche: {
								type: "string",
								description:
									"Ramo ou nicho de atuação comercial (ex: Odontologia, Restaurante, Advocacia).",
							},
							city: {
								type: "string",
								description: "Cidade onde a empresa está sediada.",
							},
							state: {
								type: "string",
								description: "Sigla do estado da empresa (ex: SP, MG, PR).",
							},
							website: {
								type: "string",
								description: "Site oficial da empresa.",
							},
						},
						required: ["name"],
					},
				},
			},
			{
				type: "function" as const,
				function: {
					name: "create_appointment",
					description:
						"Agenda uma reunião oficial na agenda com o lead. Chame esta ferramenta assim que o cliente aceitar e confirmar um dia e horário de preferência.",
					parameters: {
						type: "object",
						properties: {
							dateStr: {
								type: "string",
								description:
									"Data e hora do agendamento (Exemplo: '2026-05-20 14:00').",
							},
							notes: {
								type: "string",
								description:
									"Observações ou detalhes adicionais sobre o agendamento.",
							},
						},
						required: ["dateStr"],
					},
				},
			},
			{
				type: "function" as const,
				function: {
					name: "escalate_to_human",
					description:
						"Aciona o transbordo para um atendente humano. Chame esta ferramenta se o cliente fizer perguntas financeiras muito complexas, se irritar, ou estiver pronto para passar o cartão e fechar a compra.",
					parameters: {
						type: "object",
						properties: {
							reason: { type: "string", description: "Motivo do transbordo." },
						},
						required: ["reason"],
					},
				},
			},
			{
				type: "function" as const,
				function: {
					name: "send_voice_note",
					description:
						"Envia um áudio de voz natural para o cliente. Use para gerar proximidade ou contornar objeções. Envie textos curtos (máximo 2 frases).",
					parameters: {
						type: "object",
						properties: {
							text_to_speak: {
								type: "string",
								description:
									"O texto exato que será convertido em voz e enviado ao cliente.",
							},
						},
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
			tools: tools,
			tool_choice: "auto",
		});

		const choice = completion.choices[0];
		const toolCalls = choice.message.tool_calls as any[];
		let aiResponseText = choice.message.content || "";
		let forceAudio = false;
		let overrideText = "";

		// Tratar chamadas de funções autônomas (Tools)
		if (toolCalls && toolCalls.length > 0) {
			for (const toolCall of toolCalls) {
				const toolName = toolCall.function.name;
				const toolArgs = JSON.parse(toolCall.function.arguments);

				if (toolName === "update_lead_info") {
					await db
						.update(leads)
						.set({
							name: toolArgs.name,
							niche: toolArgs.niche || lead.niche,
							city: toolArgs.city || lead.city,
							state: toolArgs.state || lead.state,
							website: toolArgs.website || lead.website,
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
				} else if (toolName === "send_voice_note") {
					forceAudio = true;
					overrideText = toolArgs.text_to_speak;
				}
			}

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

		if (!aiResponseText.trim()) return NextResponse.json({ ok: true });

		// 7. Enviar Mensagem Final (Texto Dividido em Blocos ou Áudio Natural)
		const shouldReplyAudio =
			(!!audioMessage || forceAudio) && !!process.env.OPENAI_API_KEY;

		if (shouldReplyAudio) {
			try {
				const mp3 = await openai.audio.speech.create({
					model: "tts-1",
					voice: "alloy",
					input: aiResponseText,
				});

				const arrayBuf = await mp3.arrayBuffer();
				const base64Audio = Buffer.from(arrayBuf).toString("base64");

				await fetch(
					`${evolutionUrl}/message/sendWhatsAppAudio/${instanceName}`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							apikey: instanceToken,
						},
						body: JSON.stringify({
							number: phone,
							base64: base64Audio,
							delay: 1500,
						}),
					},
				);
			} catch (_ttsErr) {
				// Fallback: enviar texto
				await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						apikey: instanceToken,
					},
					body: JSON.stringify({
						number: phone,
						text: aiResponseText,
						delay: 1000,
					}),
				});
			}
		} else {
			// Responder com Texto em Blocos (Parágrafos) para Extrema Humanização
			const blocks = aiResponseText
				.split(/\n\n+/)
				.map((b) => b.trim())
				.filter((b) => b.length > 0);

			for (let i = 0; i < blocks.length; i++) {
				const block = blocks[i];

				// Simular digitação proporcional ao tamanho do bloco
				const typingDelay = Math.min(3000, Math.max(1000, block.length * 35));

				await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						apikey: instanceToken,
					},
					body: JSON.stringify({
						number: phone,
						text: block,
						delay: typingDelay,
					}),
				});

				// Aguardar o término do delay de digitação antes de enviar o próximo bloco
				if (i < blocks.length - 1) {
					await sleep(typingDelay + 300);
				}
			}
		}

		// 8. Salvar Histórico do Assistente
		await db.insert(chatHistory).values({
			leadId: lead.id,
			role: "assistant",
			content: aiResponseText,
			type: shouldReplyAudio ? "audio" : "text",
		});

		return NextResponse.json({ ok: true });
	} catch (_error) {
		return NextResponse.json({ ok: false }, { status: 500 });
	}
}
