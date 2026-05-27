"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { createCampaignAction } from "@/actions/campaigns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function CreateCampaignDialog({ provider = "evolution" }: { provider?: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await createCampaignAction(formData);
      setOpen(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao criar campanha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-bold shadow-lg shadow-blue-500/20" />
        }
      >
        <Plus className="w-5 h-5" />
        Nova Campanha
      </DialogTrigger>
      <DialogContent className="bg-[#18181b] border-zinc-800 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-400">Criar Campanha</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Defina o alvo da sua nova campanha de prospecção.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label htmlFor="campaign-name" className="text-sm font-medium text-zinc-300">
              Nome da Campanha
            </label>
            <Input
              id="campaign-name"
              name="name"
              placeholder="Ex: Dentistas SP - Maio"
              required
              className="bg-zinc-900 border-zinc-800 text-white"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="campaign-niche" className="text-sm font-medium text-zinc-300">
              Nicho de Busca
            </label>
            <Input
              id="campaign-niche"
              name="niche"
              placeholder="Ex: Clínicas odontológicas"
              required
              className="bg-zinc-900 border-zinc-800 text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="campaign-city" className="text-sm font-medium text-zinc-300">
                Cidade
              </label>
              <Input
                id="campaign-city"
                name="city"
                placeholder="Ex: São Paulo"
                required
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="campaign-state" className="text-sm font-medium text-zinc-300">
                Estado (UF)
              </label>
              <Input
                id="campaign-state"
                name="state"
                placeholder="Ex: SP"
                required
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="space-y-0.5">
              <span className="text-sm font-medium text-zinc-300">Disparo Automático</span>
              <p className="text-xs text-zinc-500">A IA envia mensagem assim que qualificar</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" name="autoOutreach" value="true" className="sr-only peer" />
              <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          {provider === "meta_official" && (
            <div className="space-y-2 pt-2 border-t border-zinc-800/50 mt-2">
              <label htmlFor="meta-template" className="text-sm font-medium text-blue-400">
                Nome do Template Meta (Obrigatório)
              </label>
              <p className="text-xs text-zinc-500">
                Digite exatamente o nome aprovado no gerenciador da Meta.
              </p>
              <Input
                id="meta-template"
                name="metaTemplateName"
                placeholder="Ex: hello_world_v2"
                required
                className="bg-zinc-900 border-zinc-800 text-white focus-visible:ring-blue-500"
              />
            </div>
          )}
          <DialogFooter className="pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              {loading ? "Criando..." : "Criar Campanha"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
