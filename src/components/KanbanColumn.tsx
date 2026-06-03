"use client";

import { useDroppable } from "@dnd-kit/core";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { KanbanCard } from "./KanbanCard";

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
	imageUrl: string | null;
	niche: string | null;
	city: string | null;
	state: string | null;
	aiScore: number | null;
	aiAnalysis: string | null;
	status: LeadStatus | null;
	metadata: unknown;
	createdAt: Date | null;
	updatedAt: Date | null;
}

interface StageConfig {
	key: string;
	label: string;
	badge: string;
	emptyLabel: string;
}

interface KanbanColumnProps {
	stage: StageConfig;
	leads: Lead[];
	animationDelay: number;
	isDragging: boolean;
}

export function KanbanColumn({
	stage,
	leads,
	animationDelay,
	isDragging,
}: KanbanColumnProps) {
	const { setNodeRef, isOver } = useDroppable({ id: stage.key });

	return (
		<div
			ref={setNodeRef}
			className={cn(
				"flex min-h-[500px] flex-col gap-4 rounded-2xl border p-5 backdrop-blur-3xl transition-all animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both",
				isOver
					? "border-emerald-500/50 bg-emerald-500/5 scale-[1.02]"
					: "border-white/[0.04] bg-white/[0.01]",
				isDragging && !isOver && "opacity-60",
			)}
			style={{ animationDelay: `${animationDelay}ms` }}
		>
			<div className="flex items-center justify-between mb-1">
				<h3 className="text-sm font-bold tracking-wider text-white/90 uppercase">
					{stage.label}
				</h3>
				<span
					className={cn(
						"rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest",
						stage.badge,
					)}
				>
					{leads.length}
				</span>
			</div>

			<div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-2" />

			<div className="flex flex-col gap-3 flex-1">
				<AnimatePresence mode="popLayout">
					{leads.map((lead) => (
						<motion.div
							key={lead.id}
							layout
							initial={{ opacity: 0, scale: 0.9, y: 10 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.9, y: -10 }}
							transition={{ type: "spring", stiffness: 350, damping: 25 }}
							className="w-full"
						>
							<KanbanCard lead={lead} />
						</motion.div>
					))}
				</AnimatePresence>

				{leads.length === 0 && (
					<div className="mt-10 flex flex-col items-center justify-center opacity-40">
						<div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-zinc-600 animate-[spin_8s_linear_infinite]">
							<div className="h-1 w-1 rounded-full bg-zinc-500 absolute top-0" />
						</div>
						<p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
							{stage.emptyLabel}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
