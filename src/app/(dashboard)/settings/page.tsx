import { Settings, CheckCircle2, XCircle, Server, Lock, Cpu } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SettingsPage() {
  const envStatus = {
    database: !!process.env.DATABASE_URL,
    serpapi: !!process.env.SERPAPI_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    groq: !!process.env.GROQ_API_KEY,
    evolution: !!process.env.EVOLUTION_API_KEY,
  };

  const integrations = [
    { name: "Banco de Dados Neon", key: envStatus.database, icon: Server, desc: "Armazenamento na nuvem" },
    { name: "Google Maps (SerpApi)", key: envStatus.serpapi, icon: Lock, desc: "Motor de extração de leads" },
    { name: "Llama 3.3 (Groq)", key: envStatus.groq, icon: Cpu, desc: "Agente de análise textual ultra-rápido" },
    { name: "OpenAI (Voz TTS)", key: envStatus.openai, icon: Cpu, desc: "Motor de conversão de texto em áudio" },
    { name: "Evolution API (WhatsApp)", key: envStatus.evolution, icon: Server, desc: "Gateway de disparo e webhooks" },
  ];

  return (
    <main className="min-h-screen bg-[#09090b] text-white p-4 md:p-8 pt-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-500" />
            Configurações do Sistema
          </h1>
          <p className="text-zinc-400 mt-2">Visão geral da integridade do ecossistema e credenciais.</p>
        </div>

        <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Status das Integrações (Variáveis de Ambiente)</CardTitle>
            <CardDescription>O sistema detecta automaticamente quais chaves estão configuradas no .env.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {integrations.map((integration, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${integration.key ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                    <integration.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold">{integration.name}</p>
                    <p className="text-xs text-zinc-500">{integration.desc}</p>
                  </div>
                </div>
                {integration.key ? (
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm bg-emerald-400/10 px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-4 h-4" /> Ativo
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-400 font-bold text-sm bg-red-400/10 px-3 py-1 rounded-full">
                    <XCircle className="w-4 h-4" /> Ausente
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="text-center pt-8">
          <p className="text-sm text-zinc-500">Para alterar credenciais, edite o arquivo <code className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">.env</code> na raiz do projeto e reinicie o servidor.</p>
        </div>
      </div>
    </main>
  );
}
