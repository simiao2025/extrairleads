"use client";

import { useState } from "react";
import { Pencil, Trash2, Phone, Globe, MapPin, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { deleteLeadAction, updateLeadAction } from "@/app/actions";
import { useToast } from "@/components/ui/toast";
import type { Lead } from "@/components/KanbanBoard";

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
            <label className="text-xs font-bold text-zinc-400 mb-1.5 block uppercase">Telefone</label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="bg-zinc-900 border-zinc-800"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-400 mb-1.5 block uppercase">Website</label>
            <Input
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              className="bg-zinc-900 border-zinc-800"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-zinc-400 mb-1.5 block uppercase">Nicho</label>
              <Input
                value={form.niche}
                onChange={(e) => setForm({ ...form, niche: e.target.value })}
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-400 mb-1.5 block uppercase">Cidade</label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-400 mb-1.5 block uppercase">Estado (UF)</label>
            <Input
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })}
              className="bg-zinc-900 border-zinc-800 w-24"
              maxLength={2}
            />
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-400">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold">
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
          Tem certeza que deseja deletar o lead <strong className="text-white">{lead.name}</strong>? Esta ação não pode ser desfeita.
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
      <div className="rounded-xl border border-zinc-800/50 w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800/50 hover:bg-zinc-900/50">
              <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Nome</TableHead>
              <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Contato</TableHead>
              <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Localização</TableHead>
              <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Nicho</TableHead>
              <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Score IA</TableHead>
              <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
              <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id} className="border-zinc-800/30 hover:bg-zinc-900/30">
                <TableCell className="font-medium text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-xs text-black font-black">
                      {lead.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="truncate max-w-[200px]">{lead.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-zinc-400">
                  <div className="flex flex-col gap-1">
                    {lead.phone && (
                      <span className="flex items-center gap-1.5 text-xs">
                        <Phone className="h-3 w-3" />
                        {lead.phone}
                      </span>
                    )}
                    {lead.website && (
                      <span className="flex items-center gap-1.5 text-xs">
                        <Globe className="h-3 w-3" />
                        <a href={lead.website} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors truncate max-w-[150px]">
                          Website
                        </a>
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-zinc-400 text-sm">
                  {lead.city && lead.state ? (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" />
                      {lead.city}, {lead.state}
                    </span>
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-zinc-900/50 border-zinc-800 text-zinc-300">
                    {lead.niche || "—"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {lead.aiScore !== null && lead.aiScore !== undefined ? (
                    <span className={`font-bold text-sm ${
                      lead.aiScore >= 8 ? "text-emerald-400" :
                      lead.aiScore >= 5 ? "text-yellow-400" : "text-red-400"
                    }`}>
                      {lead.aiScore}/10
                    </span>
                  ) : (
                    <span className="text-zinc-600 text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`border ${STATUS_COLORS[lead.status || "raw"]}`}
                  >
                    {STATUS_LABELS[lead.status || "raw"]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setEditLead(lead)}
                      className="text-zinc-500 hover:text-white"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setDeleteLead(lead)}
                      className="text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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

export function LeadsFilters({ search, status, onSearchChange, onStatusChange }: LeadsFiltersProps) {
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
          <option key={key} value={key}>{label}</option>
        ))}
      </select>
      {search && (
        <Button variant="ghost" size="icon-sm" onClick={() => onSearchChange("")} className="text-zinc-500">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}