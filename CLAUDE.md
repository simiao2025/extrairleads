# Contexto de Desenvolvimento: ExtrairLeads

Este documento resume as regras de desenvolvimento, comandos úteis e os resultados da última varredura de pureza e qualidade de código (`/code-purity`).

---

## 1. Comandos de Desenvolvimento e Build

* **Servidor de Desenvolvimento:** `npm run dev`
* **Build de Produção:** `npm run build`
* **Iniciar Servidor de Build:** `npm start`
* **Linting / Formatação (Biome):** `npx biome check --write <arquivos>`

---

## 2. Comandos de Testes

* **Testes Unitários (Vitest):** `npm run test` (ou rodar arquivo específico: `npx vitest run <caminho_do_teste>`)
* **Testes de UI do Vitest:** `npm run test:ui`
* **Testes End-to-End (Playwright):** `npm run test:e2e`

---

## 3. Comandos de Auditoria e Pureza de Código (`/code-purity`)

* **Biome (Lint & Formatação):** `npm run audit:biome`
* **Knip (Código Morto):** `npm run audit:deadcode`
* **jscpd (Código Duplicado):** `npm run audit:duplicates`
* **depcheck (Dependências órfãs):** `npm run audit:deps`
* **madge (Imports Circulares):** `npm run audit:circular`
* **Auditar Tudo de uma vez:** `npm run audit:all`

---

## 4. Relatório da Última Varredura de Pureza (2026-05-28)

Executamos a varredura automatizada completa após a implementação dos parsers de RAG:

* **Código Duplicado (`jscpd`):** **2.38%** de duplicação total no projeto (extremamente saudável, abaixo do limite de atenção de 5%).
* **Imports Circulares (`madge`):** **0 dependências circulares** encontradas na varredura.
* **Testes de RAG (`Vitest`):** 6/6 testes unitários passando com sucesso para os parsers de Markdown e planilhas Excel (incluindo segmentação e duplicação de cabeçalhos).
* **Biome Linter:** Arquivos modificados foram formatados, limpos de avisos e tiveram seus imports organizados perfeitamente.

---

## 5. Arquitetura da Base RAG e Parsers

* **Tabelas do Banco (Drizzle + pgvector):** 
  * `documents` (status, fileName, fileType, userId).
  * `knowledge_base` (content, title, embedding: `vector(1536)`).
* **Modo de Extração:**
  * **Markdown (`.md`):** Fragmentação inteligente por títulos (`# H1`, `## H2`). Seções extensas recebem o sufixo `(Continuação)` dinâmico para RAG.
  * **Excel (`.xls`, `.xlsx`):** Conversão para tabelas Markdown. Planilhas longas (> 20 linhas) são divididas, replicando a linha de cabeçalho e separadores no início de cada novo fragmento de tabela.
* **Módulo central:** `src/lib/document-parsers.ts`
* **API Endpoint:** `src/app/api/knowledge/upload/route.ts` (com estratégia de rollback no banco caso ocorra erro ao gerar embeddings).

---

## 6. Diretrizes de Qualidade Obrigatórias (Sempre Executar)

Todos os agentes de IA e desenvolvedores que atuarem neste repositório devem, **obrigatoriamente**, realizar varreduras e revisões de qualidade baseadas nas seguintes diretrizes antes de finalizar qualquer entrega:

1. **Pureza de Código (`/code-purity`):**
   * Eliminar qualquer dead code, variáveis ou imports não utilizados.
   * Evitar duplicação lógica (DRY) extraindo utilitários compartilhados.
   * Manter consistência estrita de estilo rodando o formatador do Biome.
   
2. **Cibersegurança Web (`/cybersecurity-web`):**
   * Auditar rotas, webhooks e manipulação de formulários contra vulnerabilidades do OWASP Top 10 (especialmente A10:2025 - Mishandling of Exceptional Conditions).
   * Validar inputs utilizando Zod e garantir parametrização de consultas SQL (Drizzle ORM).
   * Proteger segredos de ambiente no `.env` e nunca expor chaves ou senhas em texto puro.

3. **Otimização de Performance (`/performance-optimization`):**
   * Adicionar índices em chaves estrangeiras (`campaignId`, `userId`, `niche`) nas tabelas de leads e tarefas.
   * Evitar loops bloqueantes estáticos, optando por concorrência paralela controlada (Promise.all chunks).
   * Otimizar payloads de RSC (React Server Components) para o cliente.
