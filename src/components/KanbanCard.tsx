"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MessageSquare, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import LeadDetailsDialog from "./LeadDetailsDialog";

type LeadStatus = "raw" | "qualified" | "in_queue" | "contacted" | "interested" | "discarded";

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
  status: LeadStatus | null;
  metadata: unknown;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface KanbanCardProps {
  lead: Lead;
  isDragOverlay?: boolean;
}

export function KanbanCard({ lead, isDragOverlay = false }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isDragOverlay) {
    return (
      <div className="w-full text-left p-4 rounded-xl bg-zinc-900/80 backdrop-blur-xl border border-cyan-500/50 shadow-2xl shadow-cyan-500/10">
        <CardContent lead={lead} />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex items-start gap-2",
        isDragging && "opacity-30"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-1 shrink-0 cursor-grab active:cursor-grabbing rounded p-0.5 text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-zinc-400 transition-opacity"
        aria-label="Arrastar lead"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex-1 min-w-0">
        <LeadDetailsDialog lead={lead} />
      </div>
    </div>
  );
}

function CardContent({ lead }: { lead: Lead }) {
  return (
    <>
      <div className="flex justify-between items-start">
        <p className="font-bold text-sm truncate w-4/5">{lead.name}</p>
        {lead.aiScore && (
          <span className="text-[10px] font-bold text-emerald-900 bg-emerald-400 px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(52,211,153,0.3)]">
            {lead.aiScore}
          </span>
        )}
      </div>
      <p className="text-xs text-zinc-500 mt-1 truncate">{lead.city}, {lead.state}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">{lead.niche}</span>
        <MessageSquare className="w-3.5 h-3.5 text-zinc-600 group-hover:text-cyan-500 transition-colors" />
      </div>
    </>
  );
}