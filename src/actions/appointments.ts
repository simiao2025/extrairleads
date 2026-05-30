"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { appointments, leads } from "@/db/schema";

export async function getAppointmentsAction() {
	return db
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
}

export async function createAppointmentAction(data: {
	leadId: number;
	scheduledAt: Date;
	status?: string;
	notes?: string;
}) {
	try {
		const [lead] = await db
			.select()
			.from(leads)
			.where(eq(leads.id, data.leadId));
		if (!lead) return { success: false, error: "Lead não encontrado." };

		await db.insert(appointments).values({
			leadId: data.leadId,
			scheduledAt: data.scheduledAt,
			status: data.status || "confirmed",
			notes: data.notes || null,
		});

		revalidatePath("/appointments");
		return { success: true };
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		return { success: false, error: message };
	}
}

export async function updateAppointmentAction(
	appointmentId: number,
	data: {
		scheduledAt?: Date;
		status?: string;
		notes?: string;
	},
) {
	try {
		const [apt] = await db
			.select()
			.from(appointments)
			.where(eq(appointments.id, appointmentId));
		if (!apt) return { success: false, error: "Agendamento não encontrado." };

		await db
			.update(appointments)
			.set(data)
			.where(eq(appointments.id, appointmentId));
		revalidatePath("/appointments");
		return { success: true };
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		return { success: false, error: message };
	}
}

export async function deleteAppointmentAction(appointmentId: number) {
	try {
		const [apt] = await db
			.select()
			.from(appointments)
			.where(eq(appointments.id, appointmentId));
		if (!apt) return { success: false, error: "Agendamento não encontrado." };

		await db.delete(appointments).where(eq(appointments.id, appointmentId));
		revalidatePath("/appointments");
		return { success: true };
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		return { success: false, error: message };
	}
}

export async function getLeadsForAppointmentAction() {
	return db
		.select({
			id: leads.id,
			name: leads.name,
			phone: leads.phone,
			niche: leads.niche,
		})
		.from(leads)
		.where(eq(leads.status, "interested"));
}
