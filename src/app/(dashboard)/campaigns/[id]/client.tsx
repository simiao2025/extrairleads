"use client";

import {
  ArrowLeft,
  Bot,
  CheckCircle,
  Layers,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  Sparkles,
  VolumeX,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  followUpLeadsAction,
  qualifyPendingLeadsAction,
  startOutreachAction,
  toggleCampaignAutomationAction,
} from "@/app/actions";
import type { Lead } from "@/components/KanbanBoard";
import { LeadsTable } from "@/components/LeadsTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

interface Campaign {
  id: number;
  userId: number | null;
  name: string;
  niche: string | null;
  city: string | null;
  state: string | null;
  autoOutreach: string | null;
  metaTemplateName: string | null;
  status: string | null;
  createdAt: Date | null;
}

interface Stats {
  total: number;
  qualified: number;
  contacted: number;
  interested: number;
  humanIntervention: number;
}

interface CampaignDetailsClientProps {
  initialCampaign: Campaign;
  initialStats: Stats;
  initialLeads: Lead[];
}

export function CampaignDetailsClient({
  initialCampaign,
  initialStats,
  initialLeads,
}: CampaignDetailsClientProps) {
  const router = useRouter();
  const { success, error } = useToast();

  const [campaign, setCampaign] = useState<Campaign>(initialCampaign);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [leadsList, setLeadsList] = useState<Lead[]>(initialLeads);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [_isPending, _startTransition] = useTransition();
  const [actionLoading, setActionLoading] = useState<{
    automation: boolean;
    qualify: boolean;
    outreach: boolean;
    followup: boolean;
  }>({
    automation: false,
    qualify: false,
    outreach: false,
    followup: false,
  });

  // Atualizar dados em tempo real chamando as actions de servidor
  const refreshData = async () => {
    const { getCampaignDetailsAction } = await import("@/app/actions");
    const data = await getCampaignDetailsAction(campaign.id);
    if (data) {
      setCampaign(data.campaign as Campaign);
      setStats(data.stats as Stats);
      setLeadsList(data.leads as unknown as Lead[]);
    }
  };

  // Alternar Automação da Campanha
  const handleToggleAutomation = async () => {
    setActionLoading((prev) => ({ ...prev, automation: true }));
    const nextStatus = campaign.autoOutreach === "true" ? "false" : "true";
    try {
      await toggleCampaignAutomationAction(campaign.id, nextStatus);
      setCampaign((prev) => ({ ...prev, autoOutreach: nextStatus }));
      success(
        nextStatus === "true"
          ? "Automação ativada! A IA enviará mensagens automaticamente."
          : "Automação pausada! Nenhum contato automático será feito.",
      );
      router.refresh();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      error(`Erro ao alterar automação: ${errMsg}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, automation: false }));
    }
  };

  // Disparar Qualificação em Lote
  const handleQualifyLeads = async () => {
    setActionLoading((prev) => ({ ...prev, qualify: true }));
    try {
      const res = await qualifyPendingLeadsAction(campaign.id);
      if (res.success) {
        success(`Sucesso! ${res.count || 0} leads estão sendo qualificados em segundo plano.`);
        await refreshData();
      } else {
        error(`Erro ao qualificar leads: ${res.error}`);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      error(`Erro na qualificação: ${errMsg}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, qualify: false }));
    }
  };

  // Disparar Prospecção Ativa (Outreach) em Lote
  const handleStartOutreach = async () => {
    setActionLoading((prev) => ({ ...prev, outreach: true }));
    try {
      const res = await startOutreachAction(campaign.id);
      if (res.success) {
        success("Mensagens de abordagem enviadas em lote com sucesso!");
        await refreshData();
      } else {
        error(`Erro na abordagem: ${res.error}`);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      error(`Erro ao iniciar prospecção: ${errMsg}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, outreach: false }));
    }
  };

  // Disparar Follow-ups em Lote
  const handleStartFollowups = async () => {
    setActionLoading((prev) => ({ ...prev, followup: true }));
    try {
      const res = await followUpLeadsAction(campaign.id);
      if (res.success) {
        success(`Follow-up disparado! ${res.count || 0} leads sem resposta foram reengajados.`);
        await refreshData();
      } else {
        error(`Erro no follow-up: ${res.error}`);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      error(`Erro no follow-up: ${errMsg}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, followup: false }));
    }
  };

  // Filtros Locais
  const filteredLeads = useMemo(() => {
    return leadsList.filter((l) => {
      const matchesSearch =
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.phone?.includes(search) ||
        l.niche?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "" || l.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [leadsList, search, statusFilter]);

  const statusOptions = [
    { value: "", label: "Todos" },
    { value: "raw", label: "Novos" },
    { value: "qualified", label: "Qualificados" },
    { value: "contacted", label: "Abordados" },
    { value: "interested", label: "Interessados" },
    { value: "human_intervention", label: "Intervenção" },
  ];

  return (
    <div className="min-h-screen bg-transparent text-white p-4 md:p-8 space-y-8 animate-page-in">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ------------------------------------------------------------- */}
        {/* 1. CABEÇALHO DEDICADO                                         */}
        {/* ------------------------------------------------------------- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/30 border border-zinc-800/40 p-6 rounded-2xl backdrop-blur-xl">
          <div className="space-y-2">
            <Link
              href="/campaigns"
              className="inline-flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-emerald-400 uppercase tracking-widest transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar para Campanhas
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight leading-none font-heading text-white">
                {campaign.name}
              </h1>
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold px-2.5 py-0.5 rounded-full uppercase text-[10px]"
              >
                {campaign.niche}
              </Badge>
            </div>

            <p className="text-xs text-zinc-400 flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              {campaign.city}, {campaign.state}
            </p>
          </div>

          {/* Automação Switch */}
          <div className="flex items-center gap-3 bg-[#202c33]/30 border border-zinc-800/60 p-3.5 rounded-xl">
            <div className="flex flex-col text-left">
              <span className="text-xs font-black uppercase text-zinc-300">Automação IA</span>
              <span className="text-[10px] text-zinc-500">
                Abordar qualificados automaticamente
              </span>
            </div>
            <Button
              onClick={handleToggleAutomation}
              disabled={actionLoading.automation}
              type="button"
              className={`text-xs font-black uppercase px-4 py-2 rounded-xl transition-all cursor-pointer ${
                campaign.autoOutreach === "true"
                  ? "bg-emerald-500 text-emerald-950 hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
              }`}
            >
              {actionLoading.automation ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : campaign.autoOutreach === "true" ? (
                "Ativa"
              ) : (
                "Pausada"
              )}
            </Button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 2. BENTO GRID DE ESTATÍSTICAS                                */}
        {/* ------------------------------------------------------------- */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Leads Totais */}
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5 hover:border-zinc-700 transition-all duration-300 group flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Leads Capturados
              </span>
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-white group-hover:text-emerald-400 transition-colors font-mono">
                {stats.total}
              </span>
              <p className="text-[10px] text-zinc-500 mt-1">Extraídos na busca</p>
            </div>
          </div>

          {/* Leads Qualificados */}
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5 hover:border-zinc-700 transition-all duration-300 group flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Qualificados IA
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-emerald-400 font-mono">
                {stats.qualified}
              </span>
              <p className="text-[10px] text-zinc-500 mt-1">Aprovados pela IA</p>
            </div>
          </div>

          {/* Leads Abordados */}
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5 hover:border-zinc-700 transition-all duration-300 group flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Contatados
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                <MessageSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-blue-400 font-mono">{stats.contacted}</span>
              <p className="text-[10px] text-zinc-500 mt-1">Primeiro contato feito</p>
            </div>
          </div>

          {/* Leads Interessados */}
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5 hover:border-zinc-700 transition-all duration-300 group flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Interessados
              </span>
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-orange-400 font-mono">
                {stats.interested}
              </span>
              <p className="text-[10px] text-zinc-500 mt-1">Respostas positivas</p>
            </div>
          </div>

          {/* Leads Intervenção */}
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5 hover:border-zinc-700 transition-all duration-300 group flex flex-col justify-between col-span-2 md:col-span-1">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Intervenção Humana
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <VolumeX className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-amber-400 font-mono">
                {stats.humanIntervention}
              </span>
              <p className="text-[10px] text-zinc-500 mt-1">IA silenciada</p>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 3. DISPAROS EM LOTE (AÇÕES RÁPIDAS)                           */}
        {/* ------------------------------------------------------------- */}
        <div className="bg-zinc-900/20 border border-zinc-800/40 p-6 rounded-2xl space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-400" /> Ações em Lote Disponíveis
          </h3>
          <p className="text-xs text-zinc-500">
            Dispare fluxos automatizados em massa dedicados apenas para os contatos desta campanha.
          </p>

          <div className="flex flex-wrap gap-4">
            {/* Qualificar Pendentes */}
            <Button
              onClick={handleQualifyLeads}
              disabled={actionLoading.qualify}
              type="button"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase cursor-pointer transition-all bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40"
            >
              {actionLoading.qualify ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
              Qualificar Leads Pendentes
            </Button>

            {/* Iniciar Abordagem */}
            <Button
              onClick={handleStartOutreach}
              disabled={actionLoading.outreach}
              type="button"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase cursor-pointer transition-all bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/40"
            >
              {actionLoading.outreach ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Phone className="w-4 h-4" />
              )}
              Abordar Qualificados
            </Button>

            {/* Disparar Follow-ups */}
            <Button
              onClick={handleStartFollowups}
              disabled={actionLoading.followup}
              type="button"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase cursor-pointer transition-all bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40"
            >
              {actionLoading.followup ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Disparar Follow-ups
            </Button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 4. LISTA DE LEADS COM FILTROS                                 */}
        {/* ------------------------------------------------------------- */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <h2 className="text-xl font-black text-white font-heading tracking-wide">
              Leads da Campanha
            </h2>

            {/* Barra de Busca e Filtros de Status */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  placeholder="Buscar lead..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-emerald-500/30"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none scroll-smooth">
                {statusOptions.map((opt) => {
                  const isActive = statusFilter === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStatusFilter(opt.value)}
                      className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        isActive
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.05)]"
                          : "bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tabela Reutilizada */}
          <div className="bg-zinc-900/10 border border-zinc-800/30 rounded-2xl p-4">
            <LeadsTable leads={filteredLeads} onRefresh={refreshData} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Loader simples
function Loader2({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`animate-spin ${className}`}
    >
      <title>Carregando...</title>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
