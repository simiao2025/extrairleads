import Link from "next/link";
import { db } from "@/db";
import { appointments, leads } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar } from "lucide-react";
import { desc, eq } from "drizzle-orm";
import { AppointmentsClient } from "./client";

export default async function AppointmentsPage() {
  const appointmentsData = await db
    .select({
      id: appointments.id,
      leadId: appointments.leadId,
      scheduledAt: appointments.scheduledAt,
      status: appointments.status,
      notes: appointments.notes,
      createdAt: appointments.createdAt,
      leadName: leads.name,
      leadPhone: leads.phone,
      leadNiche: leads.niche,
    })
    .from(appointments)
    .leftJoin(leads, eq(appointments.leadId, leads.id))
    .orderBy(desc(appointments.scheduledAt));

  const availableLeads = await db
    .select({ id: leads.id, name: leads.name, phone: leads.phone, niche: leads.niche })
    .from(leads)
    .where(eq(leads.status, "interested"));

  return (
    <main className="min-h-screen bg-[#09090b] text-white p-4 md:p-8 pt-12">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon-sm" className="text-zinc-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Calendar className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">Agendamentos</h1>
                <p className="text-sm text-zinc-500">{appointmentsData.length} agendamentos</p>
              </div>
            </div>
          </div>
        </div>

        <AppointmentsClient
          initialAppointments={appointmentsData}
          availableLeads={availableLeads}
        />
      </div>
    </main>
  );
}