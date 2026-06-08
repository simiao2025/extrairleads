import OpenAI from "openai";

const groq = new OpenAI({
	apiKey: process.env.GROQ_API_KEY || "dummy-key-to-prevent-crash",
	baseURL: "https://api.groq.com/openai/v1",
});

interface FirstContactParams {
	leadName: string;
	leadNiche: string | null;
	leadCity: string | null;
	leadState: string | null;
	leadAnalysis: string | null;
	agent2Prompt?: string | null;
}

export async function generateFirstContactMessage(
	params: FirstContactParams,
): Promise<string> {
	const {
		leadName,
		leadNiche,
		leadCity,
		leadState,
		leadAnalysis,
		agent2Prompt,
	} = params;

	const systemPrompt = `[DIRETRIZES DE PERSONA E NICHO]:
${agent2Prompt || "Você é um SDR focado em abordagens comerciais via WhatsApp."}

━━━ REGRAS CRÍTICAS DE SISTEMA (IMUTÁVEIS) ━━━
- DISCREÇÃO ABSOLUTA: NUNCA envie, cite ou copie o dossiê da análise técnica, score de qualificação, ou pontos fortes/fracos. Use as dores identificadas de forma sutil apenas para embasar seus argumentos, sem revelar dados internos ao lead.
- TEXTOS EXTREMAMENTE CURTOS: Sempre envie respostas curtas (máximo 2 a 3 linhas por mensagem). WhatsApps longos geram rejeição imediata.
- TOM HUMANO E CONVERSACIONAL: Fale de forma natural, amigável e informal, simulando digitação real. Evite saudações engessadas ou formais (ex: "Prezado(a)").
- FOCO EM RESPOSTA: Sempre termine a mensagem com uma única pergunta simples e direta para estimular o lead a responder.
- AÇÃO: Você está gerando a PRIMEIRA abordagem comercial.`;

	const completion = await groq.chat.completions.create({
		messages: [
			{ role: "system", content: systemPrompt },
			{
				role: "user",
				content: `DADOS DO LEAD:
Empresa: ${leadName}
Nicho: ${leadNiche || "Não informado"}
Localização: ${leadCity || "Não informada"}, ${leadState || "Não informado"}
Dores/Oportunidades (Uso Interno): ${leadAnalysis || "Sem análise disponível"}`,
			},
		],
		model: "llama-3.3-70b-versatile",
	});

	return completion.choices[0].message.content || "";
}
