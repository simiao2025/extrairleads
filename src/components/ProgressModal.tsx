import { useEffect, useState } from "react";
import { Loader2, Search, BrainCircuit, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressModalProps {
  jobId: number | null;
  onClose: () => void;
}

export function ProgressModal({ jobId, onClose }: ProgressModalProps) {
  const [status, setStatus] = useState<"scraping" | "qualifying" | "completed" | "failed">("scraping");
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(20);

  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/progress?jobId=${jobId}`);
        if (!res.ok) throw new Error("Falha ao buscar progresso");
        const data = await res.json();
        
        setStatus(data.status);
        setProgress(data.currentProgress);
        setTotal(data.totalExpected);

        if (data.status === "completed" || data.status === "failed") {
          clearInterval(interval);
          if (data.status === "completed") {
            setTimeout(() => {
              onClose();
              window.location.reload();
            }, 2000);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [jobId, onClose]);

  if (!jobId) return null;

  const scrapePercent = status === "scraping" ? Math.min(100, Math.round((progress / total) * 100)) : 100;
  const qualifyPercent = status === "completed" ? 100 : (status === "qualifying" ? 50 : 0); // Simplified qualification progress

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
        
        {/* Background glow */}
        <div className={cn(
          "absolute -top-20 -left-20 w-64 h-64 rounded-full blur-[100px] pointer-events-none transition-colors duration-1000",
          status === "scraping" ? "bg-blue-500/20" : status === "qualifying" ? "bg-emerald-500/20" : "bg-zinc-500/20"
        )} />

        <div className="relative z-10 flex flex-col items-center text-center">
          
          {/* Animated Icon */}
          <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
            {status === "scraping" && (
              <>
                <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-[spin_3s_linear_infinite]" />
                <div className="absolute inset-2 border-4 border-t-blue-400 border-l-blue-400 border-transparent rounded-full animate-spin" />
                <Search className="w-10 h-10 text-blue-400 animate-pulse" />
              </>
            )}
            {status === "qualifying" && (
              <>
                <div className="absolute inset-0 border-4 border-emerald-500/30 rounded-full animate-[spin_4s_linear_infinite_reverse]" />
                <div className="absolute inset-2 border-4 border-t-emerald-400 border-r-emerald-400 border-transparent rounded-full animate-spin" />
                <BrainCircuit className="w-10 h-10 text-emerald-400 animate-pulse" />
              </>
            )}
            {status === "completed" && (
              <div className="bg-emerald-500/20 p-4 rounded-full">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </div>
            )}
            {status === "failed" && (
              <div className="bg-red-500/20 p-4 rounded-full">
                <AlertCircle className="w-12 h-12 text-red-400" />
              </div>
            )}
          </div>

          {/* Titles */}
          <h3 className="text-xl font-bold text-white mb-2">
            {status === "scraping" && "Raspando Dados da Web..."}
            {status === "qualifying" && "IA Qualificando Leads..."}
            {status === "completed" && "Análise Concluída!"}
            {status === "failed" && "Erro no Processamento"}
          </h3>
          <p className="text-sm text-zinc-400 mb-8 max-w-[280px]">
            {status === "scraping" && `Coletando contatos. Progresso: ${progress} de ${total} páginas mapeadas.`}
            {status === "qualifying" && "Processando perfis no motor neural para identificar tomadores de decisão."}
            {status === "completed" && "Os leads validados já estão no seu pipeline."}
          </p>

          {/* Progress Bars */}
          <div className="w-full space-y-5">
            {/* Scraping Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                <span className={status === "scraping" ? "text-blue-400" : "text-zinc-500"}>1. Raspagem</span>
                <span className="text-zinc-400">{scrapePercent}%</span>
              </div>
              <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-700 ease-out"
                  style={{ width: `${scrapePercent}%` }}
                />
              </div>
            </div>

            {/* Qualifying Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                <span className={status === "qualifying" ? "text-emerald-400" : "text-zinc-500"}>2. Qualificação IA</span>
                <span className="text-zinc-400">{qualifyPercent}%</span>
              </div>
              <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-1000 ease-out",
                    status === "qualifying" ? "bg-gradient-to-r from-emerald-600 to-emerald-400 animate-pulse" : "bg-emerald-500"
                  )}
                  style={{ width: `${qualifyPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Close / Retry Button */}
          {(status === "completed" || status === "failed") && (
            <button
              onClick={onClose}
              className="mt-8 px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors font-medium text-sm"
            >
              Fechar Janela
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
