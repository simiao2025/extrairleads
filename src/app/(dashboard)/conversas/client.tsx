"use client";

import {
	ArrowLeft,
	Bot,
	Calendar,
	Globe,
	HandMetal,
	Loader2,
	MapPin,
	MessageSquare,
	Search,
	Send,
	Sparkles,
	User,
	Volume2,
	VolumeX,
	Zap,
	Mic,
	Square,
	Trash2,
	CheckCheck,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import {
	generateAiSuggestionAction,
	getLeadChatAction,
	moveLeadAction,
	sendManualWhatsAppMessageAction,
	sendWhatsAppAudioAction,
} from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

interface Conversation {
	lead: {
		id: number;
		name: string;
		phone: string | null;
		website: string | null;
		niche: string | null;
		city: string | null;
		state: string | null;
		imageUrl: string | null;
		aiScore: number | null;
		aiAnalysis: string | null;
		status: string | null;
		metadata: any;
		createdAt: Date | null;
		updatedAt: Date | null;
	};
	lastMessage: {
		content: string | null;
		createdAt: Date | null;
		role: string | null;
	};
}

interface ChatMessage {
	id: number;
	leadId: number | null;
	role: string | null;
	content: string | null;
	type: string | null;
	audioBase64: string | null;
	createdAt: Date | null;
}

const STATUS_COLORS: Record<string, string> = {
	raw: "bg-sky-500/10 text-sky-400 border-sky-500/20",
	qualified: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
	in_queue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
	contacted: "bg-purple-500/10 text-purple-400 border-purple-500/20",
	interested: "bg-orange-500/10 text-orange-400 border-orange-500/20",
	human_intervention: "bg-amber-500/10 text-amber-400 border-amber-500/20",
	discarded: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const STATUS_LABELS: Record<string, string> = {
	raw: "Novo",
	qualified: "Qualificado",
	in_queue: "Na Fila",
	contacted: "Contatado",
	interested: "Interessado",
	human_intervention: "Intervenção Humana",
	discarded: "Descartado",
};

interface ConversasClientProps {
	initialConversations: Conversation[];
}

export function ConversasClient({
	initialConversations,
}: ConversasClientProps) {
	const { success, error } = useToast();

	// Polling via SWR para lista de conversas
	const { data: swrConversations, mutate: mutateConversations } = useSWR(
		"conversations",
		async () => {
			const { getConversationsAction } = await import("@/app/actions");
			return getConversationsAction() as Promise<Conversation[]>;
		},
		{
			fallbackData: initialConversations,
			refreshInterval: 8000,
		},
	);

	const conversations = swrConversations || initialConversations;

	const [search, setSearch] = useState("");
	const [activeLeadId, setActiveLeadId] = useState<number | null>(
		initialConversations.length > 0 ? initialConversations[0].lead.id : null,
	);

	// Polling via SWR para o chat ativo
	const {
		data: swrHistory,
		mutate: mutateHistory,
		isLoading: isLoadingChat,
	} = useSWR(
		activeLeadId ? `chat-${activeLeadId}` : null,
		() =>
			activeLeadId ? getLeadChatAction(activeLeadId) : Promise.resolve([]),
		{
			refreshInterval: 4000,
		},
	);

	const history = (swrHistory || []) as ChatMessage[];
	const loadingChat = isLoadingChat && history.length === 0;

	const [input, setInput] = useState("");
	const [sending, setSending] = useState(false);
	const [generating, setGenerating] = useState(false);
	const [togglingStatus, setTogglingStatus] = useState(false);
	const [showRightPanel, setShowRightPanel] = useState(true);

	const [isRecording, setIsRecording] = useState(false);
	const [recordingTime, setRecordingTime] = useState(0);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const audioChunksRef = useRef<Blob[]>([]);
	const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const scrollRef = useRef<HTMLDivElement>(null);
	const activeConversation = conversations.find(
		(c) => c.lead.id === activeLeadId,
	);

	// Filtra as conversas com base na busca
	const filteredConversations = conversations.filter(
		(c) =>
			c.lead.name.toLowerCase().includes(search.toLowerCase()) ||
			c.lead.phone?.includes(search) ||
			c.lead.niche?.toLowerCase().includes(search.toLowerCase()),
	);

	const scrollToBottom = useCallback(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, []);

	// Rola para o fim ao atualizar histórico
	useEffect(() => {
		if (history) {
			scrollToBottom();
		}
	}, [history, scrollToBottom]);

	const handleSend = async () => {
		if (!input.trim() || !activeLeadId) return;
		setSending(true);

		const optimisticMsg: ChatMessage = {
			id: Date.now(),
			leadId: activeLeadId,
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

		const res = await sendManualWhatsAppMessageAction(activeLeadId, textToSend);
		if (!res.success) {
			mutateHistory(); // Revert optimistic
			error(`Erro ao enviar: ${res.error}`);
		} else {
			mutateHistory();
			// Atualiza a pré-visualização da última mensagem na barra lateral
			mutateConversations((prev) => {
				if (!prev) return prev;
				return prev.map((c) =>
					c.lead.id === activeLeadId
						? {
								...c,
								lastMessage: {
									content: textToSend,
									createdAt: new Date(),
									role: "assistant",
								},
						  }
						: c,
				);
			});
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
				const audioBlob = new Blob(audioChunksRef.current, { type: "audio/ogg" });
				
				// Ler como base64
				const reader = new FileReader();
				reader.readAsDataURL(audioBlob);
				reader.onloadend = async () => {
					const base64data = reader.result as string;
					const base64String = base64data.split(",")[1]; // remove o prefixo data:...

					if (!activeLeadId) return;
					setSending(true);

					// Optimistic update
					const optimisticMsg: ChatMessage = {
						id: Date.now(),
						leadId: activeLeadId,
						role: "assistant",
						content: "[Áudio Enviado]",
						audioBase64: base64String,
						type: "audio",
						createdAt: new Date(),
					};
					mutateHistory((prev) => [...((prev as ChatMessage[]) || []), optimisticMsg], false);

					const res = await sendWhatsAppAudioAction(activeLeadId, base64String);
					if (!res.success) {
						mutateHistory();
						error(`Erro ao enviar áudio: ${res.error}`);
					} else {
						mutateHistory();
					}
					setSending(false);
				};

				// Limpar as faixas de áudio para liberar o microfone
				stream.getTracks().forEach(track => track.stop());
			};

			mediaRecorder.start();
			setIsRecording(true);
			setRecordingTime(0);

			timerIntervalRef.current = setInterval(() => {
				setRecordingTime((prev) => prev + 1);
			}, 1000);
		} catch (err) {
			console.error("Erro ao acessar microfone", err);
			error("Permissão de microfone negada ou não disponível.");
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
				mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
			};
			mediaRecorderRef.current.stop();
			setIsRecording(false);
			if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
			setRecordingTime(0);
		}
	};

	const formatTime = (seconds: number) => {
		const m = Math.floor(seconds / 60).toString().padStart(2, "0");
		const s = (seconds % 60).toString().padStart(2, "0");
		return `${m}:${s}`;
	};

	const handleGenerateAI = async () => {
		if (!activeLeadId) return;
		setGenerating(true);
		const res = await generateAiSuggestionAction(activeLeadId);
		if (res.success && res.suggestion) {
			setInput(res.suggestion);
			success("Sugestão de resposta gerada pela IA!");
		} else {
			error(`Erro ao gerar sugestão: ${res.error}`);
		}
		setGenerating(false);
	};

	const handleToggleIntervention = async () => {
		if (!activeLeadId || !activeConversation) return;
		setTogglingStatus(true);

		const isCurrentlyIntervention =
			activeConversation.lead.status === "human_intervention";
		const nextStatus = isCurrentlyIntervention
			? "contacted"
			: "human_intervention";

		const res = await moveLeadAction(activeLeadId, nextStatus);
		if (res.success) {
			// Atualiza localmente o status do lead na lista de conversas
			mutateConversations((prev) => {
				if (!prev) return prev;
				return prev.map((c) =>
					c.lead.id === activeLeadId
						? { ...c, lead: { ...c.lead, status: nextStatus } }
						: c,
				);
			}, false);
			success(
				isCurrentlyIntervention
					? "IA SDR reativada com sucesso! Ela voltará a responder o cliente."
					: "IA SDR Silenciada! Agora você está no controle absoluto desta conversa.",
			);
		} else {
			error(`Erro ao alternar modo: ${res.error}`);
		}
		setTogglingStatus(false);
	};

	return (
		<div className="flex h-[calc(100vh-60px)] md:h-screen w-full bg-[#0b141a] text-[#e9edef] overflow-hidden">
			{/* ------------------------------------------------------------- */}
			{/* 1. PAINEL ESQUERDO: LISTAGEM DE CONVERSAS                     */}
			{/* ------------------------------------------------------------- */}
			<div
				className={`${
					activeLeadId ? "hidden md:flex" : "flex"
				} w-full md:w-[350px] lg:w-[400px] shrink-0 flex-col bg-[#111b21] border-r border-zinc-800/40`}
			>
				{/* Header da Esquerda */}
				<div className="p-4 bg-[#202c33] border-b border-zinc-800/40 flex items-center justify-between shrink-0">
					<h2 className="text-xl font-black text-white flex items-center gap-2 font-heading tracking-wide">
						<MessageSquare className="w-5 h-5 text-emerald-400" /> Conversas
					</h2>
					<Badge
						variant="outline"
						className="border-emerald-500/30 text-emerald-400 bg-emerald-500/5 font-bold uppercase text-[10px]"
					>
						{conversations.length} Ativas
					</Badge>
				</div>

				{/* Barra de Busca */}
				<div className="p-3 bg-[#111b21] border-b border-zinc-800/20 shrink-0">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
						<Input
							placeholder="Buscar chat por nome ou telefone..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-10 bg-[#202c33] border-transparent focus:border-emerald-500/50 text-[#e9edef] placeholder-zinc-500 text-sm h-9 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0"
						/>
					</div>
				</div>

				{/* Lista de Conversas com Scroll */}
				<div className="flex-1 overflow-y-auto divide-y divide-zinc-800/20 scrollbar-thin scrollbar-thumb-zinc-800">
					{filteredConversations.length === 0 ? (
						<div className="text-center py-16 text-zinc-500 px-4">
							<p className="text-sm font-medium">Nenhuma conversa ativa.</p>
							<p className="text-xs mt-1">
								Os leads aparecerão aqui assim que trocarem mensagens no
								WhatsApp.
							</p>
						</div>
					) : (
						filteredConversations.map((c) => {
							const isActive = c.lead.id === activeLeadId;
							const hasUnread = c.lead.status === "human_intervention";
							return (
								<button
									type="button"
									key={c.lead.id}
									onClick={() => setActiveLeadId(c.lead.id)}
									className={`w-full flex items-center gap-3 p-4 text-left transition-all relative ${
										isActive
											? "bg-[#2a3942] hover:bg-[#2a3942]"
											: "hover:bg-[#202c33]/50 bg-transparent"
									}`}
								>
									{/* Status Indicator Bar */}
									{isActive && (
										<span className="absolute left-0 top-0 bottom-0 w-[4px] bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
									)}

									{/* Avatar do Lead */}
									<div className="relative shrink-0">
										<div className="w-12 h-12 rounded-full flex items-center justify-center text-sm text-white font-bold overflow-hidden bg-zinc-800 border border-zinc-700 shadow-md">
											{c.lead.imageUrl ? (
												// biome-ignore lint/performance/noImgElement: dynamic avatars from external URLs cannot easily use next/image
												<img
													src={c.lead.imageUrl}
													alt={c.lead.name}
													className="w-full h-full object-cover"
												/>
											) : (
												<div className="w-full h-full bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-black font-black text-base">
													{c.lead.name.substring(0, 2).toUpperCase()}
												</div>
											)}
										</div>
										{hasUnread && (
											<span
												className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-500 rounded-full border-2 border-[#111b21] flex items-center justify-center shadow-lg"
												title="Aguardando Intervenção Humana"
											>
												<span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
											</span>
										)}
									</div>

									{/* Detalhes do Lead no Card */}
									<div className="flex-1 min-w-0">
										<div className="flex justify-between items-baseline mb-1">
											<p className="font-bold text-sm text-white truncate w-4/5 leading-none pr-1">
												{c.lead.name}
											</p>
											<span className="text-[10px] text-zinc-500 shrink-0 font-medium font-mono">
												{c.lastMessage.createdAt
													? new Date(
															c.lastMessage.createdAt,
														).toLocaleTimeString([], {
															hour: "2-digit",
															minute: "2-digit",
														})
													: ""}
											</span>
										</div>

										<div className="flex items-center justify-between mt-1.5">
											<p className="text-xs text-zinc-400 truncate w-3/4">
												{c.lastMessage.role === "assistant" ? (
													<span className="text-emerald-500 font-medium">
														Você:{" "}
													</span>
												) : null}
												{c.lastMessage.content || "Nenhuma mensagem trocada."}
											</p>

											<Badge
												variant="outline"
												className={`text-[9px] scale-90 border px-1.5 py-0.5 rounded-full font-extrabold uppercase shrink-0 ${
													STATUS_COLORS[c.lead.status || "raw"]
												}`}
											>
												{STATUS_LABELS[c.lead.status || "raw"]}
											</Badge>
										</div>
									</div>
								</button>
							);
						})
					)}
				</div>
			</div>

			{/* ------------------------------------------------------------- */}
			{/* 2. PAINEL CENTRAL: TIMELINE DO CHAT                           */}
			{/* ------------------------------------------------------------- */}
			<div
				className={`${
					!activeLeadId ? "hidden md:flex" : "flex"
				} flex-1 flex-col bg-[#0b141a] border-r border-zinc-800/40 relative h-full`}
			>
				{/* Background WhatsApp style pattern */}
				<div className="absolute inset-0 opacity-[0.035] bg-[url('https://static.whatsapp.net/rsrc.php/v3/yl/r/r-3A-64J.png')] bg-repeat z-0 pointer-events-none"></div>

				{activeConversation ? (
					<>
						{/* Header do Chat */}
						<div className="bg-[#202c33] px-4 py-3 flex items-center justify-between border-b border-zinc-800/40 z-10 shrink-0">
							<div className="flex items-center gap-3">
								{/* Botão Voltar (Mobile) */}
								<Button
									variant="ghost"
									size="icon"
									className="md:hidden text-zinc-400 hover:text-white"
									onClick={() => setActiveLeadId(null)}
								>
									<ArrowLeft className="w-5 h-5" />
								</Button>

								{/* Avatar */}
								<div className="w-10 h-10 rounded-full flex items-center justify-center text-sm text-white font-bold shrink-0 overflow-hidden bg-zinc-700 border border-zinc-600/50 shadow">
									{activeConversation.lead.imageUrl ? (
										// biome-ignore lint/performance/noImgElement: dynamic avatars from external URLs cannot easily use next/image
										<img
											src={activeConversation.lead.imageUrl}
											alt={activeConversation.lead.name}
											className="w-full h-full object-cover"
										/>
									) : (
										<User className="w-5 h-5 text-zinc-400" />
									)}
								</div>

								<div className="flex flex-col">
									<p className="font-bold text-sm text-white truncate max-w-[200px] leading-tight">
										{activeConversation.lead.name}
									</p>
									<p className="text-[10px] text-zinc-400 font-mono">
										{activeConversation.lead.phone || "Sem telefone"}
									</p>
								</div>
							</div>

							{/* Botões de Ação do Header */}
							<div className="flex items-center gap-3">
								{/* Botão de Intervenção Humana */}
								<Button
									onClick={handleToggleIntervention}
									disabled={togglingStatus}
									className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 cursor-pointer ${
										activeConversation.lead.status === "human_intervention"
											? "bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
											: "bg-[#2a3942] text-zinc-300 border-zinc-700/60 hover:bg-zinc-800 hover:text-white"
									}`}
									title={
										activeConversation.lead.status === "human_intervention"
											? "Reativar IA SDR"
											: "Silenciar IA SDR e assumir controle manual"
									}
								>
									{togglingStatus ? (
										<Loader2 className="w-3.5 h-3.5 animate-spin" />
									) : activeConversation.lead.status ===
										"human_intervention" ? (
										<>
											<VolumeX className="w-3.5 h-3.5" /> IA Silenciada
										</>
									) : (
										<>
											<Bot className="w-3.5 h-3.5" /> Controle por IA
										</>
									)}
								</Button>

								{/* Botão do Painel Direito */}
								<Button
									variant="ghost"
									size="icon"
									className="hidden lg:flex text-zinc-400 hover:text-white"
									onClick={() => setShowRightPanel(!showRightPanel)}
									title="Dados do Lead"
								>
									<Zap
										className={`w-4 h-4 ${showRightPanel ? "text-emerald-400" : ""}`}
									/>
								</Button>
							</div>
						</div>

						{/* Banner de Intervenção Humana Ativo */}
						{activeConversation.lead.status === "human_intervention" && (
							<div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs text-amber-300 z-10 shrink-0 backdrop-blur-md">
								<span className="flex items-center gap-1.5 font-medium">
									<HandMetal className="w-3.5 h-3.5 text-amber-400 animate-bounce" />{" "}
									O robô IA SDR está temporariamente desligado para este lead.
									Suas respostas serão enviadas manualmente.
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

						{/* Timeline das Mensagens */}
						<div
							ref={scrollRef}
							className="flex-1 overflow-y-auto p-4 space-y-4 z-10 scrollbar-thin scrollbar-thumb-zinc-800"
						>
							{loadingChat ? (
								<div className="flex items-center justify-center h-full">
									<div className="bg-[#202c33] px-4 py-2 rounded-full text-xs text-zinc-400 flex items-center gap-2 shadow-lg">
										<Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />{" "}
										Sincronizando chat...
									</div>
								</div>
							) : history.length === 0 ? (
								<div className="flex items-center justify-center h-full">
									<p className="bg-[#202c33] px-4 py-2 rounded-full text-[11px] font-medium text-zinc-400 shadow-md">
										Nenhuma mensagem trocada. Envie a primeira mensagem!
									</p>
								</div>
							) : (
								history.map((msg, i) => {
									const isAssistant = msg.role === "assistant";
									const isAudio = msg.type === "audio";
									return (
										<div
											key={msg.id || i}
											className={`flex ${isAssistant ? "justify-end" : "justify-start"}`}
										>
											<div
												className={`max-w-[85%] sm:max-w-[70%] px-2.5 pt-1.5 pb-2 rounded-lg text-[14px] shadow-sm relative flex flex-col transition-all ${
													isAssistant
														? "bg-[#005c4b] text-[#e9edef] rounded-tr-none hover:shadow-[0_0_12px_rgba(0,92,75,0.2)] before:absolute before:top-0 before:-right-2 before:w-2 before:h-3 before:bg-[#005c4b] before:[clip-path:polygon(0_0,100%_0,0_100%)] before:content-['']"
														: "bg-[#202c33] text-[#e9edef] rounded-tl-none hover:shadow-[0_0_12px_rgba(32,44,51,0.2)] before:absolute before:top-0 before:-left-2 before:w-2 before:h-3 before:bg-[#202c33] before:[clip-path:polygon(100%_0,0_0,100%_100%)] before:content-['']"
												}`}
											>
												{isAudio ? (
													<div className="flex flex-col gap-1.5 min-w-[200px] max-w-xs mb-3 mt-1">
														<span className="text-[10px] text-zinc-400 font-bold tracking-wider uppercase flex items-center gap-1.5">
															<Volume2 className="w-3 h-3 text-emerald-400" />
															Áudio {isAssistant ? "Enviado" : "Recebido"}
														</span>
														{msg.audioBase64 ? (
															<audio 
																controls 
																src={msg.audioBase64.startsWith("data:") ? msg.audioBase64 : `data:audio/ogg;base64,${msg.audioBase64}`}
																className="h-10 w-full max-w-[250px] outline-none"
															/>
														) : (
															<p className="text-[11px] text-zinc-400 italic">Áudio expirado ou indisponível</p>
														)}
														{/* Mostrar a transcrição apenas se houver conteúdo textual real */}
														{msg.content && msg.content !== "[Áudio Enviado]" && (
															<div className="mt-1 pt-1.5 border-t border-white/5">
																<span className="text-[9px] text-zinc-500 uppercase font-semibold mb-1 block">Transcrição:</span>
																<p className="text-xs text-zinc-300 italic leading-relaxed whitespace-pre-wrap break-words">
																	"{msg.content}"
																</p>
															</div>
														)}
													</div>
												) : (
													<p className="leading-relaxed whitespace-pre-wrap break-words">
														{msg.content}
														<span className="inline-block w-14" /> {/* Spacer for timestamp */}
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
													{isAssistant && (
														<CheckCheck className="w-[14px] h-[14px] text-[#53bdeb]" />
													)}
												</div>
											</div>
										</div>
									);
								})
							)}

							{generating && (
								<div className="flex justify-end">
									<div className="bg-[#005c4b] border border-[#005c4b]/50 p-3 px-4 rounded-2xl rounded-tr-none text-zinc-300 text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950/20">
										<Sparkles className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
										<span className="text-[11px] font-medium">
											IA gerando sugestão...
										</span>
										<span className="flex gap-1 ml-1.5">
											<span
												className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce"
												style={{ animationDelay: "0ms" }}
											></span>
											<span
												className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce"
												style={{ animationDelay: "150ms" }}
											></span>
											<span
												className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce"
												style={{ animationDelay: "300ms" }}
											></span>
										</span>
									</div>
								</div>
							)}

							{!generating &&
								history.length > 0 &&
								history[history.length - 1].role === "user" &&
								activeConversation.lead.status !== "human_intervention" && (() => {
									const lastMsg = history[history.length - 1];
									const lastMsgTime = lastMsg.createdAt ? new Date(lastMsg.createdAt).getTime() : 0;
									const secondsAgo = (Date.now() - lastMsgTime) / 1000;
									const isTimedOut = secondsAgo > 90;

									return isTimedOut ? (
										<div className="flex justify-end">
											<div className="bg-zinc-800/60 border border-zinc-700/40 p-2.5 px-3.5 rounded-2xl rounded-tr-none text-zinc-500 text-xs flex items-center gap-1.5 shadow-sm">
												<Bot className="w-3.5 h-3.5 text-zinc-500" />
												<span className="text-[11px] font-medium">
													IA SDR não conseguiu responder.
												</span>
											</div>
										</div>
									) : (
										<div className="flex justify-end">
											<div className="bg-[#005c4b] border border-[#005c4b]/50 p-3 px-4 rounded-2xl rounded-tr-none text-zinc-300 text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950/20">
												<Bot className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
												<span className="text-[11px] text-zinc-300 font-medium">
													IA SDR digitando...
												</span>
												<span className="flex gap-1 ml-1.5">
													<span
														className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce"
														style={{ animationDelay: "0ms" }}
													></span>
													<span
														className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce"
														style={{ animationDelay: "150ms" }}
													></span>
													<span
														className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce"
														style={{ animationDelay: "300ms" }}
													></span>
												</span>
											</div>
										</div>
									);
								})()}
						</div>

						{/* Input e Controles de Envio */}
						<div className="bg-[#202c33] px-4 py-3.5 flex items-end gap-3 border-t border-zinc-800/40 z-10 shrink-0">
							{isRecording ? (
								<div className="flex-1 flex items-center justify-between bg-zinc-900/50 rounded-xl px-4 min-h-[40px] border border-red-500/20">
									<div className="flex items-center gap-3">
										<div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
										<span className="text-zinc-300 font-mono text-sm">{formatTime(recordingTime)}</span>
										<span className="text-xs text-zinc-500 ml-2 hidden sm:inline">Gravando áudio...</span>
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
											className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 p-0"
											title="Parar e Enviar"
										>
											<Square className="w-3.5 h-3.5 fill-current" />
										</Button>
									</div>
								</div>
							) : (
								<>
									{/* Botão de Sugestão IA */}
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={handleGenerateAI}
										disabled={generating || sending}
										className="w-10 h-10 rounded-xl text-zinc-400 hover:text-emerald-400 hover:bg-[#00a884]/10 shrink-0 transition-all border border-zinc-700/30 hover:border-emerald-500/20 active:scale-95 cursor-pointer shadow-sm"
										title="Sugerir resposta com IA"
									>
										{generating ? (
											<Loader2 className="w-5 h-5 animate-spin" />
										) : (
											<Sparkles className="w-5 h-5" />
										)}
									</Button>

									{/* Área de Texto */}
									<div className="flex-1 bg-[#2a3942]/90 rounded-xl overflow-hidden min-h-[40px] flex items-center border border-transparent focus-within:border-emerald-500/50 transition-colors shadow-inner">
										<textarea
											value={input}
											onChange={(e) => setInput(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === "Enter" && !e.shiftKey) {
													e.preventDefault();
													handleSend();
												}
											}}
											placeholder="Digite sua resposta..."
											className="w-full bg-transparent text-[#e9edef] text-sm px-4 py-2.5 max-h-32 focus:outline-none resize-none min-h-[40px] scrollbar-none"
											rows={
												input.split("\n").length > 1
													? Math.min(input.split("\n").length, 5)
													: 1
											}
										/>
									</div>

									{/* Botão Enviar ou Gravar Áudio */}
									{input.trim() ? (
										<Button
											type="button"
											onClick={handleSend}
											disabled={sending}
											className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold shrink-0 flex items-center justify-center p-0 transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 shadow-md shadow-emerald-500/10 cursor-pointer"
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
											className="w-10 h-10 rounded-xl bg-[#2a3942] hover:bg-[#32454f] text-emerald-400 shrink-0 flex items-center justify-center p-0 transition-transform hover:scale-105 active:scale-95 shadow-md shadow-black/20 cursor-pointer"
											title="Gravar áudio"
										>
											<Mic className="w-5 h-5" />
										</Button>
									)}
								</>
							)}
						</div>
					</>
				) : (
					<div className="flex-1 flex flex-col items-center justify-center text-center p-8 z-10">
						<div className="w-20 h-20 rounded-3xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-center mb-6 shadow-xl relative overflow-hidden group">
							<div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
							<MessageSquare className="w-10 h-10 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
						</div>
						<h3 className="text-xl font-bold text-white mb-2 font-heading">
							Nenhuma conversa aberta
						</h3>
						<p className="text-sm text-zinc-500 max-w-sm">
							Selecione uma conversa na barra lateral esquerda para acompanhar e
							intervir em tempo real.
						</p>
					</div>
				)}
			</div>

			{/* ------------------------------------------------------------- */}
			{/* 3. PAINEL DIREITO: RESUMO E DADOS DO LEAD                     */}
			{/* ------------------------------------------------------------- */}
			{showRightPanel && activeConversation && (
				<div className="hidden lg:flex w-[320px] xl:w-[360px] shrink-0 flex-col bg-[#111b21] z-10 p-5 overflow-y-auto border-l border-zinc-800/40 divide-y divide-zinc-800/40 scrollbar-thin scrollbar-thumb-zinc-800 gap-6">
					{/* Sessão da IA e Score */}
					<div className="space-y-4 pb-6">
						<h3 className="text-emerald-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
							<Bot className="w-4 h-4 text-emerald-500" /> Análise IA
						</h3>

						<div className="bg-[#202c33]/50 p-4 rounded-2xl border border-zinc-800/60 shadow-inner">
							<div className="flex items-center justify-between mb-3">
								<span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
									Score do Lead
								</span>
								{activeConversation.lead.aiScore !== null &&
								activeConversation.lead.aiScore !== undefined ? (
									<span
										className={`font-black text-xs px-2 py-0.5 rounded-lg ${
											activeConversation.lead.aiScore >= 80 ||
											activeConversation.lead.aiScore >= 8
												? "text-emerald-400 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
												: "text-amber-400 bg-amber-500/10"
										}`}
									>
										{activeConversation.lead.aiScore >= 80
											? activeConversation.lead.aiScore
											: activeConversation.lead.aiScore * 10}
										/100
									</span>
								) : (
									<span className="text-zinc-600 font-bold text-sm">—</span>
								)}
							</div>
							<p className="text-xs text-zinc-300 leading-relaxed italic border-l-2 border-emerald-500/60 pl-3">
								&ldquo;
								{activeConversation.lead.aiAnalysis ||
									"Sem análise técnica disponível no momento."}
								&rdquo;
							</p>
						</div>
					</div>

					{/* Dados Gerais do Lead */}
					<div className="space-y-4 pt-6 pb-6">
						<h3 className="text-zinc-400 text-xs font-black uppercase tracking-widest">
							Dados Cadastrais
						</h3>

						<div className="space-y-3.5 text-xs">
							<div className="flex items-start gap-2.5 text-zinc-300">
								<MapPin className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
								<div>
									<p className="text-zinc-500 text-[10px] uppercase font-bold">
										Localização
									</p>
									<p className="text-zinc-200 mt-0.5">
										{activeConversation.lead.city || "Não informado"}
										{activeConversation.lead.city &&
										activeConversation.lead.state
											? ", "
											: ""}
										{activeConversation.lead.state}
									</p>
								</div>
							</div>

							<div className="flex items-start gap-2.5 text-zinc-300">
								<Zap className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
								<div>
									<p className="text-zinc-500 text-[10px] uppercase font-bold">
										Nicho / Segmento
									</p>
									<Badge
										variant="outline"
										className="text-zinc-300 bg-zinc-800/40 border-zinc-700/60 font-bold px-2 py-0.5 mt-1"
									>
										{activeConversation.lead.niche || "Sem nicho informado"}
									</Badge>
								</div>
							</div>

							{activeConversation.lead.website && (
								<div className="flex items-start gap-2.5 text-zinc-300">
									<Globe className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
									<div className="min-w-0">
										<p className="text-zinc-500 text-[10px] uppercase font-bold">
											Site
										</p>
										<a
											href={
												activeConversation.lead.website.startsWith("http")
													? activeConversation.lead.website
													: `https://${activeConversation.lead.website}`
											}
											target="_blank"
											rel="noreferrer"
											className="text-blue-400 hover:underline break-all mt-0.5 block truncate hover:text-blue-300"
										>
											{activeConversation.lead.website}
										</a>
									</div>
								</div>
							)}

							<div className="flex items-start gap-2.5 text-zinc-300">
								<Calendar className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
								<div>
									<p className="text-zinc-500 text-[10px] uppercase font-bold">
										Adicionado em
									</p>
									<p className="text-zinc-200 mt-0.5">
										{activeConversation.lead.createdAt
											? new Date(
													activeConversation.lead.createdAt,
												).toLocaleDateString([], {
													day: "2-digit",
													month: "long",
													year: "numeric",
												})
											: "Sem data"}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
