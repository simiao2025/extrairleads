"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScanSearch, Zap, Loader2 } from "lucide-react";
import { qualifyPendingLeadsAction, startOutreachAction, followUpLeadsAction } from "@/app/actions";
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
    } catch (err) {
      error("Erro ao executar a análise. Verifique o console.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="rounded-xl h-12 px-6 border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white transition-all"
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
    } catch (err) {
      error("Erro ao ativar o motor. Verifique o console.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      className="rounded-xl h-12 px-8 bg-emerald-500 text-black font-bold hover:bg-emerald-400 hover:-translate-y-0.5 transition-all"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Zap className="mr-2 h-4 w-4 fill-black" />
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
    } catch (err) {
      error("Erro na rotina de follow-up. Verifique o console.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="rounded-xl h-12 px-8 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 transition-all"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Zap className="mr-2 h-4 w-4" />
      )}
      {loading ? "Retomando..." : "Retomar Contatos"}
    </Button>
  );
}