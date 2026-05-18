import { getAiConfig, saveAiConfigAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bot, MessageSquare, ShieldCheck, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/FadeIn";
import { PromptTemplates } from "./PromptTemplates";

export default async function ConfigPage() {
  const config = await getAiConfig();

  return (
    <main className="min-h-screen bg-transparent text-white p-4 md:p-8">
      {/* Background Glow */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-900/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-blue-900/10 blur-[120px]" />
      </div>

      <div className="max-w-[1400px] mx-auto space-y-8 pt-4">
        <FadeIn delay={0.1}>
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="hover:bg-zinc-800 text-zinc-400 hover:text-white">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-black tracking-tight">Arquitetura de Agentes</h1>
                <p className="text-sm text-zinc-500 font-medium">Refine o comportamento neural do seu motor de prospecção.</p>
              </div>
            </div>
          </header>
        </FadeIn>

        <form action={saveAiConfigAction}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Coluna Principal: Configurações */}
            <div className="lg:col-span-8 space-y-6">
              <StaggerContainer className="space-y-6">
                {/* Agente 1 - Analista */}
                <StaggerItem>
                  <Card className="border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="relative">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                          <Bot className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold">Agente 1: Analista de Qualificação</CardTitle>
                          <CardDescription className="text-xs">Critérios para o Llama 3.3 decidir quem é um lead quente.</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="relative">
                      <Textarea 
                        name="agent1Prompt"
                        defaultValue={config.agent1Prompt || ""}
                        rows={8}
                        className="bg-black/40 border-white/[0.08] focus:border-emerald-500/50 focus:ring-emerald-500/20 text-emerald-50/90 font-mono text-[13px] leading-relaxed transition-all placeholder:text-zinc-700"
                        placeholder="Digite as instruções do agente..."
                      />
                    </CardContent>
                  </Card>
                </StaggerItem>

                {/* Agente 2 - SDR */}
                <StaggerItem>
                  <Card className="border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="relative">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                          <MessageSquare className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold">Agente 2: Redator de Abordagem (SDR)</CardTitle>
                          <CardDescription className="text-xs">Instruções de escrita para converter o lead via WhatsApp.</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="relative">
                      <Textarea 
                        name="agent2Prompt"
                        defaultValue={config.agent2Prompt || ""}
                        rows={8}
                        className="bg-black/40 border-white/[0.08] focus:border-emerald-500/50 focus:ring-emerald-500/20 text-emerald-50/90 font-mono text-[13px] leading-relaxed transition-all placeholder:text-zinc-700"
                        placeholder="Digite as instruções de abordagem..."
                      />
                    </CardContent>
                  </Card>
                </StaggerItem>

                {/* Limites e Segurança */}
                <StaggerItem>
                  <Card className="border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                          <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold">Protocolos de Segurança</CardTitle>
                          <CardDescription className="text-xs">Cadência e automação para proteção da conta.</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <div>
                          <label className="text-sm font-bold text-zinc-300">Limite de Disparos Semanais</label>
                          <p className="text-[11px] text-zinc-500 mt-0.5">Volume máximo de prospecção por agente.</p>
                        </div>
                        <Input 
                          type="number" 
                          name="weeklyLimit"
                          defaultValue={config.weeklyLimit || 50}
                          className="w-24 h-11 bg-black/40 border-white/[0.08] focus:border-emerald-500/50 text-center font-black text-emerald-400"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <div>
                          <label className="text-sm font-bold text-zinc-300 block">Ativação Autônoma</label>
                          <p className="text-[11px] text-zinc-500 mt-0.5">Disparar mensagem imediatamente após qualificação positiva.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            name="autoOutreach"
                            defaultChecked={config.autoOutreach === "true"}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              </StaggerContainer>
            </div>

            {/* Coluna Lateral: Templates e Auxiliares */}
            <div className="lg:col-span-4 space-y-6">
              <FadeIn delay={0.3}>
                <PromptTemplates />
              </FadeIn>
              
              <FadeIn delay={0.4}>
                <Card className="border-emerald-500/20 bg-emerald-500/5 backdrop-blur-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                      <Save className="w-4 h-4" /> Dica de Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[11px] text-emerald-100/60 leading-relaxed">
                      Lembre-se de salvar suas alterações após copiar um template. O sistema utiliza 
                      <strong> Llama 3.3 70B</strong> para processar essas instruções em tempo real. 
                      Seja específico sobre a "dor" que sua solução resolve.
                    </p>
                  </CardContent>
                </Card>
              </FadeIn>
            </div>
          </div>

          <FadeIn delay={0.5}>
            <div className="flex justify-end pt-10 pb-20">
              <Button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-black px-12 py-7 text-xl font-black shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all hover:scale-105 active:scale-95 group">
                <Save className="mr-3 w-6 h-6 group-hover:rotate-12 transition-transform" />
                Salvar Arquitetura Neural
              </Button>
            </div>
          </FadeIn>
        </form>
      </div>
    </main>
  );
}

