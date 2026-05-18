"use client";

import { useState } from "react";
import { Search, MapPin, Zap, ZapOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { searchLeadsAction } from "@/app/actions";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

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
    } catch (err) {
      console.error(err);
      error("Erro inesperado na busca.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto border-zinc-800 bg-zinc-950/50 backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Capturar Novos Leads
          </CardTitle>
          <CardDescription>
            Defina o nicho e a localização para extrair contatos.
          </CardDescription>
        </div>

        <div className="flex items-center space-x-2 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
          <Label htmlFor="mode" className="text-xs font-bold text-zinc-400 uppercase tracking-tighter">
            {onlyScrape ? "Apenas Extração" : "Extração + IA"}
          </Label>
          <Switch
            id="mode"
            checked={!onlyScrape}
            onCheckedChange={(checked) => setOnlyScrape(!checked)}
          />
          {!onlyScrape ? <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" /> : <ZapOff className="w-4 h-4 text-zinc-600" />}
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
            <label className="text-[10px] font-bold text-zinc-500 mb-1.5 block uppercase">Nicho</label>
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
            <label className="text-[10px] font-bold text-zinc-500 mb-1.5 block uppercase">Cidade</label>
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
              className={`w-full font-black transition-all shadow-lg hover:scale-105 active:scale-95 ${
                onlyScrape
                  ? "bg-zinc-800 hover:bg-zinc-700 text-white"
                  : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              }`}
              disabled={loading}
            >
              {loading ? "Processando..." : (onlyScrape ? "Apenas Extrair" : "Extrair + Ativar IA")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}