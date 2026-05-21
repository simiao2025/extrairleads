"use client";

import { Cpu, MapPin, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { searchLeadsAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";

export default function SearchForm() {
  const [niche, setNiche] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(false);
  const [onlyScrape, setOnlyScrape] = useState(false);
  const { success, error } = useToast();
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await searchLeadsAction({ niche, city, state, onlyScrape });
      if (result.success) {
        success(`${result.count} leads extraídos com sucesso!`);
        router.refresh();
      } else {
        error(result.error || "Erro ao buscar leads.");
      }
    } catch (_err) {
      error("Erro inesperado na busca.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto border-zinc-800 bg-zinc-950/50 backdrop-blur-xl">
      <CardHeader className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Capturar Novos Leads
          </CardTitle>
          <CardDescription>Defina o nicho e a localização para extrair contatos.</CardDescription>
        </div>

        <div className="flex items-center justify-between sm:justify-start space-x-2 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800 self-stretch sm:self-auto">
          <Label
            htmlFor="mode"
            className="text-xs font-bold text-zinc-400 uppercase tracking-tighter"
          >
            {onlyScrape ? "Apenas Extração" : "Extração + IA"}
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

          <div className="flex items-end">
            <Button
              type="submit"
              className={`w-full font-bold transition-all backdrop-blur-md hover:-translate-y-0.5 active:translate-y-0 active:scale-98 cursor-pointer ${
                onlyScrape
                  ? "bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-black hover:border-emerald-500/50 hover:shadow-[0_0_25px_rgba(16,185,129,0.3)]"
              }`}
              disabled={loading}
            >
              {loading ? "Processando..." : onlyScrape ? "Apenas Extrair" : "Extrair + Ativar IA"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
