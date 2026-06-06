"use client";

import { motion } from "framer-motion";
import { Compass, Copy, CheckCircle2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface LeadData {
	id: number;
	name: string | null;
	niche: string | null;
	city: string | null;
	description: string | null;
	rating: number | null;
	reviews: number | null;
}

interface ScoutInsight {
	scoreNicho: number;
	scorePotencial: number;
	msgAbertura: string;
}

export function LeadScoutInsight({ lead }: { lead: LeadData }) {
	const [insight, setInsight] = useState<ScoutInsight | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		let isMounted = true;
		const fetchInsight = async () => {
			try {
				const res = await fetch("/api/scout/analyze", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ lead }),
				});
				if (!res.ok) throw new Error("Falha na API");
				const data = await res.json();
				if (isMounted) {
					setInsight(data);
					setLoading(false);
				}
			} catch (_err) {
				if (isMounted) {
					setError(true);
					setLoading(false);
				}
			}
		};

		fetchInsight();
		return () => {
			isMounted = false;
		};
	}, [lead]);

	const handleCopy = () => {
		if (insight?.msgAbertura) {
			navigator.clipboard.writeText(insight.msgAbertura);
			setCopied(true);
			toast.success("Mensagem copiada para a área de transferência!");
			setTimeout(() => setCopied(false), 2000);
		}
	};

	if (error) return null; // Silently fail if Scout can't analyze

	if (loading) {
		return (
			<div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4 relative overflow-hidden">
				{/* Shimmer animation */}
				<div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent" />
				
				<div className="flex items-center gap-2 mb-3">
					<Compass className="h-4 w-4 text-emerald-500 animate-spin-slow" />
					<div className="h-4 w-32 bg-zinc-800/50 rounded animate-pulse" />
				</div>
				<div className="grid grid-cols-2 gap-3 mb-3">
					<div className="h-12 bg-zinc-800/50 rounded animate-pulse" />
					<div className="h-12 bg-zinc-800/50 rounded animate-pulse" />
				</div>
				<div className="h-16 bg-zinc-800/50 rounded animate-pulse" />
			</div>
		);
	}

	if (!insight) return null;

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className="mt-4 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-emerald-900/10 p-4 shadow-lg shadow-emerald-900/5 relative group overflow-hidden"
		>
			{/* Efeito sutil no hover */}
			<div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent blur-xl" />

			<div className="flex items-center gap-2 mb-4 relative">
				<div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
					<Sparkles className="h-3.5 w-3.5" />
				</div>
				<h4 className="text-sm font-semibold text-emerald-400">Análise do Scout</h4>
			</div>

			<div className="grid grid-cols-2 gap-3 mb-4 relative">
				<div className="flex flex-col gap-1 rounded-lg border border-zinc-800/60 bg-zinc-900/50 p-2.5">
					<span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Score de Nicho</span>
					<div className="flex items-end gap-1">
						<span className="text-2xl font-bold text-white leading-none">{insight.scoreNicho}</span>
						<span className="text-xs text-zinc-500 mb-0.5">/100</span>
					</div>
				</div>
				<div className="flex flex-col gap-1 rounded-lg border border-zinc-800/60 bg-zinc-900/50 p-2.5">
					<span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Score Potencial</span>
					<div className="flex items-end gap-1">
						<span className="text-2xl font-bold text-white leading-none">{insight.scorePotencial}</span>
						<span className="text-xs text-zinc-500 mb-0.5">/100</span>
					</div>
				</div>
			</div>

			<div className="relative rounded-lg border border-zinc-800 bg-zinc-950 p-3">
				<span className="absolute -top-2 left-3 bg-zinc-950 px-1 text-[10px] font-medium text-emerald-500">
					Icebreaker Sugerido
				</span>
				<p className="text-sm text-zinc-300 pr-8">{insight.msgAbertura}</p>
				<button
					type="button"
					onClick={handleCopy}
					className="absolute right-2 top-2 rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
					title="Copiar mensagem"
				>
					{copied ? (
						<CheckCircle2 className="h-4 w-4 text-emerald-500" />
					) : (
						<Copy className="h-4 w-4" />
					)}
				</button>
			</div>
		</motion.div>
	);
}
