import {
	ArrowLeft,
	BookOpen,
	Bot,
	Cpu,
	MessageSquare,
	Save,
	ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/FadeIn";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getAiConfig, saveAiConfigAction } from "./actions";
import KnowledgeBaseTab from "./KnowledgeBaseTab";
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
								<Button
									variant="ghost"
									size="icon"
									className="hover:bg-zinc-800 text-zinc-400 hover:text-white"
								>
									<ArrowLeft className="w-5 h-5" />
								</Button>
							</Link>
							<div>
								<h1 className="text-3xl font-black tracking-tight">
									Arquitetura de Agentes
								</h1>
								<p className="text-sm text-zinc-500 font-medium">
									Refine o comportamento neural do seu motor de prospecção.
								</p>
							</div>
						</div>
					</header>
				</FadeIn>

				<Tabs defaultValue="architecture" className="flex flex-col space-y-6">
					<TabsList className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-1 inline-flex self-start">
						<TabsTrigger
							value="architecture"
							className="rounded-lg data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 text-zinc-400 font-bold flex items-center gap-2 px-4 py-2"
						>
							<Cpu className="w-4 h-4" />
							Arquitetura Neural
						</TabsTrigger>
						<TabsTrigger
							value="rag"
							className="rounded-lg data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 text-zinc-400 font-bold flex items-center gap-2 px-4 py-2"
						>
							<BookOpen className="w-4 h-4" />
							Base de Conhecimento (RAG)
						</TabsTrigger>
					</TabsList>

					<TabsContent value="architecture">
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
															<CardTitle className="text-lg font-bold">
																Agente 1: Analista de Qualificação
															</CardTitle>
															<CardDescription className="text-xs">
																Critérios para o Llama 3.3 decidir quem é um
																lead quente.
															</CardDescription>
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
															<CardTitle className="text-lg font-bold">
																Agente 2: Redator de Abordagem (SDR)
															</CardTitle>
															<CardDescription className="text-xs">
																Defina a persona do seu SDR, seu produto e o
																contorno de objeções do seu nicho. As regras de
																WhatsApp (mensagens curtas e segurança) são
																injetadas automaticamente.
															</CardDescription>
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
															<CardTitle className="text-lg font-bold">
																Protocolos de Segurança
															</CardTitle>
															<CardDescription className="text-xs">
																Cadência e automação para proteção da conta.
															</CardDescription>
														</div>
													</div>
												</CardHeader>
												<CardContent className="space-y-5">
													<div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
														<div>
															<label
																htmlFor="weeklyLimit"
																className="text-sm font-bold text-zinc-300"
															>
																Limite de Disparos Semanais
															</label>
															<p className="text-[11px] text-zinc-500 mt-0.5">
																Volume máximo de prospecção por agente.
															</p>
														</div>
														<Input
															type="number"
															name="weeklyLimit"
															id="weeklyLimit"
															defaultValue={config.weeklyLimit || 50}
															className="w-24 h-11 bg-black/40 border-white/[0.08] focus:border-emerald-500/50 text-center font-black text-emerald-400"
														/>
													</div>

													<div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
														<div>
															<label
																htmlFor="autoOutreach"
																className="text-sm font-bold text-zinc-300 block"
															>
																Ativação Autônoma
															</label>
															<p className="text-[11px] text-zinc-500 mt-0.5">
																Disparar mensagem imediatamente após
																qualificação positiva.
															</p>
														</div>
														<label
															className="relative inline-flex items-center cursor-pointer"
															htmlFor="autoOutreach"
														>
															<input
																type="checkbox"
																id="autoOutreach"
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
													Lembre-se de salvar suas alterações após copiar um
													template. O sistema utiliza
													<strong> Llama 3.3 70B</strong> para processar essas
													instruções em tempo real. Seja específico sobre a
													"dor" que sua solução resolve.
												</p>
											</CardContent>
										</Card>
									</FadeIn>
								</div>
							</div>

							<FadeIn delay={0.5}>
								<div className="flex justify-end pt-10 pb-20">
									<Button
										type="submit"
										className="bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/25 backdrop-blur-md hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(16,185,129,0.25)] active:translate-y-0 active:scale-98 transition-all duration-300 cursor-pointer px-12 py-7 text-xl font-black group"
									>
										<Save className="mr-3 w-6 h-6 group-hover:rotate-12 transition-transform" />
										Salvar Arquitetura Neural
									</Button>
								</div>
							</FadeIn>
						</form>
					</TabsContent>

					<TabsContent value="rag">
						<KnowledgeBaseTab />
					</TabsContent>
				</Tabs>
			</div>
		</main>
	);
}
