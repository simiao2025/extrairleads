"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Calendar, CheckCircle, XCircle, Clock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createAppointmentAction,
  updateAppointmentAction,
  deleteAppointmentAction,
} from "@/app/actions";
import { useToast } from "@/components/ui/toast";

interface Appointment {
  id: number;
  leadId: number | null;
  scheduledAt: Date | string | null;
  status: string | null;
  notes: string | null;
  createdAt: Date | string | null;
  leadName: string | null;
  leadPhone: string | null;
  leadNiche: string | null;
}

interface LeadOption {
  id: number;
  name: string;
  phone: string | null;
  niche: string | null;
}

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment | null;
  leads: LeadOption[];
  onSuccess: () => void;
}

function AppointmentDialog({ open, onOpenChange, appointment, leads, onSuccess }: AppointmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();
  const [form, setForm] = useState({
    leadId: appointment?.leadId?.toString() || "",
    date: appointment?.scheduledAt ? new Date(appointment.scheduledAt).toISOString().split("T")[0] : "",
    time: appointment?.scheduledAt ? new Date(appointment.scheduledAt).toTimeString().slice(0, 5) : "",
    notes: appointment?.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const scheduledAt = new Date(`${form.date}T${form.time || "09:00"}`);

    const result = appointment?.id
      ? await updateAppointmentAction(appointment.id, { scheduledAt, notes: form.notes })
      : await createAppointmentAction({ leadId: parseInt(form.leadId), scheduledAt, notes: form.notes });

    setLoading(false);
    if (result.success) {
      success(appointment?.id ? "Agendamento atualizado!" : "Agendamento criado!");
      onOpenChange(false);
      onSuccess();
    } else {
      error(result.error || "Erro ao salvar agendamento.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950/90 backdrop-blur-2xl border-zinc-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">
            {appointment?.id ? "Editar Agendamento" : "Novo Agendamento"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!appointment && (
            <div>
              <Label className="text-xs font-bold text-zinc-400 mb-1.5 block uppercase">Lead</Label>
              <select
                value={form.leadId}
                onChange={(e) => setForm({ ...form, leadId: e.target.value })}
                className="w-full h-9 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                required
              >
                <option value="">Selecione um lead...</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id.toString()}>
                    {lead.name} {lead.phone ? `(${lead.phone})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold text-zinc-400 mb-1.5 block uppercase">Data</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="bg-zinc-900 border-zinc-800"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-zinc-400 mb-1.5 block uppercase">Hora</Label>
              <Input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold text-zinc-400 mb-1.5 block uppercase">Notas</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="bg-zinc-900 border-zinc-800 min-h-[80px]"
              placeholder="Anotações sobre o agendamento..."
            />
          </div>

          <DialogFooter className="pt-4 gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-400">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold">
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteDialogProps {
  appointment: Appointment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function DeleteDialog({ appointment, open, onOpenChange, onSuccess }: DeleteDialogProps) {
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const handleDelete = async () => {
    setLoading(true);
    const result = await deleteAppointmentAction(appointment.id);
    setLoading(false);
    if (result.success) {
      success("Agendamento deletado!");
      onOpenChange(false);
      onSuccess();
    } else {
      error(result.error || "Erro ao deletar.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950/90 backdrop-blur-2xl border-zinc-800 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-red-400">Confirmar Exclusão</DialogTitle>
        </DialogHeader>
        <p className="text-zinc-300">
          Tem certeza que deseja deletar este agendamento?
        </p>
        <DialogFooter className="pt-4 gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-400">
            Cancelar
          </Button>
          <Button onClick={handleDelete} disabled={loading} className="bg-red-600 hover:bg-red-500 text-white font-bold">
            {loading ? "Deletando..." : "Sim, Deletar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AppointmentsClientProps {
  initialAppointments: Appointment[];
  availableLeads: LeadOption[];
}

export function AppointmentsClient({ initialAppointments, availableLeads }: AppointmentsClientProps) {
  const [appointments] = useState(initialAppointments);
  const [editAppointment, setEditAppointment] = useState<Appointment | null>(null);
  const [deleteAppointment, setDeleteAppointment] = useState<Appointment | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  function handleRefresh() {
    window.location.reload();
  }

  const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
    confirmed: { icon: CheckCircle, color: "text-emerald-400", label: "Confirmado" },
    canceled: { icon: XCircle, color: "text-red-400", label: "Cancelado" },
    rescheduled: { icon: Clock, color: "text-yellow-400", label: "Reagendado" },
  };

  if (appointments.length === 0 && !showCreate) {
    return (
      <>
        <div className="text-center py-16">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900/80 border border-zinc-800 mb-4">
            <Calendar className="h-8 w-8 text-zinc-600" />
          </div>
          <h3 className="text-lg font-bold text-zinc-300 mb-2">Nenhum agendamento</h3>
          <p className="text-sm text-zinc-500 mb-6">Crie seu primeiro agendamento para acompanhar seus leads interessados.</p>
          <Button onClick={() => setShowCreate(true)} className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold">
            <Plus className="w-4 h-4 mr-2" />
            Criar Agendamento
          </Button>
        </div>

        <AppointmentDialog
          open={showCreate}
          onOpenChange={setShowCreate}
          leads={availableLeads}
          onSuccess={handleRefresh}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(true)} className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold">
          <Plus className="w-4 h-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {appointments.map((apt) => {
          const status = statusConfig[apt.status || "confirmed"] || statusConfig.confirmed;
          const StatusIcon = status.icon;
          const scheduledDate = apt.scheduledAt ? new Date(apt.scheduledAt) : null;

          return (
            <Card key={apt.id} className="border-zinc-800/50 bg-zinc-950/40 hover:border-zinc-700/50 transition-colors">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`h-4 w-4 ${status.color}`} />
                    <span className={`text-xs font-bold ${status.color}`}>{status.label}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setEditAppointment(apt)}
                      className="text-zinc-500 hover:text-white"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setDeleteAppointment(apt)}
                      className="text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {apt.leadName && (
                  <div>
                    <p className="font-bold text-white">{apt.leadName}</p>
                    {apt.leadPhone && (
                      <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" />
                        {apt.leadPhone}
                      </p>
                    )}
                  </div>
                )}

                {scheduledDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-zinc-500" />
                    <span className="text-zinc-300">
                      {scheduledDate.toLocaleDateString("pt-BR", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                      {" às "}
                      {scheduledDate.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}

                {apt.notes && (
                  <p className="text-xs text-zinc-400 bg-zinc-900/50 rounded-lg p-2 border border-zinc-800/50">
                    {apt.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AppointmentDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        leads={availableLeads}
        onSuccess={handleRefresh}
      />

      {editAppointment && (
        <AppointmentDialog
          open={!!editAppointment}
          onOpenChange={(open) => !open && setEditAppointment(null)}
          appointment={editAppointment}
          leads={availableLeads}
          onSuccess={handleRefresh}
        />
      )}

      {deleteAppointment && (
        <DeleteDialog
          open={!!deleteAppointment}
          onOpenChange={(open) => !open && setDeleteAppointment(null)}
          appointment={deleteAppointment}
          onSuccess={handleRefresh}
        />
      )}
    </>
  );
}