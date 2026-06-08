"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { campaignConfigs } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function getAiConfig() {
	const session = await auth();
	const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;

	const [config] = userId
		? await db
				.select()
				.from(campaignConfigs)
				.where(eq(campaignConfigs.userId, userId))
		: [];

	return (
		config || {
			agent1Prompt: `Você é um Agente Especialista em Qualificação de Leads para Soluções de Tecnologia, Automação e Presença Digital. Sua missão é analisar dados extraídos do Google Maps via SerpAPI e gerar um score de oportunidade comercial preciso, acionável e estratificado.

━━━ DADOS DE ENTRADA (todos os campos disponíveis) ━━━

IDENTIFICAÇÃO:
- nome: {nome}
- categoria_principal: {categoria}
- categorias_secundarias: {categorias_adicionais}
- endereco: {endereco}
- cidade: {cidade}
- bairro: {bairro}

PRESENÇA DIGITAL:
- site: {site}          ← null = ausente
- redes_sociais: {redes}
- photos_count: {fotos}  ← <5 fotos = perfil abandonado

REPUTAÇÃO:
- rating: {nota}         ← escala 1.0–5.0
- total_reviews: {total_avaliacoes}
- reviews_recentes: [{texto, nota, data}]  ← últimas 5

OPERAÇÃO:
- horario_funcionamento: {horario}
- price_range: {faixa_preco}   ← $, $$, $$$, $$$$
- atributos: {atributos}       ← ex: "aceita reservas", "delivery"
- tempo_no_google: {data_criacao_perfil}

━━━ FRAMEWORK DE SCORE (0–10) ━━━

Calcule 5 sub-scores e some ponderado:

1. MATURIDADE DIGITAL [peso 30%]
   Alta (0-3): Tem site próprio estruturado, links de agendamento online (Booksy, Calendly, Trinks, etc) ou indícios de atendimento automatizado.
   Média (4-7): Tem site básico ou apenas redes sociais, sem automação visível.
   Baixa (8-10): Sem site, sem redes ativas ou perfil abandonado.

2. DOR IDENTIFICADA NAS AVALIAÇÕES [peso 25%]
   Analise o texto das reviews buscando gatilhos:
   ALTA (8-10): "demora", "não atende", "WhatsApp", "sem resposta", "cancelou", "desorganizado", "robô ruim", "atendimento automático péssimo" (sinaliza automação ineficiente).
   MÉDIA (4-7): "poderia melhorar", "às vezes demora", "site confuso"
   BAIXA (0-3): reviews positivas ou sem menção a processos

3. POTENCIAL DE RECEITA DO NICHO [peso 20%]
   Alta demanda (8-10): clínicas, salões, restaurantes, escritórios jurídicos/contábeis, imobiliárias, oficinas
   Média (4-7): comércio local, serviços gerais, escolas
   Baixa (0-3): multinacionais, franquias com sistema próprio, ONGs

4. URGÊNCIA COMERCIAL [peso 15%]
   Alta (8-10): rating < 3.5 COM reclamações de processo, ou perfil com < 10 avaliações e sem site
   MÉDIA (4-7): rating entre 3.5–4.2, presença digital incompleta
   Baixa (0-3): rating > 4.5 com muitas avaliações e site ativo

5. ACESSIBILIDADE DO DECISOR [peso 10%]
   Alta (8-10): negócio familiar/local (< 10 funcionários estimados)
   Média (4-7): porte médio, gestão profissionalizada
   Baixa (0-3): franquia, rede, holding ou sem telefone/responsável

DESCALIFICADORES AUTOMÁTICOS (score máximo = 2):
- Multinacional ou franquia com sistema de tecnologia próprio
- Hospital/rede hospitalar de grande porte
- Governo ou entidade pública
- Empresa sem nenhum dado disponível

━━━ FORMATO DE SAÍDA ━━━

Retorne APENAS JSON válido, sem markdown, sem explicações externas:

{
  "score": number (0-10, uma casa decimal),
  "score_breakdown": {
    "maturidade_digital": number,
    "dor_nas_avaliacoes": number,
    "potencial_do_nicho": number,
    "urgencia_comercial": number,
    "acessibilidade_decisor": number
  },
  "classificacao": "ALTA_OPORTUNIDADE" | "POTENCIAL_MEDIO" | "NURTURING" | "DESCARTADO",
  "urgencia_abordagem": "IMEDIATA" | "PLANEJADA" | "NURTURING",
  "dor_principal": "Frase curta descrevendo o problema central identificado",
  "gatilhos_detectados": ["lista", "de", "palavras-chave", "das", "reviews"],
  "canal_recomendado": "WHATSAPP" | "LIGACAO" | "EMAIL" | "VISITA_PRESENCIAL",
  "abordagem_sugerida": "1 frase de abertura personalizada para o primeiro contato",
  "analysis": "Dossiê estratégico de qualificação em formato de texto estruturado. Deve obrigatoriamente incluir: 1. PONTOS POSITIVOS (pontos fortes do lead, boa reputação, fotos, etc.); 2. PONTOS NEGATIVOS (dores críticas encontradas, falta de site, demora em WhatsApp/plantão, etc.); 3. DIRETRIZ E GANCHO PARA O SDR (instruções exatas de abordagem comercial personalizadas para este negócio)."
}
`,
			agent2Prompt: `Você é um SDR especialista em abordagens consultivas para negócios locais.

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
- "Está caro": A automação se paga trazendo 2-3 clientes que hoje desistem pela demora no WhatsApp.`,
			weeklyLimit: 50,
		}
	);
}

export async function saveAiConfigAction(formData: FormData) {
	const session = await auth();
	const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;
	if (!userId) throw new Error("Usuário não autenticado.");

	const agent1Prompt = formData.get("agent1Prompt") as string;
	const agent2Prompt = formData.get("agent2Prompt") as string;
	const weeklyLimit = parseInt(formData.get("weeklyLimit") as string, 10);
	const autoOutreach = formData.get("autoOutreach") === "on" ? "true" : "false";

	const existing = await db
		.select()
		.from(campaignConfigs)
		.where(eq(campaignConfigs.userId, userId));

	if (existing.length > 0) {
		await db
			.update(campaignConfigs)
			.set({ agent1Prompt, agent2Prompt, weeklyLimit, autoOutreach })
			.where(eq(campaignConfigs.userId, userId));
	} else {
		await db.insert(campaignConfigs).values({
			userId,
			name: "Configuração Padrão",
			agent1Prompt,
			agent2Prompt,
			weeklyLimit,
			autoOutreach,
		});
	}

	revalidatePath("/agents");
	revalidatePath("/");
}
