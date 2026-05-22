"use client";

import { Cpu, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createScrapingJobAction, runScrapingJobAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { ProgressModal } from "@/components/ProgressModal";

export default function SearchForm({ 
  campaigns = [], 
  selectedCampaignId 
}: { 
  campaigns?: any[];
  selectedCampaignId?: string;
}) {
  const [niche, setNiche] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [campaignId, setCampaignId] = useState(selectedCampaignId || "");
  const [limit, setLimit] = useState(20);
  const [onlyScrape, setOnlyScrape] = useState(false);
  const [jobId, setJobId] = useState<number | null>(null);
  const { success, error } = useToast();
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!campaignId) {
      error("Selecione uma campanha de destino!");
      return;
    }

    try {
      const jobRes = await createScrapingJobAction({
        campaignId: parseInt(campaignId, 10),
        limit,
        onlyScrape
      });

      if (!jobRes.success || !jobRes.jobId) {
        error(jobRes.error || "Erro ao criar tarefa de extração");
        return;
      }

      setJobId(jobRes.jobId);

      // Inicia em background
      runScrapingJobAction({
        jobId: jobRes.jobId,
        campaignId: parseInt(campaignId, 10),
        niche,
        city,
        state,
        limit,
        onlyScrape
      }).catch(console.error);

    } catch (_err) {
      error("Erro inesperado na busca.");
    }
  };

  return (
    <>
      <ProgressModal jobId={jobId} onClose={() => setJobId(null)} />
      <Card className="w-full max-w-4xl mx-auto border-zinc-800 bg-zinc-950/50 backdrop-blur-xl">
      <CardHeader className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-2xl font-bold text-[#25D366]">
            Capturar Novos Leads
          </CardTitle>
          <CardDescription>Defina o nicho e a localização para extrair contatos.</CardDescription>
        </div>

        <div className="flex items-center justify-between sm:justify-start space-x-2 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800 self-stretch sm:self-auto">
          <Label
            htmlFor="mode"
            className="text-xs font-bold text-zinc-400 uppercase tracking-tighter"
          >
            {onlyScrape ? "Apenas Raspagem" : "Raspagem + Qualificação"}
          </Label>
          <Switch
            id="mode"
            checked={!onlyScrape}
            onCheckedChange={(checked) => setOnlyScrape(!checked)}
          />
          {!onlyScrape ? (
            <Cpu className="w-4 h-4 text-orange-500 drop-shadow-[0_0_6px_rgba(249,115,22,0.4)]" />
          ) : (
            <Cpu className="w-4 h-4 text-zinc-600" />
          )}
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
            <label className="text-[10px] font-bold text-zinc-500 mb-1.5 block uppercase">
              Nicho
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Pizzaria"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="pl-10 bg-zinc-900 border-zinc-800 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-colors"
                required
              />
            </div>
          </div>

          <div className="md:col-span-1">
            <label className="text-[10px] font-bold text-zinc-500 mb-1.5 block uppercase">
              Cidade
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="São Paulo"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="pl-10 bg-zinc-900 border-zinc-800 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-colors"
                required
              />
            </div>
          </div>

          <div className="md:col-span-1">
            <label className="text-[10px] font-bold text-zinc-500 mb-1.5 block uppercase">UF</label>
            <Input
              placeholder="SP"
              value={state}
              onChange={(e) => setState(e.target.value.toUpperCase())}
              className="bg-zinc-900 border-zinc-800 text-center font-bold focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-colors"
              maxLength={2}
              required
            />
          </div>

          <div className="md:col-span-1">
            <label className="text-[10px] font-bold text-zinc-500 mb-1.5 block uppercase">Quantidade</label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full flex h-10 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50 text-white"
            >
              <option value={20}>20 Leads</option>
              <option value={40}>40 Leads</option>
              <option value={60}>60 Leads</option>
            </select>
          </div>

          <div className="md:col-span-4 mt-2 mb-2">
            <label className="text-[10px] font-bold text-zinc-500 mb-1.5 block uppercase">Campanha de Destino</label>
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              className="w-full flex h-10 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50 text-white"
              required
            >
              <option value="" disabled>Selecione uma campanha...</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {campaigns.length === 0 && (
              <div className="mt-3 animate-in fade-in zoom-in duration-500">
                <Link 
                  href="/campaigns" 
                  className="flex items-center justify-center w-full h-10 rounded-lg bg-blue-500/10 text-blue-400 text-sm font-bold border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/40 hover:-translate-y-0.5 transition-all shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                >
                  Criar Minha Primeira Campanha
                </Link>
              </div>
            )}
          </div>

          <div className="md:col-span-4 flex items-end">
            <Button
              type="submit"
              className={`w-full font-bold transition-all backdrop-blur-md ${
                !campaignId
                  ? "opacity-50 cursor-not-allowed bg-zinc-800/50 text-zinc-500 border border-zinc-700/50"
                  : onlyScrape
                    ? "hover:-translate-y-0.5 active:translate-y-0 active:scale-98 cursor-pointer bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                    : "hover:-translate-y-0.5 active:translate-y-0 active:scale-98 cursor-pointer bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-black hover:border-emerald-500/50 hover:shadow-[0_0_25px_rgba(16,185,129,0.3)]"
              }`}
              disabled={!!jobId || !campaignId}
            >
              {!!jobId ? "Processando..." : onlyScrape ? "Apenas Raspagem" : "Raspagem + Qualificação"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
    </>
  );
}
