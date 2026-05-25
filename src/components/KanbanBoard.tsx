"use client";

import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useCallback, useMemo, useState } from "react";
import { moveLeadAction } from "@/app/actions";
import { useToast } from "@/components/ui/toast";
import { KanbanCard } from "./KanbanCard";
import { KanbanColumn } from "./KanbanColumn";

type LeadStatus =
  | "raw"
  | "qualified"
  | "in_queue"
  | "contacted"
  | "interested"
  | "human_intervention"
  | "discarded";

export interface Lead {
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

type KanbanStage =
  | "raw"
  | "qualified"
  | "contacted"
  | "interested"
  | "in_queue"
  | "human_intervention"
  | "discarded";

interface StageConfig {
  key: KanbanStage;
  label: string;
  border: string;
  badge: string;
  emptyLabel: string;
}

const STAGES: StageConfig[] = [
  {
    key: "raw",
    label: "Novos",
    border: "border-sky-500/50",
    badge: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    emptyLabel: "Aguardando",
  },
  {
    key: "qualified",
    label: "Qualificados",
    border: "border-emerald-500/50",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    emptyLabel: "Nenhum qualificado",
  },
  {
    key: "contacted",
    label: "Contatados",
    border: "border-purple-500/50",
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    emptyLabel: "Nenhum contatado",
  },
  {
    key: "human_intervention",
    label: "Intervenção",
    border: "border-rose-500/50",
    badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    emptyLabel: "Tudo tranquilo",
  },
  {
    key: "interested",
    label: "Interessados",
    border: "border-amber-500/50",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    emptyLabel: "Nenhum interessado",
  },
];

interface KanbanBoardProps {
  initialLeads: Lead[];
}

export function KanbanBoard({ initialLeads }: KanbanBoardProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const { error, success } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const leadsByStage = useMemo(() => {
    const map: Record<KanbanStage, Lead[]> = {
      raw: [],
      qualified: [],
      contacted: [],
      interested: [],
      in_queue: [],
      human_intervention: [],
      discarded: [],
    };
    leads.forEach((lead) => {
      const stage = (lead.status as KanbanStage) || "raw";
      if (map[stage]) map[stage].push(lead);
    });
    return map;
  }, [leads]);

  const activeLead = useMemo(
    () => (activeId ? leads.find((l) => l.id === activeId) : null),
    [activeId, leads],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as number);
    setDragging(true);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setDragging(false);

    if (!over) return;

    const leadId = active.id as number;
    const overId = over.id;
    const overLead = leads.find((l) => l.id === Number(overId));

    let targetStage: KanbanStage;

    if (overLead) {
      targetStage = (overLead.status as KanbanStage) || "raw";
    } else {
      if (STAGES.some((s) => s.key === overId)) {
        targetStage = overId as KanbanStage;
      } else {
        return;
      }
    }

    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === targetStage) return;

    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: targetStage } : l)));

    const result = await moveLeadAction(leadId, targetStage);
    if (!result.success) {
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: lead.status as KanbanStage } : l)),
      );
      error(result.error || "Erro ao mover lead.");
    } else {
      const stageLabel = STAGES.find((s) => s.key === targetStage)?.label || targetStage;
      success(`Lead movido para "${stageLabel}"`);
    }
  }, [leads, error, success]);

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center animate-in fade-in zoom-in-95 duration-1000 border border-dashed border-zinc-800/50 rounded-3xl bg-zinc-900/20">
        <div className="w-24 h-24 bg-zinc-900/80 rounded-full flex items-center justify-center border border-zinc-800 mb-6 shadow-2xl ring-4 ring-zinc-900/50">
          <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-2xl font-black text-white mb-3">Mesa Limpa</h3>
        <p className="text-zinc-500 font-medium max-w-sm mx-auto leading-relaxed">
          Sua operação está pronta. Utilize o radar abaixo para capturar novos leads para esta campanha.
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {STAGES.map((stage, colIndex) => (
          <SortableContext
            key={stage.key}
            id={stage.key}
            items={leadsByStage[stage.key].map((l) => l.id)}
            strategy={verticalListSortingStrategy}
          >
            <KanbanColumn
              stage={stage}
              leads={leadsByStage[stage.key]}
              animationDelay={700 + colIndex * 150}
              isDragging={dragging}
            />
          </SortableContext>
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeLead ? (
          <div className="rotate-3 scale-105 opacity-90">
            <KanbanCard lead={activeLead} isDragOverlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
