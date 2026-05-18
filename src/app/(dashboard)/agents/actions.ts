"use server";

import { db } from "@/db";
import { campaignConfigs } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function getAiConfig() {
  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;

  const [config] = userId
    ? await db.select().from(campaignConfigs).where(eq(campaignConfigs.userId, userId))
    : [];

  return config || {
    agent1Prompt: `Você é um Analista de Inteligência de Mercado sênior. 
Sua missão é avaliar o potencial de conversão de leads locais para soluções de tecnologia e automação.

DADOS PARA ANÁLISE:
- Nome da Empresa
- Presença Digital (Site, Redes)
- Feedback de Clientes (Avaliações Google)

CRITÉRIOS DE SCORE (0-10):
- 0-3: Lead irrelevante (empresa muito grande, multinacional ou sem dados).
- 4-6: Potencial Médio (já possui site e automação básica, mas pode melhorar).
- 7-10: Alta Oportunidade (sem site, avaliações reclamando de demora no atendimento, ou nicho de alta demanda imediata).

FORMATO DE SAÍDA:
Retorne APENAS um JSON:
{
  "score": number,
  "analysis": "Explicação estratégica de 1 frase focada na dor do cliente."
}`,
    agent2Prompt: `Você é um SDR (Sales Development Representative) especialista em abordagens consultivas via WhatsApp.
Sua missão é converter leads qualificados em reuniões, focando na dor específica detectada na análise.

DIRETRIZES DE COMUNICAÇÃO:
1. Tom: Profissional, mas amigável e direto (evite "falar como robô").
2. Personalização: Utilize o nome da empresa e cite a dor mencionada na 'Análise da IA'.
3. Proposta de Valor: Foque em como a solução resolve o problema (ex: mais vendas, menos tempo no telefone).
4. Call to Action (CTA): Faça uma pergunta aberta e curta para iniciar a conversa.

EXEMPLO DE ESTRUTURA (Adapte conforme o nicho):
"Olá! Notei que a [NOME_EMPRESA] é referência em [CIDADE], mas vi que alguns clientes comentam sobre [DOR]. Temos uma solução que [BENEFÍCIO]. Faz sentido conversarmos sobre isso?"`,
    weeklyLimit: 50,
  };
}

export async function saveAiConfigAction(formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;
  if (!userId) throw new Error("Usuário não autenticado.");

  const agent1Prompt = formData.get("agent1Prompt") as string;
  const agent2Prompt = formData.get("agent2Prompt") as string;
  const weeklyLimit = parseInt(formData.get("weeklyLimit") as string);
  const autoOutreach = formData.get("autoOutreach") === "on" ? "true" : "false";

  const existing = await db.select().from(campaignConfigs).where(eq(campaignConfigs.userId, userId));

  if (existing.length > 0) {
    await db.update(campaignConfigs).set({ agent1Prompt, agent2Prompt, weeklyLimit, autoOutreach }).where(eq(campaignConfigs.userId, userId));
  } else {
    await db.insert(campaignConfigs).values({ 
      userId,
      name: "Configuração Padrão",
      agent1Prompt, 
      agent2Prompt, 
      weeklyLimit,
      autoOutreach
    });
  }

  revalidatePath("/agents");
  revalidatePath("/");
}
