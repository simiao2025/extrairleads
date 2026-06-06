"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState, useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ScoutChat } from "./ScoutChat";
import { X } from "lucide-react";

// Posições predefinidas por onde o Scout pode "passear"
const SCOUT_POSITIONS = [
	{ bottom: 24, right: 24 },   // canto inferior direito (default)
	{ bottom: 24, right: 120 },  // um pouco à esquerda
	{ bottom: 100, right: 24 },  // um pouco acima
	{ bottom: 180, right: 40 },  // mais acima
	{ bottom: 24, right: 200 },  // mais à esquerda
	{ bottom: 120, right: 100 }, // diagonal
];

export function ScoutAvatar() {
	const [isOpen, setIsOpen] = useState(false);
	const [hasUnread, setHasUnread] = useState(false);
	const [speechText, setSpeechText] = useState<string | null>(null);
	const [posIndex, setPosIndex] = useState(0);
	const pathname = usePathname();
	const moveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const toggle = useCallback(() => {
		setIsOpen((prev) => !prev);
		if (!isOpen) {
			setHasUnread(false);
			setSpeechText(null);
		}
	}, [isOpen]);

	// Dicas contextuais baseadas na página
	useEffect(() => {
		const timer = setTimeout(() => {
			if (!isOpen) {
				let tip = "Dica do Scout: Precisa de ajuda com o sistema? Estou aqui!";
				
				if (pathname?.includes("/leads")) {
					tip = "Dica do Scout: Analisando seus leads... Que tal criar uma mensagem de abertura personalizada para os leads qualificados?";
				} else if (pathname?.includes("/campaigns") || pathname?.includes("/dashboard")) {
					tip = "Dica do Scout: Uma campanha com nicho e cidade bem definidos aumenta a taxa de resposta em 40%!";
				} else if (pathname?.includes("/knowledge") || pathname?.includes("/settings")) {
					tip = "Dica do Scout: Quanto mais informações o agente tiver, melhor ele vai converter. Adicione PDFs e histórico!";
				}

				setSpeechText(tip);
				setHasUnread(true);
			}
		}, 8000);

		const hideTimer = setTimeout(() => {
			setSpeechText(null);
		}, 20000);

		return () => {
			clearTimeout(timer);
			clearTimeout(hideTimer);
		};
	}, [isOpen, pathname]);

	// Movimento dinâmico do Scout pela tela
	useEffect(() => {
		if (isOpen) {
			// Quando o chat está aberto, volta para o canto inferior direito e para de mover
			setPosIndex(0);
			if (moveTimerRef.current) {
				clearInterval(moveTimerRef.current);
				moveTimerRef.current = null;
			}
			return;
		}

		// Move a cada 12-18 segundos quando o chat está fechado
		moveTimerRef.current = setInterval(() => {
			setPosIndex((prev) => {
				let next = prev;
				// Garante que não repete a mesma posição
				while (next === prev) {
					next = Math.floor(Math.random() * SCOUT_POSITIONS.length);
				}
				return next;
			});
		}, 14000);

		return () => {
			if (moveTimerRef.current) {
				clearInterval(moveTimerRef.current);
				moveTimerRef.current = null;
			}
		};
	}, [isOpen]);

	const currentPos = SCOUT_POSITIONS[posIndex];

	return (
		<>
			<motion.div
				className="fixed z-50 flex flex-col items-end gap-3 pointer-events-none"
				animate={{
					bottom: currentPos.bottom,
					right: currentPos.right,
				}}
				transition={{
					type: "spring",
					stiffness: 50,
					damping: 20,
					mass: 1.2,
				}}
			>
				{/* ─── Speech Bubble ─── */}
				<AnimatePresence>
					{speechText && !isOpen && (
						<motion.div
							initial={{ opacity: 0, scale: 0.8, y: 10, originX: 1, originY: 1 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.8, y: 10 }}
							className="relative rounded-2xl rounded-br-sm border border-emerald-500/30 bg-zinc-950/90 p-3 shadow-[0_0_20px_rgba(16,185,129,0.15)] backdrop-blur-xl max-w-[280px] cursor-pointer pointer-events-auto group"
							onClick={toggle}
						>
							<p className="text-xs font-medium text-emerald-100 leading-snug">
								{speechText}
							</p>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									setSpeechText(null);
								}}
								className="absolute -top-2 -left-2 bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-full p-1 border border-zinc-700 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
							>
								<X className="w-3 h-3" />
							</button>
						</motion.div>
					)}
				</AnimatePresence>

				{/* ─── Floating Avatar Button ─── */}
				<motion.button
					type="button"
					onClick={toggle}
					className="group relative pointer-events-auto"
					whileHover={{ scale: 1.08 }}
					whileTap={{ scale: 0.92 }}
					aria-label="Abrir Scout"
					id="scout-avatar-btn"
				>
					{/* Outer glow ring */}
					<span className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl group-hover:bg-emerald-500/30 transition-all duration-500" />

					{/* Breathing pulse ring */}
					<span
						className={`absolute inset-[-4px] rounded-full border-2 ${
							hasUnread && !isOpen
								? "border-emerald-500/60 animate-ping"
								: "border-emerald-500/30 animate-[scout-pulse_3s_ease-in-out_infinite]"
						}`}
					/>

					{/* Main circle */}
					<span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-zinc-950 shadow-[0_0_24px_rgba(16,185,129,0.35)] border border-emerald-400/20 overflow-hidden">
						<Image
							src="/scout-avatar.png"
							alt="Scout Avatar"
							fill
							className={`object-cover transition-transform duration-500 ${isOpen ? "scale-110" : "scale-100"}`}
						/>
					</span>

					{/* Unread badge */}
					{hasUnread && !isOpen && (
						<motion.span
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 border-2 border-zinc-950"
						/>
					)}
				</motion.button>
			</motion.div>

			{/* ─── Chat Panel ─── */}
			<AnimatePresence>
				{isOpen && (
					<ScoutChat
						onClose={() => setIsOpen(false)}
						onNewMessage={() => setHasUnread(true)}
					/>
				)}
			</AnimatePresence>
		</>
	);
}
