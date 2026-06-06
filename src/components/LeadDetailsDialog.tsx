"use client";

import {
	Bot,
	CheckCheck,
	HandMetal,
	Loader2,
	MessageSquare,
	MessageSquareText,
	Mic,
	Send,
	Sparkles,
	Square,
	Trash2,
	User,
	Volume2,
	VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import {
	generateAiSuggestionAction,
	getLeadChatAction,
	moveLeadAction,
	sendManualWhatsAppMessageAction,
	sendWhatsAppAudioAction,
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
import { notify, playMessageSound } from "@/lib/notify";

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
	const [isOpen, setIsOpen] = useState(false);
	// Status local do lead para refletir o toggle sem precisar recarregar a página
	const [leadStatus, setLeadStatus] = useState<LeadStatus | null>(lead.status);
	const [togglingStatus, setTogglingStatus] = useState(false);

	const isIntervention = leadStatus === "human_intervention";

	const {
		data: swrHistory,
		mutate: mutateHistory,
		isLoading,
	} = useSWR<ChatMessage[]>(
		isOpen ? `chat-${lead.id}` : null,
		() => getLeadChatAction(lead.id) as Promise<ChatMessage[]>,
		{ refreshInterval: 3000 },
	);

	const history = (swrHistory || []) as ChatMessage[];
	const loading = isLoading && history.length === 0;

	// Sync local status when prop changes (e.g. parent refreshes)
	useEffect(() => {
		setLeadStatus(lead.status);
	}, [lead.status]);

	const [input, setInput] = useState("");
	const [sending, setSending] = useState(false);
	const [generating, setGenerating] = useState(false);

	const [isRecording, setIsRecording] = useState(false);
	const [recordingTime, setRecordingTime] = useState(0);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const audioChunksRef = useRef<Blob[]>([]);
	const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

	const scrollRef = useRef<HTMLDivElement>(null);
	// Rastreia contagem anterior para detectar mensagens novas
	const prevHistoryLengthRef = useRef<number>(-1);

	const scrollToBottom = () => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	};

	// Rola para o fim e toca som ao chegar nova mensagem do lead
	useEffect(() => {
		if (!history || history.length === 0) return;

		const prev = prevHistoryLengthRef.current;
		if (prev >= 0 && history.length > prev) {
			const lastMsg = history[history.length - 1];
			if (lastMsg.role === "user") {
				playMessageSound();
			}
		}
		prevHistoryLengthRef.current = history.length;
		scrollToBottom();
	}, [history]);

	const handleToggleIntervention = async () => {
		setTogglingStatus(true);
		const nextStatus: LeadStatus = isIntervention ? "contacted" : "human_intervention";
		const res = await moveLeadAction(lead.id, nextStatus);
		if (res.success) {
			setLeadStatus(nextStatus);
			notify(
				isIntervention
					? "IA SDR reativada! Ela voltará a responder automaticamente."
					: "IA SDR silenciada! Você assumiu o controle desta conversa.",
				{ type: isIntervention ? "success" : "warning" },
			);
		} else {
			notify("Erro ao alternar modo: " + res.error, { type: "error" });
		}
		setTogglingStatus(false);
	};

	const handleSend = async () => {
		if (!input.trim()) return;
		setSending(true);

		const optimisticMsg: ChatMessage = {
			id: Date.now(),
			leadId: lead.id,
			role: "assistant",
			content: input,
			audioBase64: null,
			type: "text",
			createdAt: new Date(),
		};
		mutateHistory(
			(prev) => [...((prev as ChatMessage[]) || []), optimisticMsg],
			false,
		);
		const textToSend = input;
		setInput("");

		const res = await sendManualWhatsAppMessageAction(lead.id, textToSend);
		if (!res.success) {
			mutateHistory(); // Revert
			notify("Erro ao enviar: " + res.error, { type: "error" });
		} else {
			mutateHistory();
		}
		setSending(false);
	};

	const startRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			const mediaRecorder = new MediaRecorder(stream);
			mediaRecorderRef.current = mediaRecorder;
			audioChunksRef.current = [];

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					audioChunksRef.current.push(event.data);
				}
			};

			mediaRecorder.onstop = async () => {
				const audioBlob = new Blob(audioChunksRef.current, {
					type: "audio/ogg",
				});

				// Ler como base64
				const reader = new FileReader();
				reader.readAsDataURL(audioBlob);
				reader.onloadend = async () => {
					const base64data = reader.result as string;
					const base64String = base64data.split(",")[1]; // remove o prefixo data:...

					setSending(true);

					// Optimistic update
					const optimisticMsg: ChatMessage = {
						id: Date.now(),
						leadId: lead.id,
						role: "assistant",
						content: "[Áudio Enviado]",
						audioBase64: base64String,
						type: "audio",
						createdAt: new Date(),
					};
					mutateHistory(
						(prev) => [...((prev as ChatMessage[]) || []), optimisticMsg],
						false,
					);

					const res = await sendWhatsAppAudioAction(lead.id, base64String);
					if (!res.success) {
						mutateHistory();
						notify(`Erro ao enviar áudio: ${res.error}`, { type: "error" });
					} else {
						mutateHistory();
					}
					setSending(false);
				};

				// Limpar as faixas de áudio para liberar o microfone
				stream.getTracks().forEach((track) => track.stop());
			};

			mediaRecorder.start();
			setIsRecording(true);
			setRecordingTime(0);

			timerIntervalRef.current = setInterval(() => {
				setRecordingTime((prev) => prev + 1);
			}, 1000);
		} catch (err) {
			console.error("Erro ao acessar microfone", err);
			notify("Permissão de microfone negada ou não disponível.", {
				type: "error",
			});
		}
	};

	const stopRecording = () => {
		if (mediaRecorderRef.current && isRecording) {
			mediaRecorderRef.current.stop();
			setIsRecording(false);
			if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
		}
	};

	const cancelRecording = () => {
		if (mediaRecorderRef.current && isRecording) {
			// Cancela o envio: reatribui onstop para não fazer nada
			mediaRecorderRef.current.onstop = () => {
				mediaRecorderRef.current?.stream
					.getTracks()
					.forEach((track) => track.stop());
			};
			mediaRecorderRef.current.stop();
			setIsRecording(false);
			if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
			setRecordingTime(0);
		}
	};

	const formatTime = (seconds: number) => {
		const m = Math.floor(seconds / 60)
			.toString()
			.padStart(2, "0");
		const s = (seconds % 60).toString().padStart(2, "0");
		return `${m}:${s}`;
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
			}}
		>
			<DialogTrigger
				render={
					children ? (
						(children as React.ReactElement)
					) : (
						<button type="button" className="w-full text-left p-4 rounded-2xl bg-[#09090b] border border-white/[0.08] hover:border-emerald-500/40 hover:bg-[#101014] hover:-translate-y-1 transition-all duration-500 cursor-pointer group shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(16,185,129,0.2)] relative overflow-hidden">
							<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
							<div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700 translate-x-1/2 -translate-y-1/2"></div>
							
							<div className="flex justify-between items-start relative z-10 gap-3">
								<div className="flex gap-3 flex-1 min-w-0">
									{lead.imageUrl ? (
										// eslint-disable-next-line @next/next/no-img-element
										<img
											src={lead.imageUrl}
											alt={lead.name}
											className="w-10 h-10 rounded-full object-cover border border-white/10 group-hover:border-emerald-500/30 transition-colors shrink-0"
										/>
									) : (
										<div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
											<span className="text-emerald-500 font-bold text-sm">{lead.name.charAt(0)}</span>
										</div>
									)}
									<div className="flex-1 min-w-0 flex flex-col justify-center">
										<p className="font-bold text-sm text-white/90 group-hover:text-emerald-400 transition-colors leading-tight break-words">
											{lead.name}
										</p>
										<p className="text-[11px] text-white/40 mt-0.5 break-words">
											{lead.city ? `${lead.city}, ${lead.state}` : 'Localização desconhecida'}
										</p>
									</div>
								</div>
								{lead.aiScore && (
									<span className="text-[10px] font-black text-emerald-950 bg-gradient-to-br from-emerald-400 to-emerald-500 px-2 py-1 rounded-md shadow-[0_0_15px_rgba(52,211,153,0.3)] shrink-0">
										{lead.aiScore}
									</span>
								)}
							</div>
							
							<div className="mt-4 flex items-end justify-between relative z-10 gap-2">
								<span className="text-[10px] font-medium bg-white/[0.03] border border-white/[0.08] px-2.5 py-1.5 rounded-lg text-white/70 line-clamp-2 leading-tight flex-1">
									{lead.niche || "Sem Nicho"}
								</span>
								{lead.phone && (
									<div className="flex items-center gap-2 shrink-0">
										<div className="w-8 h-8 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:border-emerald-500/30 transition-all duration-300">
											<MessageSquare className="w-3.5 h-3.5 text-white/40 group-hover:text-emerald-400" />
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
						<div className="flex flex-col items-start overflow-hidden flex-1 space-y-0.5">
							<p className="font-medium text-base truncate w-full text-left leading-none">
								{lead.name}
							</p>
							<p className="text-[11px] text-[#8696a0] font-normal leading-none">
								{lead.phone || "Sem telefone cadastrado"}
							</p>
						</div>
						{/* Botão Controle por IA */}
						<Button
							type="button"
							onClick={handleToggleIntervention}
							disabled={togglingStatus}
							className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
								isIntervention
									? "bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
									: "bg-[#2a3942] text-zinc-300 border-zinc-700/60 hover:bg-zinc-800 hover:text-white"
							}`}
							title={isIntervention ? "Reativar IA SDR" : "Silenciar IA SDR e assumir controle"}
						>
							{togglingStatus ? (
								<Loader2 className="w-3.5 h-3.5 animate-spin" />
							) : isIntervention ? (
								<><VolumeX className="w-3.5 h-3.5" /> IA Silenciada</>
							) : (
								<><Bot className="w-3.5 h-3.5" /> Controle por IA</>
							)}
						</Button>
					</DialogTitle>
				</DialogHeader>

				{/* Banner de Intervenção Humana Ativo */}
				{isIntervention && (
					<div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs text-amber-300 shrink-0 backdrop-blur-md">
						<span className="flex items-center gap-1.5 font-medium">
							<HandMetal className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
							IA SDR silenciada — você está no controle desta conversa.
						</span>
						<button
							type="button"
							onClick={handleToggleIntervention}
							className="underline hover:text-white text-[10px] font-bold uppercase tracking-wider"
						>
							Reativar IA
						</button>
					</div>
				)}

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
										key={msg.id || i}
										className={`flex ${msg.role === "assistant" ? "justify-end" : "justify-start"}`}
									>
										<div
											className={`max-w-[85%] sm:max-w-[70%] px-2.5 pt-1.5 pb-2 rounded-lg text-[14px] shadow-sm relative flex flex-col ${
												msg.role === "assistant"
													? "bg-[#005c4b] text-[#e9edef] rounded-tr-none before:absolute before:top-0 before:-right-2 before:w-2 before:h-3 before:bg-[#005c4b] before:[clip-path:polygon(0_0,100%_0,0_100%)] before:content-['']"
													: "bg-[#202c33] text-[#e9edef] rounded-tl-none before:absolute before:top-0 before:-left-2 before:w-2 before:h-3 before:bg-[#202c33] before:[clip-path:polygon(100%_0,0_0,100%_100%)] before:content-['']"
											}`}
										>
											{msg.type === "audio" ? (
												<div className="flex flex-col gap-1.5 min-w-[200px] max-w-xs mb-3 mt-1">
													<span className="text-[10px] text-zinc-400 font-bold tracking-wider uppercase flex items-center gap-1.5">
														<Volume2 className="w-3 h-3 text-emerald-400" />
														Áudio{" "}
														{msg.role === "assistant" ? "Enviado" : "Recebido"}
													</span>
													{msg.audioBase64 ? (
														<audio
															controls
															src={
																msg.audioBase64.startsWith("data:")
																	? msg.audioBase64
																	: `data:audio/ogg;base64,${msg.audioBase64}`
															}
															className="h-10 w-full max-w-[250px] outline-none"
														/>
													) : (
														<p className="text-[11px] text-zinc-400 italic">
															Áudio expirado ou indisponível
														</p>
													)}
													{/* Mostrar a transcrição apenas se houver conteúdo textual real */}
													{msg.content && msg.content !== "[Áudio Enviado]" && (
														<div className="mt-1 pt-1.5 border-t border-white/5">
															<span className="text-[9px] text-zinc-500 uppercase font-semibold mb-1 block">
																Transcrição:
															</span>
															<p className="text-xs text-zinc-300 italic leading-relaxed whitespace-pre-wrap break-words">
																"{msg.content}"
															</p>
														</div>
													)}
												</div>
											) : (
												<p className="leading-relaxed whitespace-pre-wrap break-words">
													{msg.content}
													<span className="inline-block w-14" />{" "}
													{/* Spacer for timestamp */}
												</p>
											)}
											<div className="absolute bottom-1 right-2 flex items-center gap-1">
												<p className="text-[10px] text-white/50 font-medium leading-none mt-[1px]">
													{msg.createdAt
														? new Date(msg.createdAt).toLocaleTimeString([], {
																hour: "2-digit",
																minute: "2-digit",
															})
														: ""}
												</p>
												{msg.role === "assistant" && (
													<CheckCheck className="w-[14px] h-[14px] text-[#53bdeb]" />
												)}
											</div>
										</div>
									</div>
								))
							)}
						</div>

						{/* Input Area */}
						<div className="bg-[#202c33] px-4 py-3 flex items-end gap-2 border-t border-zinc-800/50">
							{isRecording ? (
								<div className="flex-1 flex items-center justify-between bg-zinc-900/50 rounded-xl px-4 min-h-[40px] border border-red-500/20 w-full">
									<div className="flex items-center gap-3">
										<div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
										<span className="text-zinc-300 font-mono text-sm">
											{formatTime(recordingTime)}
										</span>
										<span className="text-xs text-zinc-500 ml-2 hidden sm:inline">
											Gravando áudio...
										</span>
									</div>
									<div className="flex items-center gap-2">
										<Button
											type="button"
											variant="ghost"
											onClick={cancelRecording}
											className="w-8 h-8 rounded-full text-zinc-400 hover:text-red-400 hover:bg-red-400/10 p-0"
											title="Cancelar gravação"
										>
											<Trash2 className="w-4 h-4" />
										</Button>
										<Button
											type="button"
											onClick={stopRecording}
											className="w-8 h-8 rounded-full bg-[#00a884] hover:bg-[#029072] text-white p-0"
											title="Parar e Enviar"
										>
											<Square className="w-3.5 h-3.5 fill-current" />
										</Button>
									</div>
								</div>
							) : (
								<>
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
											<div className="p-2 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
												{templates.map((tmpl, idx) => (
													<DropdownMenuItem
														key={idx}
														onClick={() => setInput(tmpl)}
														className="text-xs p-3 hover:bg-[#00a884]/10 hover:text-[#00a884] cursor-pointer rounded-lg border-b border-zinc-800/50 last:border-0 focus:bg-[#00a884]/10 focus:text-[#00a884]"
													>
														{tmpl}
													</DropdownMenuItem>
												))}
											</div>
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

									<div className="flex-1 bg-[#2a3942] rounded-xl overflow-hidden min-h-[40px] flex items-center border border-transparent focus-within:border-[#00a884]/50 transition-colors shadow-inner">
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
											className="w-full bg-transparent text-[#e9edef] text-sm px-4 py-2.5 max-h-48 focus:outline-none resize-none min-h-[40px] scrollbar-none"
											rows={
												input.split("\n").length > 1
													? Math.min(input.split("\n").length, 8)
													: 1
											}
										/>
									</div>

									{input.trim() ? (
										<Button
											type="button"
											onClick={handleSend}
											disabled={sending}
											className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#029072] text-white shrink-0 flex items-center justify-center transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 p-0"
										>
											{sending ? (
												<Loader2 className="w-5 h-5 animate-spin" />
											) : (
												<Send className="w-[18px] h-[18px] ml-0.5" />
											)}
										</Button>
									) : (
										<Button
											type="button"
											onClick={startRecording}
											className="w-10 h-10 rounded-full bg-[#2a3942] hover:bg-[#32454f] text-[#00a884] shrink-0 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-md shadow-black/20 cursor-pointer p-0"
											title="Gravar áudio"
										>
											<Mic className="w-5 h-5" />
										</Button>
									)}
								</>
							)}
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
