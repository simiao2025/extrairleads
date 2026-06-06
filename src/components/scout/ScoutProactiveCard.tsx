"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Compass, X } from "lucide-react";
import { useEffect, useState } from "react";

interface ScoutProactiveCardProps {
	message: string;
	delayMs?: number;
	autoHideMs?: number;
}

export function ScoutProactiveCard({ message, delayMs = 2000, autoHideMs = 15000 }: ScoutProactiveCardProps) {
	const [isVisible, setIsVisible] = useState(false);
	const [hasClosed, setHasClosed] = useState(false);

	useEffect(() => {
		if (hasClosed) return;

		const showTimer = setTimeout(() => {
			setIsVisible(true);
		}, delayMs);

		let hideTimer: NodeJS.Timeout;
		if (autoHideMs > 0) {
			hideTimer = setTimeout(() => {
				setIsVisible(false);
			}, delayMs + autoHideMs);
		}

		return () => {
			clearTimeout(showTimer);
			if (hideTimer) clearTimeout(hideTimer);
		};
	}, [delayMs, autoHideMs, hasClosed]);

	const handleClose = () => {
		setIsVisible(false);
		setHasClosed(true);
	};

	return (
		<AnimatePresence>
			{isVisible && (
				<motion.div
					initial={{ opacity: 0, y: 50, scale: 0.9, rotateX: 20 }}
					animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
					exit={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(4px)" }}
					transition={{ type: "spring", damping: 20, stiffness: 200 }}
					className="fixed bottom-24 right-24 z-40 max-w-sm hidden md:block perspective-1000"
				>
					<div className="relative rounded-2xl border border-emerald-500/30 bg-zinc-950/90 p-4 shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)] backdrop-blur-xl overflow-hidden group">
						
						{/* Animated Border Beam effect using conic gradient */}
						<div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,rgba(16,185,129,0.3)_50%,transparent_100%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
						
						{/* Inner background to mask the inner part of the beam */}
						<div className="absolute inset-[1px] rounded-[15px] bg-zinc-950/95" />

						<div className="relative flex items-start gap-3">
							<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]">
								<Compass className="h-4 w-4 text-white" strokeWidth={2.5} />
							</div>
							
							<div className="flex-1 pt-1">
								<h5 className="text-xs font-bold text-emerald-400 mb-1">Dica do Scout</h5>
								<p className="text-sm text-zinc-300 leading-snug">
									{message}
								</p>
							</div>

							<button
								type="button"
								onClick={handleClose}
								className="shrink-0 rounded-full p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
							>
								<X className="h-3 w-3" />
							</button>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
