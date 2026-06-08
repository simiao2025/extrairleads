/**
 * Centralized prompt builders for all AI agent interactions.
 *
 * The persona (agent2Prompt) is user-editable; the system rules are immutable
 * and injected automatically. This avoids duplication across services.
 */

// ── Immutable rule blocks (not user-editable) ────────────────────────────────

const IMMUTABLE_CORE = `━━━ REGRAS CRÍTICAS DE SISTEMA (IMUTÁVEIS) ━━━
- DISCREÇÃO ABSOLUTA: NUNCA envie, cite ou copie o dossiê da análise técnica, score de qualificação, ou pontos fortes/fracos. Use as dores identificadas de forma sutil apenas para embasar seus argumentos, sem revelar dados internos ao lead.
- TEXTOS EXTREMAMENTE CURTOS: Sempre envie respostas curtas (máximo 2 a 3 linhas por mensagem). WhatsApps longos geram rejeição imediata.
- TOM HUMANO E CONVERSACIONAL: Fale de forma natural, amigável e informal, simulando digitação real. Evite saudações engessadas ou formais (ex: "Prezado(a)").
- NUNCA envie áudios. Responda SEMPRE com texto.`;

export const WHATSAPP_RULES_CHAT = `${IMMUTABLE_CORE}
- APÓS A PRIMEIRA MENSAGEM: Aguarde a resposta do lead antes de enviar novas mensagens. Não envie múltiplas mensagens em sequência sem resposta.`;

export const WHATSAPP_RULES_OUTREACH = `${IMMUTABLE_CORE}
- FOCO EM RESPOSTA: Sempre termine a mensagem com uma única pergunta simples e direta para estimular o lead a responder.
- AÇÃO DO SISTEMA: Você está gerando a PRIMEIRA abordagem comercial (outreach inicial) para iniciar uma conversa no WhatsApp.`;

export const WHATSAPP_RULES_FOLLOWUP = `${IMMUTABLE_CORE}
- AÇÃO DO SISTEMA: Você está gerando um FOLLOW-UP (BUMP). O cliente não respondeu nossa primeira mensagem. Faça uma cobrança amigável para retomar o contato (ex: "Oi [Nome], conseguiu dar uma olhada na mensagem anterior?").`;

export const WHATSAPP_RULES_META_WEBHOOK = IMMUTABLE_CORE;

// ── Default persona (fallback when user hasn't configured agent2Prompt) ─────

const DEFAULT_SDR_PROMPT = "Você é um SDR focado em atendimento via WhatsApp.";

// ── Builder functions ────────────────────────────────────────────────────────

type LeadData = {
	name: string;
	niche?: string | null;
	city?: string | null;
	state?: string | null;
	website?: string | null;
	aiAnalysis?: string | null;
};

const TOOL_GUIDELINES = `━━━ DIRETRIZES DE FERRAMENTAS ━━━
- update_lead_info: Chame para atualizar as informações do lead.
- create_appointment: Chame para agendar a reunião quando o cliente confirmar a data/horário.
- escalate_to_human: Chame para transbordar a conversa para um atendente humano se necessário.`;

/**
 * Build the full system prompt for real-time conversation (Evolution API / Baileys).
 */
export function buildConversationPrompt(opts: {
	agent2Prompt?: string;
	lead: LeadData;
	ragContext?: string;
	formattedHistory: string;
}): string {
	const { agent2Prompt, lead, ragContext, formattedHistory } = opts;
	return `[DIRETRIZES DE PERSONA E NICHO]:
${agent2Prompt || DEFAULT_SDR_PROMPT}

${WHATSAPP_RULES_CHAT}

DADOS DO LEAD (APENAS PARA SEU CONTEXTO INTERNO — NUNCA envie estes dados como mensagem para o lead):
- Empresa/Contato: ${lead.name}
- Segmento/Nicho: ${lead.niche || "Não informado"}
- Cidade: ${lead.city || "Não informada"}
- Site: ${lead.website || "Não informado"}
- Dossiê Mapeado: ${lead.aiAnalysis || "Nenhuma análise prévia disponível."}

${TOOL_GUIDELINES}

BASE DE CONHECIMENTO (RAG):
${ragContext || "Nenhuma informação cadastrada."}

HISTÓRICO DA CONVERSA:
${formattedHistory}`;
}

/**
 * Build the full system prompt for the Meta (WhatsApp Business API) webhook.
 */
export function buildMetaConversationPrompt(opts: {
	agent2Prompt?: string;
	lead: LeadData;
	formattedHistory: string;
}): string {
	const { agent2Prompt, lead, formattedHistory } = opts;
	return `[DIRETRIZES DE PERSONA E NICHO]:
${agent2Prompt || DEFAULT_SDR_PROMPT}

${WHATSAPP_RULES_META_WEBHOOK}

DADOS DO LEAD (APENAS PARA SEU CONTEXTO INTERNO — NUNCA envie estes dados como mensagem para o lead):
- Empresa: ${lead.name}
- Nicho: ${lead.niche || "Não informado"}
- Cidade: ${lead.city || "Não informada"}
- Site: ${lead.website || "Não informado"}
- Dossiê Mapeado: ${lead.aiAnalysis || "Nenhuma análise prévia disponível."}

${TOOL_GUIDELINES}

HISTÓRICO DA CONVERSA:
${formattedHistory}`;
}

/**
 * Build the system prompt for the first outreach message.
 */
export function buildInitialOutreachPrompt(opts: {
	agent2Prompt?: string;
}): string {
	return `[DIRETRIZES DE PERSONA E NICHO]:
${opts.agent2Prompt || "Você é um SDR focado em abordagens comerciais via WhatsApp."}

${WHATSAPP_RULES_OUTREACH}`;
}

/**
 * Build the system prompt for follow-up (bump) messages.
 */
export function buildFollowUpPrompt(opts: { agent2Prompt?: string }): string {
	return `[DIRETRIZES DE PERSONA E NICHO]:
${opts.agent2Prompt || "Você é um SDR focado em follow-up comercial via WhatsApp."}

${WHATSAPP_RULES_FOLLOWUP}`;
}

/**
 * Build the system prompt for AI suggestion generation.
 */
export function buildSuggestionPrompt(opts: {
	agent2Prompt?: string;
	lead: LeadData;
}): string {
	const { agent2Prompt, lead } = opts;
	return `[DIRETRIZES DE PERSONA E NICHO]:
${agent2Prompt || DEFAULT_SDR_PROMPT}

${IMMUTABLE_CORE}

DADOS DO LEAD (APENAS PARA SEU CONTEXTO INTERNO — NUNCA envie estes dados como mensagem para o lead):
- Empresa/Contato: ${lead.name}
- Segmento/Nicho: ${lead.niche || "Não informado"}
- Cidade: ${lead.city || "Não informada"}`;
}

// ── Default persona for user-facing config ──────────────────────────────────

export const DEFAULT_AGENT2_PROMPT = `Você é um SDR especialista em abordagens consultivas para negócios locais.

━━━ PRODUTO/SOLUÇÃO ━━━
Automação de WhatsApp e Presença Digital para pequenas e médias empresas.
- Atendimento automático inteligente 24h/7 via WhatsApp.
- Sites de alta conversão integrados à agenda ou cardápios digitais.
- Redução de tempo perdido no WhatsApp e aumento de conversão.

━━━ TOM DE VOZ ━━━
- Elogie avaliações positivas do Google Maps de forma sincera.
- Seja amigável, entusiasmado e focado em resolver gargalos operacionais.

━━━ CONTORNO DE OBJEÇÕES ━━━
- "Já uso iFood/parceiros": Nossa solução roda no WhatsApp sem comissão de 12% a 30% por pedido.
- "Sem tempo": Demonstração rápida de 5 minutos, sem tomar o dia deles.
- "Está caro": A automação se paga trazendo 2-3 clientes que hoje desistem pela demora no WhatsApp.`;
