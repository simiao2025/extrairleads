# Design Doc: Filtros por Campanha e Nicho na Página de Leads

**Data:** 2026-06-01  
**Autor:** Antigravity AI  
**Status:** Aprovado (Abordagem 1: Filtragem no Servidor)

## 1. Escopo & Objetivos
Implementar filtros dinâmicos de **Campanha** e **Nicho** na página `/leads` utilizando a Abordagem 1 (Server-side rendering com Next.js Server Components e busca Drizzle ORM).

## 2. Arquitetura e Fluxo de Dados
1. **Página no Servidor (`src/app/(dashboard)/leads/page.tsx`):**
   - Extrai `campaignId` e `niche` de `searchParams`.
   - Busca no banco de dados todas as campanhas do usuário (`campaigns`) para popular o seletor.
   - Extrai os nichos únicos associados aos leads existentes do usuário para popular o seletor de nichos.
   - Filtra os leads no Drizzle utilizando condições dinâmicas (`and(eq(leads.userId, userId), campaignId && eq(leads.campaignId, campaignId), niche && eq(leads.niche, niche), ...)`).
   - Passa os leads filtrados, a lista de campanhas, a lista de nichos e os valores iniciais dos filtros para o cliente.

2. **Componente Cliente (`src/app/(dashboard)/leads/client.tsx`):**
   - Recebe a lista de nichos únicos e de campanhas como props.
   - Renderiza dois novos elementos `<select>` no formulário de filtros com visual premium (zinc glassmorphism, foco em esmeralda).
   - Atualiza a URL via `router.push` quando os filtros mudam, mantendo os parâmetros existentes como `search` e resetando a página atual para `1` (evitando ficar preso em páginas vazias após aplicar filtros restritivos).
   - Oferece suporte para botão de limpar filtros que limpa todos os filtros ativos de uma só vez.

## 3. Interfaces & Tipagens
Atualizar `LeadsClientProps` para aceitar:
```typescript
interface LeadsClientProps {
	initialSearch: string;
	initialStatus: string;
	initialCampaignId: string;
	initialNiche: string;
	filteredLeads: Lead[];
	campaigns: { id: number; name: string }[];
	niches: string[];
	currentPage: number;
}
```

## 4. Testes e Verificação
- Verificar se a seleção de nicho atualiza a tabela com leads daquele nicho específico.
- Verificar se a seleção de campanha atualiza os leads daquela campanha.
- Verificar se a combinação de múltiplos filtros (Search + Status + Campaign + Niche) funciona de maneira harmônica.
- Garantir que limpar filtros reseta a URL de volta ao estado padrão limpo.
