"use client";

import { Globe, MapPin, Pencil, Phone, Search, Trash2, X, MessageSquare } from "lucide-react";
import { useState } from "react";
import { deleteLeadAction, updateLeadAction } from "@/app/actions";
import type { Lead } from "@/components/KanbanBoard";
import LeadDetailsDialog from "@/components/LeadDetailsDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { useToast } from "@/components/ui/toast";

const STATUS_COLORS: Record<string, string> = {
  raw: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  qualified: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  in_queue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  contacted: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  interested: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  discarded: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const STATUS_LABELS: Record<string, string> = {
  raw: "Novo",
  qualified: "Qualificado",
  in_queue: "Na Fila",
  contacted: "Contatado",
  interested: "Interessado",
  discarded: "Descartado",
};

interface EditDialogProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function EditDialog({ lead, open, onOpenChange, onSuccess }: EditDialogProps) {
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();
  const [form, setForm] = useState({
    name: lead.name,
    phone: lead.phone || "",
    website: lead.website || "",
    niche: lead.niche || "",
    city: lead.city || "",
    state: lead.state || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await updateLeadAction(lead.id, form);
    setLoading(false);
    if (result.success) {
      success("Lead atualizado com sucesso!");
      onOpenChange(false);
      onSuccess();
    } else {
      error(result.error || "Erro ao atualizar lead.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950/90 backdrop-blur-2xl border-zinc-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Editar Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-400 mb-1.5 block uppercase">Nome</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-zinc-900 border-zinc-800"
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-400 mb-1.5 block uppercase">
              Telefone
            </label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="bg-zinc-900 border-zinc-800"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-400 mb-1.5 block uppercase">
              Website
            </label>
            <Input
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              className="bg-zinc-900 border-zinc-800"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-zinc-400 mb-1.5 block uppercase">
                Nicho
              </label>
              <Input
                value={form.niche}
                onChange={(e) => setForm({ ...form, niche: e.target.value })}
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-400 mb-1.5 block uppercase">
                Cidade
              </label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-400 mb-1.5 block uppercase">
              Estado (UF)
            </label>
            <Input
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })}
              className="bg-zinc-900 border-zinc-800 w-24"
              maxLength={2}
            />
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-zinc-400"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/25 backdrop-blur-md hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40 hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer"
            >
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteDialogProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function DeleteDialog({ lead, open, onOpenChange, onSuccess }: DeleteDialogProps) {
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const handleDelete = async () => {
    setLoading(true);
    const result = await deleteLeadAction(lead.id);
    setLoading(false);
    if (result.success) {
      success("Lead deletado com sucesso!");
      onOpenChange(false);
      onSuccess();
    } else {
      error(result.error || "Erro ao deletar lead.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950/90 backdrop-blur-2xl border-zinc-800 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-red-400">Confirmar Exclusão</DialogTitle>
        </DialogHeader>
        <p className="text-zinc-300">
          Tem certeza que deseja deletar o lead <strong className="text-white">{lead.name}</strong>?
          Esta ação não pode ser desfeita.
        </p>
        <DialogFooter className="pt-4 gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-400">
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-500 text-white font-bold"
          >
            {loading ? "Deletando..." : "Sim, Deletar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface LeadsTableProps {
  leads: Lead[];
  onRefresh: () => void;
}

export function LeadsTable({ leads, onRefresh }: LeadsTableProps) {
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [deleteLead, setDeleteLead] = useState<Lead | null>(null);

  if (leads.length === 0) {
    return (
      <div className="text-center py-16 text-zinc-500">
        <p className="text-lg font-medium">Nenhum lead encontrado.</p>
        <p className="text-sm mt-1">Realize uma busca no dashboard para adicionar leads.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="group relative flex flex-col justify-between rounded-2xl bg-zinc-900/40 border border-zinc-800/50 p-5 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-[0_8px_30px_rgba(16,185,129,0.05)] transition-all duration-300 overflow-hidden"
          >
            {/* Background glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-transparent to-emerald-500/0 group-hover:from-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="relative z-10 space-y-4">
              {/* Header: Avatar + Status */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {lead.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={lead.imageUrl} alt={lead.name} className="w-10 h-10 rounded-xl object-cover shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0 border border-emerald-500/20" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-black font-black text-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0">
                      {lead.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-bold text-white leading-tight font-heading group-hover:text-emerald-400 transition-colors truncate">
                      {lead.name}
                    </h3>
                    {lead.niche && <p className="text-xs text-zinc-500 truncate">{lead.niche}</p>}
                  </div>
                </div>
              </div>

              {/* Status Badge moved below header to save space on small cards */}
              <div>
                <Badge
                  variant="outline"
                  className={`border ${STATUS_COLORS[lead.status || "raw"]} text-[10px] uppercase font-bold px-2 py-0.5`}
                >
                  {STATUS_LABELS[lead.status || "raw"]}
                </Badge>
              </div>

              {/* Info */}
              <div className="space-y-2 pt-2 border-t border-zinc-800/50">
                {lead.phone && (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Phone className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="truncate">{lead.phone}</span>
                  </div>
                )}
                {lead.website && (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Globe className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <a
                      href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-emerald-400 transition-colors truncate"
                    >
                      {lead.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
                {(lead.city || lead.state) && (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="truncate">
                      {lead.city}
                      {lead.city && lead.state ? ", " : ""}
                      {lead.state}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer: AI Score + Actions */}
            <div className="relative z-10 flex items-center justify-between pt-4 mt-4 border-t border-zinc-800/50">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Score
                </span>
                {lead.aiScore !== null && lead.aiScore !== undefined ? (
                  <span
                    className={`font-black text-sm ${
                      lead.aiScore >= 8
                        ? "text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]"
                        : lead.aiScore >= 5
                          ? "text-yellow-400"
                          : "text-red-400"
                    }`}
                  >
                    {lead.aiScore}/10
                  </span>
                ) : (
                  <span className="text-zinc-600 font-bold text-sm">—</span>
                )}
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <LeadDetailsDialog lead={lead}>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-7 w-7 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg"
                    title="Chat / Detalhes"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                  </Button>
                </LeadDetailsDialog>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setEditLead(lead)}
                  className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
                  title="Editar Lead"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setDeleteLead(lead)}
                  className="h-7 w-7 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                  title="Deletar Lead"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editLead && (
        <EditDialog
          lead={editLead}
          open={!!editLead}
          onOpenChange={(open) => !open && setEditLead(null)}
          onSuccess={onRefresh}
        />
      )}

      {deleteLead && (
        <DeleteDialog
          lead={deleteLead}
          open={!!deleteLead}
          onOpenChange={(open) => !open && setDeleteLead(null)}
          onSuccess={onRefresh}
        />
      )}
    </>
  );
}

interface LeadsFiltersProps {
  search: string;
  status: string;
  onSearchChange: (v: string) => void;
  onStatusChange: (v: string) => void;
}

export function LeadsFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: LeadsFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input
          placeholder="Buscar por nome, telefone, website..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-zinc-900 border-zinc-800"
        />
      </div>
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="h-8 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
      >
        <option value="">Todos os status</option>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      {search && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onSearchChange("")}
          className="text-zinc-500"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
