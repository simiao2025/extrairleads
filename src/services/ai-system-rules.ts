// ═══════════════════════════════════════════════════════════════════
// REGRAS CENTRALIZADAS DO SISTEMA — IMUTÁVEIS PELO USUÁRIO
// Editar SOMENTE aqui para alterar comportamento base do SDR/WhatsApp.
// ═══════════════════════════════════════════════════════════════════

export const SYSTEM_RULES = `━━━ REGRAS CRÍTICAS DE SISTEMA (IMUTÁVEIS) ━━━
- DISCREÇÃO ABSOLUTA: NUNCA envie ou cite o dossiê da análise técnica, score de qualificação, ou pontos fortes/fracos. Use as dores identificadas de forma sutil apenas para embasar seus argumentos.
- TEXTOS EXTREMAMENTE CURTOS: Sempre envie mensagens curtas (máximo 2 a 3 linhas por mensagem).
- TOM HUMANO E CONVERSACIONAL: Fale de forma natural e informal.
- NUNCA envie áudios. Responda SEMPRE com texto.`;

export const TOOL_DIRECTIVES = `━━━ DIRETRIZES DE FERRAMENTAS ━━━
- update_lead_info: Chame para atualizar as informações do lead.
- create_appointment: Chame para agendar a reunião quando o cliente confirmar a data/horário.
- escalate_to_human: Chame para transbordar a conversa para um atendente humano se necessário.`;

export const WEBHOOK_TOOL_DIRECTIVES = `━━━ DIRETRIZES DE FERRAMENTAS ━━━
- update_lead_info: Atualiza dados cadastrais.
- create_appointment: Agenda reuniões.
- escalate_to_human: Transborda para atendente humano se necessário.`;

// ─── Tool definitions (centralized) ───────────────────────────────

export const AGENT_TOOLS = [
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

// ─── Prompt builder: Conversa em tempo real (ai-agent.ts) ─────────

interface ConversationPromptParams {
	personaPrompt: string;
	leadName: string;
	leadNiche: string;
	leadCity: string;
	leadWebsite: string;
	leadAiAnalysis: string;
	ragContext: string;
	formattedHistory: string;
}

export function buildConversationSystemPrompt({
	personaPrompt,
	leadName,
	leadNiche,
	leadCity,
	leadWebsite,
	leadAiAnalysis,
	ragContext,
	formattedHistory,
}: ConversationPromptParams): string {
	return `[DIRETRIZES DE PERSONA E NICHO]:
${personaPrompt}

${SYSTEM_RULES}

DADOS DO LEAD (APENAS PARA SEU CONTEXTO INTERNO — NUNCA envie estes dados como mensagem para o lead):
- Empresa/Contato: ${leadName}
- Segmento/Nicho: ${leadNiche || "Não informado"}
- Cidade: ${leadCity || "Não informada"}
- Site: ${leadWebsite || "Não informado"}
- Dossiê Mapeado: ${leadAiAnalysis || "Nenhuma análise prévia disponível."}

${TOOL_DIRECTIVES}

BASE DE CONHECIMENTO (RAG):
${ragContext || "Nenhuma informação cadastrada."}

HISTÓRICO DA CONVERSA:
${formattedHistory}
`;
}

// ─── Prompt builder: Webhook Meta (route.ts) ──────────────────────

interface WebhookPromptParams {
	personaPrompt: string;
	leadName: string;
	leadNiche: string;
	leadCity: string;
	formattedHistory: string;
}

export function buildWebhookSystemPrompt({
	personaPrompt,
	leadName,
	leadNiche,
	leadCity,
	formattedHistory,
}: WebhookPromptParams): string {
	return `[DIRETRIZES DE PERSONA E NICHO]:
${personaPrompt}

${SYSTEM_RULES}

DADOS PRÉVIOS DO LEAD:
- Empresa: ${leadName}
- Nicho: ${leadNiche || "Não informado"}
- Cidade: ${leadCity || "Não informada"}

${WEBHOOK_TOOL_DIRECTIVES}

HISTÓRICO DA CONVERSA:
${formattedHistory}`;
}
