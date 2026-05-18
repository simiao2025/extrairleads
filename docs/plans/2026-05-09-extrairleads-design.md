# Design Doc: Extrairleads - Plataforma Inteligente de Prospecção Local

Este documento detalha o design e a arquitetura do projeto **Extrairleads**, uma ferramenta de captação de leads via Google Maps com qualificação baseada em múltiplos agentes de IA e prospecção automatizada via WhatsApp.

## 1. Visão Geral do Produto

O **Extrairleads** permite que o usuário realize buscas de nichos comerciais em cidades específicas, capture os dados do Google Maps, utilize agentes de IA para qualificar e classificar esses leads com base em regras customizáveis e, por fim, inicie campanhas de abordagem automática via WhatsApp com controle de cadência.

## 2. Requisitos do Sistema

### 2.1 Extração de Leads
- Campos de busca: Atividade Comercial (Nicho), Cidade e Estado.
- Integração com API de terceiros (SerpApi ou Outscraper) para captura de dados do Google Maps.

### 2.2 Inteligência Artificial (Multi-Agentes)
- **Agente 1 (Analista):** Classifica os dados brutos conforme um **Prompt Configurável pelo Usuário**.
- **Agente 2 (SDR):** Redige a abordagem personalizada e gerencia a qualificação inicial no WhatsApp.

### 2.3 Gestão de Campanhas e Kanban
- Interface de **Kanban interativo** para gestão do funil de vendas (Novos, Qualificados, Contatados, Interessados).
- Configuração de limites de disparos semanais/diários.
- Intervalos entre mensagens para evitar bloqueios.

## 3. Arquitetura Técnica

### 3.1 Tech Stack
- **Frontend/Backend:** Next.js (App Router) + Tailwind CSS + ShadcnUI.
- **Banco de Dados:** Neon (Postgres Serverless).
- **ORM:** Drizzle ORM.
- **IA:** OpenAI API (GPT-4o/o1) ou Anthropic.
- **WhatsApp Gateway:** Evolution API.

### 3.2 Estrutura de Dados (Drizzle)
- `leads`: id, name, phone, website, niche, city, state, ai_score, ai_analysis, status (kanban_stage), metadata.
- `campaign_configs`: id, user_id, agent_1_prompt, agent_2_prompt, weekly_limit, etc.

## 4. Fluxo de Operação

1. **Configuração:** Definição de nicho, local e prompts de IA.
2. **Scraping:** Captura de dados brutos.
3. **Qualificação:** Agente 1 classifica e move para a coluna "Qualificados".
4. **Engajamento:** Sistema agenda disparos respeitando o limite semanal.
5. **Acompanhamento:** Gestão via Kanban das respostas e fechamentos.

## 5. Próximos Passos
1. Setup do projeto Next.js.
2. Configuração do Drizzle + Neon.
3. Implementação do módulo de busca (Google Maps API).
4. Implementação da interface de Kanban.
5. Integração com Evolution API.
