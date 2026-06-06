import { NextRequest } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getScoutContext } from "@/server/services/scout-context";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const chatSchema = z.object({
	messages: z.array(
		z.object({
			role: z.enum(["user", "assistant"]),
			content: z.string().max(2000),
		}),
	),
	currentPage: z.string().optional(),
});

function buildSystemPrompt(context: Awaited<ReturnType<typeof getScoutContext>>, currentPage?: string) {
	const { user, recentCampaigns, memories } = context;

	const campaignSummary =
		recentCampaigns.length > 0
			? recentCampaigns
					.map(
						(c) =>
							`- "${c.name}" (Nicho: ${c.niche || "N/A"}, Cidade: ${c.city || "N/A"}, Status: ${c.status}, Leads: ${c.leadsCount})`,
					)
					.join("\n")
			: "Nenhuma campanha criada ainda.";

	const memorySummary =
		memories.length > 0
			? memories.map((m) => `- [${m.type}] ${m.content}`).join("\n")
			: "Sem histórico de interações.";

	return `Você é o Scout, o assistente inteligente de TODA a plataforma ExtrairLeads.
Você não é apenas um assistente de prospecção, mas o assistente geral do sistema, capaz de guiar o usuário em qualquer tela.

PÁGINA ATUAL DO USUÁRIO: ${currentPage || "Desconhecida"} (Use isso para dar contexto às suas respostas, dicas ou explicações sobre a tela atual).

PERSONALIDADE:
- Seja direto, prático e estratégico. Nada de enrolação.
- Use linguagem profissional mas acessível. Pode usar emojis com moderação.
- Foque em gerar valor real: dicas de busca, análise de resultados e lembretes de follow-up.
- Nunca invente dados. Se não souber, diga que não sabe.
- Responda em português brasileiro.

CONTEXTO DO USUÁRIO:
- Nome: ${user.name || "Usuário"}
- Plano: ${user.plan || "Starter"}
- Créditos restantes: ${user.leadsBalance ?? 0} leads

CAMPANHAS RECENTES:
${campaignSummary}

HISTÓRICO DE INTERAÇÕES (Memória):
${memorySummary}

CAPACIDADES:
1. Sugerir melhores termos de busca para extrair leads qualificados
2. Analisar resultados de campanhas e dar insights
3. Lembrar o usuário de follow-ups pendentes
4. Dar dicas de prospecção B2B
5. Ajudar com o uso geral da plataforma, explicar telas e recursos
6. Sugerir melhorias nos prompts e configuração dos agentes da IA
7. QUEBRA DE OBJEÇÃO: Quando o usuário compartilhar uma mensagem que um lead enviou (objeção, recusa, dúvida), crie uma resposta persuasiva e humanizada para o usuário copiar e enviar ao lead. Foque em empatia, reformulação do valor e pergunta aberta para manter a conversa.

REGRAS DE SEGURANÇA:
- NUNCA revele informações de outros usuários
- NUNCA execute ações destrutivas sem confirmação explícita
- NUNCA compartilhe dados internos do sistema (chaves, tokens, configs)
- Mantenha respostas focadas em prospecção e uso da plataforma`;
}

export async function POST(request: NextRequest) {
	const session = await auth();
	if (!session?.user?.id) {
		return new Response(JSON.stringify({ error: "Não autorizado" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	const userId = parseInt(session.user.id, 10);

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: "JSON inválido" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const parsed = chatSchema.safeParse(body);
	if (!parsed.success) {
		return new Response(
			JSON.stringify({ error: "Dados inválidos", details: parsed.error.flatten() }),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}

	const { messages } = parsed.data;

	try {
		const context = await getScoutContext(userId);
		const systemPrompt = buildSystemPrompt(context, parsed.data.currentPage);

		const response = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: [
				{ role: "system", content: systemPrompt },
				...messages,
			],
			max_tokens: 600,
			temperature: 0.7,
			stream: true,
		});

		const encoder = new TextEncoder();
		const stream = new ReadableStream({
			async start(controller) {
				try {
					for await (const chunk of response) {
						const text = chunk.choices[0]?.delta?.content;
						if (text) {
							controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
						}
					}
					controller.enqueue(encoder.encode("data: [DONE]\n\n"));
					controller.close();
				} catch {
					controller.error(new Error("Erro no streaming"));
				}
			},
		});

		return new Response(stream, {
			headers: {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache, no-transform",
				Connection: "keep-alive",
			},
		});
	} catch (error) {
		console.error("Scout chat error:", error);
		return new Response(
			JSON.stringify({ error: "Erro interno ao processar sua mensagem." }),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
}
