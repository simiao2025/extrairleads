import { NextRequest } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { auth } from "@/lib/auth";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const analyzeSchema = z.object({
	lead: z.object({
		id: z.number(),
		name: z.string().nullable().optional(),
		niche: z.string().nullable().optional(),
		city: z.string().nullable().optional(),
		address: z.string().nullable().optional(),
		description: z.string().nullable().optional(),
		rating: z.number().nullable().optional(),
		reviews: z.number().nullable().optional(),
	}),
});

export async function POST(request: NextRequest) {
	const session = await auth();
	if (!session?.user?.id) {
		return new Response(JSON.stringify({ error: "Não autorizado" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: "JSON inválido" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const parsed = analyzeSchema.safeParse(body);
	if (!parsed.success) {
		return new Response(
			JSON.stringify({ error: "Dados inválidos", details: parsed.error.flatten() }),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}

	const { lead } = parsed.data;

	const prompt = `Você é o Scout, um estrategista de prospecção B2B. 
Seu objetivo é analisar rapidamente os dados de um lead do Google Maps e fornecer:
1. 'scoreNicho' (0-100): quão focado/especializado é o lead. Se tiver muitas avaliações e nome coerente, é alto.
2. 'scorePotencial' (0-100): potencial de ser um bom cliente. (rating alto e muitas reviews = alto).
3. 'msgAbertura': Uma mensagem curta, direta e personalizada (icebreaker) para usar no WhatsApp. Faça uma pergunta que gere engajamento, não venda logo de cara.

Lead Info:
- Nome: ${lead.name || "N/A"}
- Nicho: ${lead.niche || "N/A"}
- Cidade: ${lead.city || "N/A"}
- Descrição: ${lead.description || "N/A"}
- Rating: ${lead.rating || "N/A"} (${lead.reviews || 0} avaliações)

Retorne EXATAMENTE um objeto JSON válido.
Exemplo:
{
  "scoreNicho": 95,
  "scorePotencial": 82,
  "msgAbertura": "Olá! Vi que a [nome] tem ótimas avaliações na região. Como vocês estão gerenciando os agendamentos hoje?"
}
`;

	try {
		const response = await openai.chat.completions.create({
			model: "gpt-4o-mini", // Lower latency, structured JSON
			response_format: { type: "json_object" },
			messages: [
				{
					role: "system",
					content: prompt,
				},
			],
			max_tokens: 300,
			temperature: 0.7,
		});

		const content = response.choices[0]?.message?.content;
		if (!content) throw new Error("No content generated");

		// The content is a JSON string because of json_object format
		return new Response(content, {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Scout analyze error:", error);
		return new Response(
			JSON.stringify({ error: "Erro interno ao analisar o lead." }),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
}
