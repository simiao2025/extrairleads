"use client";

import { motion } from "framer-motion";
import { Send, Trash2, X } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface ChatMessage {
	role: "user" | "assistant";
	content: string;
	id: string;
}

interface ScoutChatProps {
	onClose: () => void;
	onNewMessage: () => void;
}

export function ScoutChat({ onClose, onNewMessage }: ScoutChatProps) {
	const [messages, setMessages] = useState<ChatMessage[]>([
		{
			id: "initial",
			role: "assistant",
			content:
				"Olá! Sou o Scout, seu assistente do sistema. 🎯\n\nPosso te ajudar com dicas de busca, análise de campanhas, lembretes de follow-up ou suporte técnico. Como posso ajudar?",
		},
	]);
	const pathname = usePathname();
	const [input, setInput] = useState("");
	const [isStreaming, setIsStreaming] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const abortRef = useRef<AbortController | null>(null);

	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	useEffect(() => {
		scrollToBottom();
	}, [scrollToBottom]);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	const sendMessage = useCallback(async () => {
		const trimmed = input.trim();
		if (!trimmed || isStreaming) return;

		const userMessage: ChatMessage = {
			id: crypto.randomUUID(),
			role: "user",
			content: trimmed,
		};
		const updatedMessages = [...messages, userMessage];

		setMessages(updatedMessages);
		setInput("");
		setIsStreaming(true);

		const assistantMessage: ChatMessage = {
			id: crypto.randomUUID(),
			role: "assistant",
			content: "",
		};
		setMessages((prev) => [...prev, assistantMessage]);

		try {
			abortRef.current = new AbortController();

			const apiMessages = updatedMessages.map((m) => ({
				role: m.role,
				content: m.content,
			}));

			const response = await fetch("/api/scout/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ messages: apiMessages, currentPage: pathname }),
				signal: abortRef.current.signal,
			});

			if (!response.ok) {
				const err = await response.json().catch(() => ({}));
				throw new Error(err.error || "Erro ao conectar com o Scout");
			}

			const reader = response.body?.getReader();
			if (!reader) throw new Error("Stream não disponível");

			const decoder = new TextDecoder();
			let accumulated = "";

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value, { stream: true });
				const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

				for (const line of lines) {
					const data = line.slice(6);
					if (data === "[DONE]") break;

					try {
						const parsed = JSON.parse(data);
						if (parsed.text) {
							accumulated += parsed.text;
							setMessages((prev) => {
								const copy = [...prev];
								const lastMsg = copy[copy.length - 1];
								copy[copy.length - 1] = {
									id: lastMsg.id,
									role: "assistant",
									content: accumulated,
								};
								return copy;
							});
						}
					} catch {
						// skip malformed chunks
					}
				}
			}

			onNewMessage();
		} catch (error) {
			if (error instanceof DOMException && error.name === "AbortError") return;

			const errorMessage =
				error instanceof Error ? error.message : "Erro desconhecido";
			console.error("Scout chat error:", errorMessage);

			setMessages((prev) => {
				const copy = [...prev];
				const lastMsg = copy[copy.length - 1];
				copy[copy.length - 1] = {
					id: lastMsg.id,
					role: "assistant",
					content: `Desculpe, tive um problema ao processar: ${errorMessage}`,
				};
				return copy;
			});
		} finally {
			setIsStreaming(false);
			abortRef.current = null;
		}
	}, [input, isStreaming, messages, onNewMessage, pathname]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				sendMessage();
			}
		},
		[sendMessage],
	);

	const clearChat = useCallback(() => {
		if (isStreaming) {
			abortRef.current?.abort();
		}
		setMessages([
			{
				id: crypto.randomUUID(),
				role: "assistant",
				content: "Chat limpo! Como posso ajudar agora? 🎯",
			},
		]);
	}, [isStreaming]);

	return (
		<motion.div
			initial={{ opacity: 0, y: 20, scale: 0.95 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: 20, scale: 0.95 }}
			transition={{ type: "spring", damping: 25, stiffness: 350 }}
			className="fixed bottom-24 right-4 z-50 w-[calc(100vw-2rem)] max-w-[400px] md:bottom-28 md:right-8 flex flex-col overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/95 shadow-2xl shadow-black/40 backdrop-blur-xl"
			style={{ maxHeight: "min(600px, calc(100vh - 10rem))" }}
			id="scout-chat-panel"
		>
			{/* ─── Header ─── */}
			<div className="relative flex flex-col items-center justify-center border-b border-zinc-800/60 px-4 pt-6 pb-4 bg-zinc-900/50">
				<div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.4)] mb-2 overflow-hidden border border-emerald-500/20">
					<Image
						src="/scout-avatar.png"
						alt="Scout Avatar"
						fill
						className="object-cover"
					/>
				</div>
				<h3 className="text-sm font-bold text-white tracking-tight">Scout</h3>
				<p className="text-[10px] text-emerald-500/80 font-medium">
					{isStreaming ? "Pensando..." : "Assistente do Sistema"}
				</p>

				<div className="absolute top-2 right-2 flex items-center gap-1">
					<button
						type="button"
						onClick={clearChat}
						className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors"
						title="Limpar conversa"
					>
						<Trash2 className="h-3.5 w-3.5" />
					</button>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors"
						title="Fechar"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
			</div>

			{/* ─── Messages ─── */}
			<div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-700">
				{messages.map((msg) => (
					<div
						key={msg.id}
						className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
					>
						<div
							className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
								msg.role === "user"
									? "bg-emerald-600/20 text-emerald-100 border border-emerald-500/15 rounded-br-md"
									: "bg-zinc-800/60 text-zinc-200 border border-zinc-700/30 rounded-bl-md"
							}`}
						>
							{msg.content.split("\n").reduce((acc, line, idx, arr) => {
								acc.push(
									<span key={line.substring(0, 20) || `line-${idx}`}>
										{line}
									</span>,
								);
								if (idx < arr.length - 1) {
									acc.push(<br key="line-break" />);
								}
								return acc;
							}, [] as React.ReactNode[])}
							{isStreaming &&
								messages.indexOf(msg) === messages.length - 1 &&
								msg.role === "assistant" && (
									<span className="inline-block w-1.5 h-4 bg-emerald-400 ml-0.5 animate-pulse rounded-sm" />
								)}
						</div>
					</div>
				))}
				<div ref={messagesEndRef} />
			</div>

			{/* ─── Input ─── */}
			<div className="border-t border-zinc-800/60 px-3 py-2.5 bg-zinc-900/30">
				<div className="flex items-center gap-2 rounded-xl border border-zinc-700/40 bg-zinc-800/40 px-3 py-1.5 focus-within:border-emerald-500/40 focus-within:bg-zinc-800/60 transition-all">
					<input
						ref={inputRef}
						type="text"
						placeholder="Pergunte ao Scout..."
						className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						disabled={isStreaming}
						maxLength={2000}
						id="scout-chat-input"
					/>
					<button
						type="button"
						onClick={sendMessage}
						disabled={!input.trim() || isStreaming}
						className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
						title="Enviar"
					>
						<Send className="h-3.5 w-3.5" />
					</button>
				</div>
			</div>
		</motion.div>
	);
}
