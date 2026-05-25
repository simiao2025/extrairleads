"use client";

import { motion } from "framer-motion";
import { Cpu, Crosshair, MapPin, Search, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { createScrapingJobAction, runScrapingJobAction } from "@/app/actions";
import { ProgressModal } from "@/components/ProgressModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type SearchMode = "scrape-only" | "qualify";

export default function SearchForm({
  campaigns = [],
  selectedCampaignId,
}: {
  campaigns?: any[];
  selectedCampaignId?: string;
}) {
  const initialCampaign =
    selectedCampaignId && campaigns.length > 0
      ? campaigns.find((c) => String(c.id) === String(selectedCampaignId))
      : null;

  // Lógica purificada: estado explícito de modo (union type)
  const [mode, setMode] = useState<SearchMode>("qualify");

  const [niche, setNiche] = useState(initialCampaign?.niche || "");
  const [city, setCity] = useState(initialCampaign?.city || "");
  const [state, setState] = useState(initialCampaign?.state || "");
  const [campaignId, setCampaignId] = useState(selectedCampaignId || "");
  const [limit, setLimit] = useState(20);
  const [jobId, setJobId] = useState<number | null>(null);

  const { error } = useToast();

  useEffect(() => {
    if (selectedCampaignId && selectedCampaignId !== campaignId) {
      setCampaignId(selectedCampaignId);
      const campaign = campaigns.find((c) => String(c.id) === String(selectedCampaignId));
      if (campaign) {
        setNiche(campaign.niche || "");
        setCity(campaign.city || "");
        setState(campaign.state || "");
        setMode("qualify"); // Auto-seleciona o modo caso venha de um atalho global
      }
    }
  }, [selectedCampaignId, campaignId, campaigns]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação limpa baseada no modo explícito
    if (mode === "qualify" && !campaignId) {
      error("Selecione uma campanha de destino!");
      return;
    }

    try {
      const isScrapeOnly = mode === "scrape-only";
      const finalCampaignId = !isScrapeOnly && campaignId ? parseInt(campaignId, 10) : null;

      const jobRes = await createScrapingJobAction({
        campaignId: finalCampaignId,
        limit,
        onlyScrape: isScrapeOnly,
      });

      if (!jobRes.success || !jobRes.jobId) {
        error(jobRes.error || "Erro ao criar tarefa de extração");
        return;
      }

      setJobId(jobRes.jobId);

      // Background process
      runScrapingJobAction({
        jobId: jobRes.jobId,
        campaignId: finalCampaignId,
        niche,
        city,
        state,
        limit,
        onlyScrape: isScrapeOnly,
      }).catch(console.error);
    } catch (_err) {
      error("Erro inesperado na busca.");
    }
  };

  return (
    <>
      <ProgressModal
        jobId={jobId}
        onlyScrape={mode === "scrape-only"}
        onClose={() => setJobId(null)}
      />
      <Card className="w-full max-w-4xl mx-auto border-zinc-800/60 bg-zinc-950/80 backdrop-blur-2xl shadow-2xl overflow-hidden relative">
        {/* Decorative background glow */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-50" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />

        <CardHeader className="flex flex-col md:flex-row gap-6 md:items-center md:justify-between relative z-10 pb-4 border-b border-zinc-800/50">
          <div>
            <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Capturar Leads
              </span>
              <Cpu className="w-6 h-6 text-emerald-500 animate-pulse" />
            </CardTitle>
            <CardDescription className="text-zinc-400 mt-1 font-medium">
              Escolha seu modo de operação para prospecção.
            </CardDescription>
          </div>

          {/* Segmented Control UI replacing the confusing Switch */}
          <div className="flex p-1 bg-zinc-900/80 rounded-xl border border-zinc-800/80 shadow-inner relative">
            <button
              type="button"
              onClick={() => setMode("scrape-only")}
              className={`relative flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-lg transition-colors z-10 ${
                mode === "scrape-only" ? "text-emerald-50" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]" />
              Apenas Raspagem
              {mode === "scrape-only" && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-emerald-500/20 border border-emerald-500/50 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
            </button>
            <button
              type="button"
              onClick={() => setMode("qualify")}
              className={`relative flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-lg transition-colors z-10 ${
                mode === "qualify" ? "text-orange-50" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Crosshair className="w-4 h-4" />
              Raspagem + Qualificação
              {mode === "qualify" && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-orange-500/20 border border-orange-500/50 rounded-lg shadow-[0_0_15px_rgba(249,115,22,0.2)]"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-6 relative z-10">
          <form onSubmit={handleSearch} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div
                className={`md:col-span-1 group transition-opacity duration-200 ${mode === "qualify" ? "opacity-40 pointer-events-none" : ""}`}
              >
                <label
                  htmlFor="niche"
                  className="text-[10px] font-bold text-zinc-400 mb-1.5 block uppercase tracking-wider group-focus-within:text-emerald-400 transition-colors"
                >
                  Nicho
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                  <Input
                    id="niche"
                    placeholder="Ex: Pizzaria"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    disabled={mode === "qualify"}
                    className="pl-10 bg-zinc-900/50 border-zinc-800 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all font-medium text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    required={mode === "scrape-only"}
                  />
                </div>
              </div>

              <div
                className={`md:col-span-1 group transition-opacity duration-200 ${mode === "qualify" ? "opacity-40 pointer-events-none" : ""}`}
              >
                <label
                  htmlFor="city"
                  className="text-[10px] font-bold text-zinc-400 mb-1.5 block uppercase tracking-wider group-focus-within:text-emerald-400 transition-colors"
                >
                  Cidade
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                  <Input
                    id="city"
                    placeholder="Ex: São Paulo"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={mode === "qualify"}
                    className="pl-10 bg-zinc-900/50 border-zinc-800 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all font-medium text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    required={mode === "scrape-only"}
                  />
                </div>
              </div>

              <div
                className={`md:col-span-1 group transition-opacity duration-200 ${mode === "qualify" ? "opacity-40 pointer-events-none" : ""}`}
              >
                <label
                  htmlFor="state"
                  className="text-[10px] font-bold text-zinc-400 mb-1.5 block uppercase tracking-wider group-focus-within:text-emerald-400 transition-colors"
                >
                  UF
                </label>
                <Input
                  id="state"
                  placeholder="SP"
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  disabled={mode === "qualify"}
                  className="bg-zinc-900/50 border-zinc-800 text-center font-black focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  maxLength={2}
                  required={mode === "scrape-only"}
                />
              </div>

              <div className="md:col-span-1 group">
                <label
                  htmlFor="limit"
                  className="text-[10px] font-bold text-zinc-400 mb-1.5 block uppercase tracking-wider group-focus-within:text-emerald-400 transition-colors"
                >
                  Quantidade
                </label>
                <select
                  id="limit"
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="w-full flex h-10 rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500/50 text-white font-medium transition-all"
                >
                  <option value={20}>20 Leads Rápidos</option>
                  <option value={40}>40 Leads Padrão</option>
                  <option value={60}>60 Leads (Máximo)</option>
                </select>
              </div>
            </div>

            <div
              className={`w-full group transition-opacity duration-200 ${mode === "scrape-only" ? "opacity-40 pointer-events-none" : ""}`}
            >
              <label
                htmlFor="campaignId"
                className="text-[10px] font-bold text-zinc-400 mb-2 block uppercase tracking-widest group-focus-within:text-orange-400 transition-colors"
              >
                Vincular a uma Campanha de Destino
              </label>
              <select
                id="campaignId"
                value={campaignId}
                onChange={(e) => {
                  const val = e.target.value;
                  setCampaignId(val);
                  if (val && campaigns.length > 0) {
                    const campaign = campaigns.find((c) => c.id.toString() === val.toString());
                    if (campaign) {
                      setNiche(campaign.niche || "");
                      setCity(campaign.city || "");
                      setState(campaign.state || "");
                    }
                  }
                }}
                disabled={mode === "scrape-only"}
                className="w-full flex h-12 rounded-lg border-2 border-zinc-800 bg-zinc-900/80 px-4 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/20 focus-visible:border-orange-500/50 text-white font-bold transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                required={mode === "qualify"}
              >
                <option value="" disabled className="text-zinc-500 font-normal">
                  Selecione uma campanha na lista...
                </option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.city}/{c.state}
                  </option>
                ))}
              </select>

              {campaigns.length === 0 && mode === "qualify" && (
                <div className="mt-4">
                  <Link
                    href="/campaigns"
                    className="flex items-center justify-center w-full h-12 rounded-lg bg-orange-500/10 text-orange-400 text-sm font-bold border border-orange-500/20 hover:bg-orange-500/20 hover:border-orange-500/40 hover:-translate-y-0.5 transition-all shadow-[0_0_15px_rgba(249,115,22,0.1)] hover:shadow-[0_0_20px_rgba(249,115,22,0.2)]"
                  >
                    + Criar Minha Primeira Campanha
                  </Link>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={!!jobId || (mode === "qualify" && !campaignId)}
                className={`relative w-full h-12 font-black uppercase tracking-widest transition-all overflow-hidden group ${
                  jobId || (mode === "qualify" && !campaignId)
                    ? "opacity-50 cursor-not-allowed bg-zinc-800 text-zinc-500 border-zinc-700"
                    : mode === "scrape-only"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-black hover:border-emerald-500 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                      : "bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500 hover:text-black hover:border-orange-500 hover:shadow-[0_0_30px_rgba(249,115,22,0.4)]"
                }`}
              >
                {/* Efeito de brilho hover */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />

                {jobId ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
                    Processando...
                  </span>
                ) : mode === "scrape-only" ? (
                  <span className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />{" "}
                    Iniciar Raspagem Rápida
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Crosshair className="w-5 h-5" /> Iniciar Raspagem + Qualificação
                  </span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
