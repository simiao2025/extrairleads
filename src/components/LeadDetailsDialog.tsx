"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getLeadChatAction } from "@/app/actions";
import { MessageSquare, User, Bot, Volume2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

import { ChatMessage } from "@/types/chat";

type LeadStatus = "raw" | "qualified" | "in_queue" | "contacted" | "interested" | "human_intervention" | "discarded";

interface Lead {
  id: number;
  name: string;
  phone: string | null;
  website: string | null;
  niche: string | null;
  city: string | null;
  state: string | null;
  aiScore: number | null;
  aiAnalysis: string | null;
  status: LeadStatus | null;
  metadata: unknown;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export default function LeadDetailsDialog({ lead }: { lead: Lead }) {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const loadChat = async () => {
    setLoading(true);
    const data = await getLeadChatAction(lead.id);
    setHistory(data as ChatMessage[]);
    setLoading(false);
  };

  return (
    <Dialog onOpenChange={(open) => open && loadChat()}>
      <DialogTrigger>
        <button className="w-full text-left p-4 rounded-xl bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] hover:border-emerald-500/30 hover:bg-white/[0.04] transition-all cursor-pointer group shadow-lg shadow-black/20 hover:shadow-emerald-500/10">
          <div className="flex justify-between items-start">
            <p className="font-bold text-sm truncate w-4/5 text-white/90 group-hover:text-emerald-400 transition-colors">{lead.name}</p>
            {lead.aiScore && (
              <span className="text-[10px] font-black text-emerald-950 bg-emerald-400/90 px-1.5 py-0.5 rounded-md shadow-[0_0_12px_rgba(52,211,153,0.4)]">
                {lead.aiScore}
              </span>
            )}
          </div>
          <p className="text-xs text-white/50 mt-1 truncate">{lead.city}, {lead.state}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[10px] font-medium bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-white/60">{lead.niche || "Sem Nicho"}</span>
            <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
              <MessageSquare className="w-3 h-3 text-white/40 group-hover:text-emerald-400 transition-colors" />
            </div>
          </div>
        </button>
      </DialogTrigger>
      
      <DialogContent className="bg-zinc-950/90 backdrop-blur-2xl border-zinc-800 text-white max-w-2xl h-[80vh] flex flex-col shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-green-400 rounded-full flex items-center justify-center text-sm text-black font-black shadow-lg shadow-emerald-500/20">
              {lead.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-black tracking-tight">{lead.name}</p>
              <p className="text-xs text-emerald-500 font-bold">{lead.phone || "Sem telefone"}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50 shadow-inner">
            <p className="text-[10px] font-black uppercase text-emerald-500 mb-2 tracking-widest">Análise da IA</p>
            <p className="text-sm text-zinc-300 leading-relaxed italic">&ldquo;{lead.aiAnalysis || "Aguardando análise..."}&rdquo;</p>
          </div>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {loading ? (
                <p className="text-center text-zinc-500 text-sm py-8 font-medium animate-pulse">Sincronizando neural net...</p>
              ) : history.length === 0 ? (
                <p className="text-center text-zinc-500 text-sm py-8">Nenhuma mensagem trocada ainda.</p>
              ) : (
                history.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm shadow-lg ${
                      msg.role === "assistant"
                        ? "bg-zinc-800 text-zinc-200 rounded-tl-none border border-zinc-700/50"
                        : "bg-emerald-600 text-white rounded-tr-none shadow-emerald-900/20"
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {msg.role === "assistant" ? <Bot className="w-3.5 h-3.5 text-emerald-400" /> : <User className="w-3.5 h-3.5 text-emerald-100" />}
                        <span className="text-[10px] opacity-70 uppercase font-black tracking-wider">
                          {msg.role === "assistant" ? "Agente IA" : "Lead"}
                        </span>
                        {msg.type === "audio" && <Volume2 className="w-3 h-3 text-emerald-400 ml-auto" />}
                      </div>
                      <p className="leading-relaxed">{msg.content}</p>
                      <p className="text-[9px] opacity-50 mt-2 text-right font-medium">
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
