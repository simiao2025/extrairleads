"use client";

import { Loader2, Play, RefreshCw, ScanSearch } from "lucide-react";
import { useState } from "react";
import { followUpLeadsAction, qualifyPendingLeadsAction, startOutreachAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function AnalyzeButton() {
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await qualifyPendingLeadsAction();
      if (result.count === 0) {
        success("Nenhum lead pendente de análise.");
      } else {
        success(`${result.count} lead(s) analisado(s) pelo Agente IA com sucesso!`);
      }
    } catch (_err) {
      error("Erro ao executar a análise. Verifique o console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="rounded-xl h-12 px-6 bg-white/[0.02] border border-white/10 text-zinc-400 backdrop-blur-md hover:bg-white/5 hover:border-white/20 hover:text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all duration-300 active:scale-98 cursor-pointer"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <ScanSearch className="mr-2 h-4 w-4" />
      )}
      {loading ? "Analisando..." : "Análise de Raspagem"}
    </Button>
  );
}

export function OutreachButton() {
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await startOutreachAction();
      if (result.success) {
        success("Motor IA ativado! Mensagens sendo disparadas.");
      } else {
        error(result.error || "Erro ao ativar o motor.");
      }
    } catch (_err) {
      error("Erro ao ativar o motor. Verifique o console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      className="rounded-xl h-12 px-8 bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/25 backdrop-blur-md hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40 hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] active:translate-y-0 active:scale-98 transition-all duration-300 cursor-pointer"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Play className="mr-2 h-4 w-4 fill-current" />
      )}
      {loading ? "Processando..." : "Ligar Motor IA"}
    </Button>
  );
}

export function FollowUpButton() {
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await followUpLeadsAction();
      if (result.success) {
        if (result.count === 0) {
          success("Nenhum lead aguardando follow-up.");
        } else {
          success(`Follow-up enviado para ${result.count} lead(s)!`);
        }
      } else {
        error(result.error || "Erro ao realizar follow-up.");
      }
    } catch (_err) {
      error("Erro na rotina de follow-up. Verifique o console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="rounded-xl h-12 px-8 bg-orange-500/5 border border-orange-500/20 text-orange-400 backdrop-blur-sm hover:bg-orange-500/15 hover:border-orange-500/45 hover:text-orange-300 hover:shadow-[0_0_20px_rgba(249,115,22,0.15)] hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-300 cursor-pointer"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="mr-2 h-4 w-4" />
      )}
      {loading ? "Retomando..." : "Retomar Contatos"}
    </Button>
  );
}
