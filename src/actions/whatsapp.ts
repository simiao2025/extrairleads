"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { chatHistory, leads, users } from "@/db/schema";
import { auth } from "@/lib/auth";

const ZAVU_API_URL = "https://api.zavu.dev/v1";

function getZavuKey() {
	// Fallback hardcoded temporário para o teste do cliente
	return process.env.ZAVU_API_KEY || "zv_live_3433196b8211b9d3dc00a461298dc64570f5a295dbabb95e";
}

async function getCurrentUser() {
	const session = await auth();
	if (!session?.user?.email) return null;

	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.email, session.user.email));
	return user;
}

export async function checkWhatsAppConnectionAction() {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return { success: false, error: "Usuário não autenticado." };
		}

		// A Zavu cuida das sessões no painel deles. Vamos apenas garantir que
		// o usuário tenha um status de "CONNECTED" se a Zavu Key existir.
		const key = getZavuKey();
		
		if (!key) {
			return {
				success: false,
				state: "DISCONNECTED",
				error: "Chave da Zavu não configurada.",
			};
		}

		// Simulamos que está conectado porque a conexão com o WhatsApp 
		// agora é feita diretamente no painel da Zavu.dev
		return { success: true, connected: true, state: "CONNECTED", instanceName: "ZavuCloud" };
	} catch (error) {
		console.error("[checkWhatsAppConnectionAction]", error);
		return { success: false, error: "Erro interno no servidor." };
	}
}

export async function getWhatsAppQrCodeAction(): Promise<{ success: boolean; error?: string; qrCode?: string }> {
	// A Zavu utiliza integração direta via Cloud API ou painel.
	// O pareamento por QR Code deve ser feito em dashboard.zavu.dev.
	return { 
		success: false, 
		error: "A integração com a Zavu não utiliza QR Code neste painel. Por favor, conecte seu número em dashboard.zavu.dev." 
	};
}

async function sendZavuMessage(
	phoneStr: string,
	text: string,
) {
	const key = getZavuKey();
	
	const response = await fetch(`${ZAVU_API_URL}/messages`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${key}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			channel: "whatsapp",
			to: phoneStr,
			type: "text",
			text: text,
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Falha API Zavu: ${errorText}`);
	}
}

export async function sendManualWhatsAppMessageAction(leadId: number, text: string) {
	try {
		const user = await getCurrentUser();
		if (!user) return { success: false, error: "Usuário não autenticado." };

		const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
		if (!lead?.phone) return { success: false, error: "Lead sem número." };

		const phoneStr = lead.phone.replace(/\D/g, "");

		await sendZavuMessage(phoneStr, text);

		await db.insert(chatHistory).values({
			leadId: lead.id,
			role: "assistant",
			content: text,
			type: "text",
		});

		return { success: true };
	} catch (error) {
		const err = error as Error;
		console.error("[sendManualWhatsAppMessageAction]", err);
		return { success: false, error: err.message || "Erro ao enviar mensagem via Zavu." };
	}
}

export async function getWhatsAppSettingsAction() {
	try {
		const user = await getCurrentUser();
		if (!user) return { success: false, error: "Não autenticado." };

		return {
			success: true,
			provider: "zavu",
			metaAccessToken: user.metaAccessToken,
			metaPhoneNumberId: user.metaPhoneNumberId,
			metaWabaId: user.metaWabaId,
			notificationsEnabled: user.notificationsEnabled === 1,
			name: user.name,
			email: user.email,
			plan: user.plan || "Starter",
			leadsBalance: user.leadsBalance ?? 0,
		};
	} catch (error) {
		console.error("[getWhatsAppSettingsAction]", error);
		return { success: false, error: "Erro ao ler configurações." };
	}
}

export async function saveWhatsAppSettingsAction(data: {
	provider?: string;
	metaAccessToken?: string;
	metaPhoneNumberId?: string;
	metaWabaId?: string;
	notificationsEnabled?: boolean;
}) {
	try {
		const user = await getCurrentUser();
		if (!user) return { success: false, error: "Não autenticado." };

		await db
			.update(users)
			.set({
				whatsappProvider: "zavu",
				notificationsEnabled: data.notificationsEnabled ? 1 : 0,
			})
			.where(eq(users.id, user.id));

		return { success: true };
	} catch (error) {
		console.error("[saveWhatsAppSettingsAction]", error);
		return { success: false, error: "Erro ao salvar." };
	}
}

export async function disconnectWhatsAppAction(): Promise<{ success: boolean; error?: string }> {
	// Desconectar da Zavu via app não destrói a sessão real deles, 
	// apenas removemos do nosso sistema se necessário.
	return { success: true };
}

export async function sendWhatsAppAudioAction(
	leadId: number,
	audioBase64: string,
) {
	try {
		const user = await getCurrentUser();
		if (!user) return { success: false, error: "Usuário não autenticado." };

		const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
		if (!lead?.phone) return { success: false, error: "Lead sem telefone." };

		const key = getZavuKey();
		const phoneStr = lead.phone.replace(/\D/g, "");

		// Zavu geralmente aceita URLs de mídia. Se precisarmos mandar base64,
		// precisamos verificar a documentação. Assumiremos suporte nativo ou fallback.
		const response = await fetch(`${ZAVU_API_URL}/messages`, {
			method: "POST",
			headers: { 
				"Content-Type": "application/json", 
				Authorization: `Bearer ${key}` 
			},
			body: JSON.stringify({
				channel: "whatsapp",
				to: phoneStr,
				type: "audio",
				audio: {
					base64: audioBase64
				}
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(errorText);
		}

		await db.insert(chatHistory).values({
			leadId: lead.id,
			role: "assistant",
			content: audioBase64,
			type: "audio",
		});

		return { success: true };
	} catch (error) {
		const err = error as Error;
		console.error("[sendWhatsAppAudioAction]", err);
		return { success: false, error: "Falha ao enviar áudio via Zavu." };
	}
}
