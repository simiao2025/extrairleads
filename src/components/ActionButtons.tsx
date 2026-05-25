"use client";

import { Loader2, Play, RefreshCw, ScanSearch } from "lucide-react";
import { useState } from "react";
import { followUpLeadsAction, qualifyPendingLeadsAction, startOutreachAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function AnalyzeButton({
  campaignId,
  rawLeadsCount = 0,
}: {
  campaignId?: number;
  rawLeadsCount?: number;
}) {
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await qualifyPendingLeadsAction(campaignId);
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
    <div className="relative w-full sm:w-auto group">
      <Button
        variant="outline"
        className={`w-full sm:w-auto rounded-xl h-12 px-6 backdrop-blur-md transition-all duration-300 ${rawLeadsCount === 0 ? "opacity-50 cursor-not-allowed bg-white/[0.01] border-white/5 text-zinc-600" : "bg-white/[0.02] border-white/10 text-zinc-400 hover:bg-white/5 hover:border-white/20 hover:text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] active:scale-98 cursor-pointer"}`}
        onClick={handleClick}
        disabled={rawLeadsCount === 0 || loading}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ScanSearch className="mr-2 h-4 w-4" />
        )}
        {loading ? "Analisando..." : "Análise de Raspagem"}
      </Button>
      {rawLeadsCount > 0 && (
        <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-in zoom-in duration-300">
          {rawLeadsCount}
        </span>
      )}
    </div>
  );
}

export function OutreachButton({
  campaignId,
  isAutoOutreach = false,
  isWhatsappConnected = true,
}: {
  campaignId?: number;
  isAutoOutreach?: boolean;
  isWhatsappConnected?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await startOutreachAction(campaignId);
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
      className={`relative overflow-hidden w-full sm:w-auto rounded-xl h-12 px-8 font-bold backdrop-blur-md transition-all duration-300 group ${!campaignId || isAutoOutreach || !isWhatsappConnected ? "opacity-50 cursor-not-allowed bg-emerald-900/10 border border-emerald-900/20 text-emerald-900/50" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40 hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] active:translate-y-0 active:scale-98 cursor-pointer"}`}
      onClick={handleClick}
      disabled={!campaignId || isAutoOutreach || !isWhatsappConnected || loading}
    >
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-150%) skewX(-15deg); }
          50% { transform: translateX(-150%) skewX(-15deg); }
          60% { transform: translateX(150%) skewX(-15deg); }
          100% { transform: translateX(150%) skewX(-15deg); }
        }
      `}</style>
      {/* 4. Brilho Metálico (Shimmer) */}
      {!(!campaignId || isAutoOutreach || !isWhatsappConnected) && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="w-12 h-full bg-gradient-to-r from-transparent via-emerald-300/30 to-transparent shadow-[0_0_15px_rgba(110,231,183,0.5)]" style={{ animation: 'shimmer 5s infinite' }} />
        </div>
      )}

      <span className="relative z-10 flex items-center">
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Play className="mr-2 h-4 w-4 fill-current" />
        )}
        {loading
          ? "Processando..."
          : isAutoOutreach
            ? "Motor Automático"
            : !isWhatsappConnected
              ? "WhatsApp Offline"
              : "Ligar Motor IA"}
      </span>
    </Button>
  );
}

export function FollowUpButton({
  campaignId,
  hasContactedLeads = true,
  isWhatsappConnected = true,
}: {
  campaignId?: number;
  hasContactedLeads?: boolean;
  isWhatsappConnected?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await followUpLeadsAction(campaignId);
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
      className={`w-full sm:w-auto rounded-xl h-12 px-8 backdrop-blur-sm transition-all duration-300 ${!campaignId || !hasContactedLeads || !isWhatsappConnected ? "opacity-50 cursor-not-allowed bg-orange-900/5 border-orange-900/10 text-orange-900/50" : "bg-orange-500/5 border border-orange-500/20 text-orange-400 hover:bg-orange-500/15 hover:border-orange-500/45 hover:text-orange-300 hover:shadow-[0_0_20px_rgba(249,115,22,0.15)] hover:-translate-y-0.5 active:translate-y-0 active:scale-98 cursor-pointer"}`}
      onClick={handleClick}
      disabled={!campaignId || !hasContactedLeads || !isWhatsappConnected || loading}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="mr-2 h-4 w-4" />
      )}
      {loading ? "Retomando..." : !isWhatsappConnected ? "WhatsApp Offline" : "Retomar Contatos"}
    </Button>
  );
}
