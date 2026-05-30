"use client";

import {
	Bot,
	Loader2,
	MessageSquare,
	MessageSquareText,
	Send,
	Sparkles,
	User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	generateAiSuggestionAction,
	getLeadChatAction,
	sendManualWhatsAppMessageAction,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { notify } from "@/lib/notify";

import type { ChatMessage } from "@/types/chat";

type LeadStatus =
	| "raw"
	| "qualified"
	| "in_queue"
	| "contacted"
	| "interested"
	| "human_intervention"
	| "discarded";

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
	imageUrl: string | null;
	status: LeadStatus | null;
	metadata: unknown;
	createdAt: Date | null;
	updatedAt: Date | null;
}

export default function LeadDetailsDialog({
	lead,
	children,
}: {
	lead: Lead;
	children?: React.ReactNode;
}) {
	const [history, setHistory] = useState<ChatMessage[]>([]);
	const [loading, setLoading] = useState(false);
	const [input, setInput] = useState("");
	const [sending, setSending] = useState(false);
	const [generating, setGenerating] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);

	const loadChat = async (showLoading = true) => {
		if (showLoading) setLoading(true);
		const data = await getLeadChatAction(lead.id);
		setHistory(data as ChatMessage[]);
		if (showLoading) setLoading(false);
	};

	const scrollToBottom = () => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	};

	useEffect(() => {
		scrollToBottom();
	}, [history]);

	useEffect(() => {
		let interval: any;
		if (isOpen) {
			interval = setInterval(() => {
				loadChat(false);
			}, 3000);
		}
		return () => clearInterval(interval);
	}, [isOpen, lead.id]);

	const handleSend = async () => {
		if (!input.trim()) return;
		setSending(true);

		const optimisticMsg: ChatMessage = {
			id: Date.now(),
			leadId: lead.id,
			role: "assistant",
			content: input,
			type: "text",
			createdAt: new Date(),
		};
		setHistory((prev) => [...prev, optimisticMsg]);
		const textToSend = input;
		setInput("");

		const res = await sendManualWhatsAppMessageAction(lead.id, textToSend);
		if (!res.success) {
			setHistory((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
			notify("Erro ao enviar: " + res.error, { type: "error" });
		} else {
			loadChat();
		}
		setSending(false);
	};

	const handleGenerateAI = async () => {
		setGenerating(true);
		const res = await generateAiSuggestionAction(lead.id);
		if (res.success && res.suggestion) {
			setInput(res.suggestion);
		} else {
			notify("Erro ao gerar sugestão: " + res.error, { type: "error" });
		}
		setGenerating(false);
	};

	const templates = [
		`Olá ${lead.name.split(" ")[0]}, tudo bem?`,
		`Oi! Encontrei a sua empresa online e gostaria de falar sobre uma parceria para o nicho de ${lead.niche || "vocês"}.`,
		`Olá, vi que vocês atuam em ${lead.city} e trabalho ajudando negócios locais a crescerem. Podemos falar rapidamente?`,
	];

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				setIsOpen(open);
				if (open) loadChat(true);
			}}
		>
			<DialogTrigger
				render={
					children ? (
						(children as React.ReactElement)
					) : (
						<button className="w-full text-left p-4 rounded-xl bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] hover:border-emerald-500/30 hover:bg-white/[0.04] hover:-translate-y-1 transition-all duration-300 cursor-pointer group shadow-lg shadow-black/20 hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)] relative overflow-hidden">
							<div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full blur-xl group-hover:bg-emerald-500/20 transition-colors"></div>
							<div className="flex justify-between items-start relative z-10">
								<div className="flex items-center gap-3 w-4/5">
									{lead.imageUrl && (
										// eslint-disable-next-line @next/next/no-img-element
										<img
											src={lead.imageUrl}
											alt={lead.name}
											className="w-8 h-8 rounded-full object-cover border border-emerald-500/20"
										/>
									)}
									<p className="font-bold text-sm truncate text-white/90 group-hover:text-emerald-400 transition-colors flex items-center gap-2">
										{lead.name}
									</p>
								</div>
								{lead.aiScore && (
									<span className="text-[10px] font-black text-emerald-950 bg-emerald-400/90 px-1.5 py-0.5 rounded-md shadow-[0_0_12px_rgba(52,211,153,0.4)]">
										{lead.aiScore}
									</span>
								)}
							</div>
							<p className="text-xs text-white/50 mt-1 truncate relative z-10">
								{lead.city}, {lead.state}
							</p>
							<div className="mt-4 flex items-center justify-between relative z-10">
								<span className="text-[10px] font-medium bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-white/60">
									{lead.niche || "Sem Nicho"}
								</span>
								{lead.phone && (
									<div className="flex items-center gap-2">
										<span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
											Prospectar
										</span>
										<div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/30 group-hover:scale-110 transition-all shadow-lg shadow-emerald-500/10 border border-emerald-500/20">
											<MessageSquare className="w-4 h-4 text-emerald-400" />
										</div>
									</div>
								)}
							</div>
						</button>
					)
				}
			/>

			<DialogContent className="bg-[#0b141a] border-zinc-800 text-[#e9edef] w-[98vw] h-[95vh] !max-w-7xl flex flex-col shadow-2xl p-0 overflow-hidden sm:rounded-2xl">
				{/* Header - WhatsApp Web Style */}
				<DialogHeader className="bg-[#202c33] px-4 py-3 flex flex-row items-center justify-between border-b border-zinc-800/50 shrink-0 m-0 space-y-0">
					<DialogTitle className="flex items-center gap-3 text-2xl w-full">
						<div className="w-12 h-12 bg-zinc-700 rounded-full flex items-center justify-center text-sm text-white font-bold shrink-0 overflow-hidden shadow-lg border border-zinc-600/50">
							{lead.imageUrl ? (
								// eslint-disable-next-line @next/next/no-img-element
								<img
									src={lead.imageUrl}
									alt={lead.name}
									className="w-full h-full object-cover"
								/>
							) : (
								<User className="w-6 h-6 text-zinc-400" />
							)}
						</div>
						<div className="flex flex-col items-start overflow-hidden w-full space-y-0.5">
							<p className="font-medium text-base truncate w-full text-left leading-none">
								{lead.name}
							</p>
							<p className="text-[11px] text-[#8696a0] font-normal leading-none">
								{lead.phone || "Sem telefone cadastrado"}
							</p>
						</div>
					</DialogTitle>
				</DialogHeader>

				<div className="flex flex-1 overflow-hidden relative">
					{/* Background pattern similar to WhatsApp */}
					<div className="absolute inset-0 opacity-[0.05] bg-[url('https://static.whatsapp.net/rsrc.php/v3/yl/r/r-3A-64J.png')] bg-repeat z-0 pointer-events-none"></div>

					{/* Left Panel: Info (Desktop Only) */}
					<div className="hidden lg:flex w-1/3 flex-col bg-[#111b21] border-r border-zinc-800/50 z-10 p-5 overflow-y-auto">
						<h3 className="text-[#00a884] text-xs font-bold mb-4 uppercase tracking-widest flex items-center gap-2">
							<Bot className="w-4 h-4" /> Inteligência Artificial
						</h3>
						<div className="bg-[#202c33] p-4 rounded-xl border border-zinc-800/50 shadow-inner mb-6">
							<div className="flex items-center justify-between mb-3">
								<p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
									Score de Qualificação
								</p>
								<span className="text-[10px] font-black text-emerald-950 bg-emerald-400 px-2 py-0.5 rounded-md">
									{lead.aiScore || "?"}/100
								</span>
							</div>
							<p className="text-xs text-zinc-300 leading-relaxed italic border-l-2 border-[#00a884] pl-3">
								&ldquo;{lead.aiAnalysis || "Aguardando análise..."}&rdquo;
							</p>
						</div>

						<h3 className="text-zinc-500 text-[10px] font-bold mb-3 uppercase tracking-widest">
							Dados do Lead
						</h3>
						<div className="space-y-3 text-xs">
							<div>
								<p className="text-zinc-500 text-[10px] uppercase">
									Localização
								</p>
								<p className="text-zinc-200 mt-0.5">
									{lead.city}, {lead.state}
								</p>
							</div>
							<div>
								<p className="text-zinc-500 text-[10px] uppercase">
									Nicho de Mercado
								</p>
								<p className="text-zinc-200 bg-zinc-800/50 inline-block px-2 py-1 rounded mt-1">
									{lead.niche || "Não informado"}
								</p>
							</div>
							{lead.website && (
								<div>
									<p className="text-zinc-500 text-[10px] uppercase">Site</p>
									<a
										href={
											lead.website.startsWith("http")
												? lead.website
												: `https://${lead.website}`
										}
										target="_blank"
										rel="noreferrer"
										className="text-blue-400 hover:underline break-all mt-0.5 block"
									>
										{lead.website}
									</a>
								</div>
							)}
						</div>
					</div>

					{/* Right Panel: Chat */}
					<div className="flex-1 flex flex-col z-10 relative bg-transparent">
						<div
							ref={scrollRef}
							className="flex-1 overflow-y-auto p-4 space-y-4"
							style={{ scrollBehavior: "smooth" }}
						>
							{/* Mobile Info Banner */}
							<div className="lg:hidden bg-[#202c33]/90 backdrop-blur p-3 rounded-lg border border-zinc-800 text-[11px] text-zinc-300 mb-4 shadow-lg text-center mx-auto max-w-sm">
								<span className="font-bold text-[#00a884]">
									Análise IA ({lead.aiScore}):{" "}
								</span>
								{lead.aiAnalysis}
							</div>

							{loading ? (
								<div className="flex items-center justify-center h-full">
									<div className="bg-[#202c33] px-4 py-2 rounded-full text-xs text-zinc-400 flex items-center gap-2 shadow-lg">
										<Loader2 className="w-3 h-3 animate-spin" /> Sincronizando
										mensagens...
									</div>
								</div>
							) : history.length === 0 ? (
								<div className="flex items-center justify-center h-full">
									<p className="bg-[#202c33] px-4 py-2 rounded-full text-[11px] font-medium text-zinc-400 shadow-lg">
										Nenhuma mensagem trocada. Inicie a prospecção!
									</p>
								</div>
							) : (
								history.map((msg, i) => (
									<div
										key={i}
										className={`flex ${msg.role === "assistant" ? "justify-end" : "justify-start"}`}
									>
										<div
											className={`max-w-[85%] sm:max-w-[70%] p-2 px-3 rounded-xl text-[13px] shadow-sm relative ${
												msg.role === "assistant"
													? "bg-[#005c4b] text-[#e9edef] rounded-tr-none"
													: "bg-[#202c33] text-[#e9edef] rounded-tl-none"
											}`}
										>
											<p className="leading-relaxed whitespace-pre-wrap break-words">
												{msg.content}
											</p>
											<div className="flex items-center justify-end gap-1 mt-1">
												<p className="text-[9px] text-white/50 font-medium">
													{msg.createdAt
														? new Date(msg.createdAt).toLocaleTimeString([], {
																hour: "2-digit",
																minute: "2-digit",
															})
														: ""}
												</p>
											</div>
										</div>
									</div>
								))
							)}
						</div>

						{/* Input Area */}
						<div className="bg-[#202c33] px-4 py-3 flex items-end gap-2 border-t border-zinc-800/50">
							<DropdownMenu>
								<DropdownMenuTrigger
									disabled={sending}
									className="inline-flex items-center justify-center whitespace-nowrap w-10 h-10 rounded-full text-zinc-400 hover:text-[#00a884] hover:bg-[#00a884]/10 shrink-0 transition-colors disabled:pointer-events-none disabled:opacity-50 outline-none"
									title="Usar um template rápido"
								>
									<MessageSquareText className="w-5 h-5" />
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align="start"
									className="w-80 bg-[#202c33] border-zinc-800 text-zinc-200 shadow-2xl p-0"
								>
									<div className="px-4 py-3 text-xs font-bold text-zinc-400 uppercase tracking-widest bg-[#111b21] rounded-t-lg">
										Templates de Prospecção
									</div>
									{templates.map((t, idx) => (
										<DropdownMenuItem
											key={idx}
											className="text-[13px] hover:bg-zinc-800 focus:bg-zinc-700 cursor-pointer px-4 py-3 border-t border-zinc-800/50 whitespace-normal leading-relaxed"
											onClick={() => setInput(t)}
										>
											{t}
										</DropdownMenuItem>
									))}
								</DropdownMenuContent>
							</DropdownMenu>

							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={handleGenerateAI}
								disabled={generating || sending}
								className="w-10 h-10 rounded-full text-zinc-400 hover:text-[#00a884] hover:bg-[#00a884]/10 shrink-0 transition-colors"
								title="Sugerir mensagem com Inteligência Artificial"
							>
								{generating ? (
									<Loader2 className="w-5 h-5 animate-spin" />
								) : (
									<Sparkles className="w-5 h-5" />
								)}
							</Button>

							<div className="flex-1 bg-[#2a3942] rounded-xl overflow-hidden min-h-[60px] flex items-start border border-transparent focus-within:border-[#00a884]/50 transition-colors shadow-inner">
								<textarea
									value={input}
									onChange={(e) => setInput(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter" && !e.shiftKey) {
											e.preventDefault();
											handleSend();
										}
									}}
									placeholder="Digite uma mensagem ou escolha um template ao lado..."
									className="w-full bg-transparent text-[#e9edef] text-sm px-4 py-3 max-h-48 focus:outline-none resize-none min-h-[60px]"
									rows={
										input.split("\n").length > 1
											? Math.min(input.split("\n").length, 8)
											: 2
									}
								/>
							</div>

							<Button
								type="button"
								onClick={handleSend}
								disabled={!input.trim() || sending}
								className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#029072] text-white shrink-0 flex items-center justify-center transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 p-0"
							>
								{sending ? (
									<Loader2 className="w-5 h-5 animate-spin" />
								) : (
									<Send className="w-[18px] h-[18px] ml-0.5" />
								)}
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
