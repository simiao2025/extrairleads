"use server";

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { chatHistory, leads, users } from "@/db/schema";
import { auth } from "@/lib/auth";

function getGlobalKey() {
	const key = process.env.EVOLUTION_GLOBAL_API_KEY;
	if (!key) {
		throw new Error(
			"EVOLUTION_GLOBAL_API_KEY não está configurada no ambiente (Risco de Segurança).",
		);
	}
	return key;
}

function getBaseWebhookUrl(token: string) {
	const baseUrl =
		process.env.APP_URL || "https://extrairleads.brasilonthebox.shop";
	return `${baseUrl}/api/webhook/whatsapp?secret=${token}`;
}

// Auxiliar para obter dados do usuário logado
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

		if (!user.cpfCnpj && !user.whatsappInstanceName) {
			return {
				success: false,
				state: "DISCONNECTED",
				error: "Conclua o onboarding para criar a instância.",
			};
		}

		const instanceName =
			user.whatsappInstanceName || user.cpfCnpj?.toString().replace(/\D/g, "");

		if (!instanceName) {
			return {
				success: false,
				error: "Falha catastrófica ao gerar nome da instância.",
			};
		}

		const evolutionUrl = process.env.EVOLUTION_API_URL;
		if (!evolutionUrl) {
			return {
				success: false,
				error:
					"Serviço de WhatsApp temporariamente fora de serviço (URL não configurada).",
			};
		}

		const globalKey = getGlobalKey();

		const response = await fetch(`${evolutionUrl}/instance/all`, {
			method: "GET",
			headers: { apikey: globalKey },
		});

		if (!response.ok) {
			await response.text();
			return { success: false, error: "Erro ao ler status no servidor." };
		}

		const resJson = await response.json();
		const instancesList = resJson?.data || [];
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const foundInstance = instancesList.find(
			(inst: any) => inst.name === instanceName,
		);

		if (!foundInstance) {
			// Instância não existe no servidor (pode ter sido apagada).
			// Gera um novo token; NUNCA reutilizar o token salvo pois a instância não existe mais.
			const newToken = randomBytes(32).toString("hex");
			const webhookUrl = getBaseWebhookUrl(newToken);

			console.log(
				`[checkWhatsApp] Instância "${instanceName}" não encontrada. Recriando...`,
			);

			const createRes = await fetch(`${evolutionUrl}/instance/create`, {
				method: "POST",
				headers: {
					apikey: globalKey,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					instanceName: instanceName,
					name: instanceName,
					token: newToken,
					qrcode: true,
					integration: "WHATSAPP-BAILEYS",
					webhook: {
						url: webhookUrl,
						enabled: true,
						events: ["MESSAGES_UPSERT"],
					},
				}),
			});

			if (!createRes.ok) {
				const errorText = await createRes.text();
				console.error(
					`[checkWhatsApp] Falha ao recriar instância: ${createRes.status} ${errorText}`,
				);
				return {
					success: false,
					error:
						"Falha ao recriar instância do WhatsApp. Tente novamente ou entre em contato com o suporte.",
				};
			}

			const createData = await createRes.json();
			// Evolution v3 Go retorna o apikey real no campo hash.apikey
			const actualToken =
				createData.hash?.apikey || createData.instance?.apikey || newToken;

			// Se o token real for diferente do que enviamos, reconfigura o webhook com o token correto
			if (actualToken !== newToken) {
				const actualWebhookUrl = getBaseWebhookUrl(actualToken);
				try {
					await fetch(`${evolutionUrl}/webhook/set/${instanceName}`, {
						method: "POST",
						headers: {
							apikey: globalKey,
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							webhook: {
								url: actualWebhookUrl,
								enabled: true,
								events: ["MESSAGES_UPSERT"],
							},
						}),
					});
				} catch (e) {
					console.error("[checkWhatsApp] Falha ao atualizar webhook:", e);
				}
			}

			// Salva o novo token no banco — SEMPRE substitui o antigo
			await db
				.update(users)
				.set({
					whatsappInstanceName: instanceName,
					whatsappInstanceToken: actualToken,
				})
				.where(eq(users.id, user.id));

			console.log(
				`[checkWhatsApp] Instância "${instanceName}" recriada com sucesso.`,
			);

			return { success: true, connected: false, state: "DISCONNECTED" };
		}

		// Instância encontrada no servidor — sincroniza o token
		const serverToken = foundInstance.token;
		if (
			user.whatsappInstanceToken !== serverToken ||
			user.whatsappInstanceName !== instanceName
		) {
			await db
				.update(users)
				.set({
					whatsappInstanceName: instanceName,
					whatsappInstanceToken: serverToken,
				})
				.where(eq(users.id, user.id));
		}

		// Garante que o webhook está configurado corretamente
		try {
			const webhookUrl = getBaseWebhookUrl(serverToken);
			await fetch(`${evolutionUrl}/webhook/set/${instanceName}`, {
				method: "POST",
				headers: {
					apikey: globalKey,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					webhook: {
						url: webhookUrl,
						enabled: true,
						events: ["MESSAGES_UPSERT"],
					},
				}),
			});
		} catch (e) {
			console.error("Erro ao configurar Webhook da Evolution API:", e);
		}

		const connected = foundInstance.connected === true;
		const state = connected ? "CONNECTED" : "DISCONNECTED";

		return { success: true, connected, state, instanceName };
	} catch (error) {
		console.error("[checkWhatsAppConnectionAction]", error);
		return { success: false, error: "Erro interno no servidor." };
	}
}

export async function getWhatsAppQrCodeAction() {
	try {
		let user = await getCurrentUser();
		if (!user) return { success: false, error: "Usuário não autenticado." };

		const instanceName = user.whatsappInstanceName;
		if (!instanceName)
			return { success: false, error: "Nenhuma instância ativa." };

		const evolutionUrl = process.env.EVOLUTION_API_URL;
		if (!evolutionUrl) return { success: false, error: "URL não configurada." };

		const globalKey = getGlobalKey();

		const listRes = await fetch(`${evolutionUrl}/instance/all`, {
			method: "GET",
			headers: { apikey: globalKey },
		});

		let token = user.whatsappInstanceToken;
		let instanceExists = false;

		if (listRes.ok) {
			const listData = await listRes.json();
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const found = listData?.data?.find(
				(inst: any) => inst.name === instanceName,
			);
			if (found) {
				instanceExists = true;
				token = found.token;
				if (user.whatsappInstanceToken !== token) {
					await db
						.update(users)
						.set({ whatsappInstanceToken: token })
						.where(eq(users.id, user.id));
				}
			}
		}

		// Se a instância não existe (apagada externamente), recria via checkWhatsAppConnectionAction
		if (!instanceExists) {
			console.log(
				`[getWhatsAppQrCode] Instância "${instanceName}" não encontrada. Recriando...`,
			);
			const recreateResult = await checkWhatsAppConnectionAction();
			if (!recreateResult.success) {
				return {
					success: false,
					error:
						recreateResult.error ||
						"Falha ao recriar instância. Tente novamente.",
				};
			}

			// Re-lê o usuário do banco para pegar o novo token
			user = (await getCurrentUser())!;
			if (!user) return { success: false, error: "Usuário não autenticado." };
			token = user.whatsappInstanceToken;
		}

		if (!token) return { success: false, error: "Token não encontrado." };

		const response = await fetch(`${evolutionUrl}/instance/qr`, {
			method: "GET",
			headers: { apikey: token, instance: instanceName },
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(
				`[getWhatsAppQrCode] Erro ao gerar QR: ${response.status} ${errorText}`,
			);
			return { success: false, error: "Não foi possível gerar QR." };
		}

		const resJson = await response.json();
		const qrImage =
			resJson?.data?.Qrcode ||
			resJson?.base64 ||
			resJson?.qrcode?.base64 ||
			resJson?.code;

		if (!qrImage) return { success: false, error: "QR code vazio." };

		return { success: true, qrCode: qrImage, instanceName };
	} catch (error) {
		console.error("[getWhatsAppQrCodeAction]", error);
		return { success: false, error: "Erro interno." };
	}
}

async function sendMetaMessage(
	metaPhoneNumberId: string,
	metaAccessToken: string,
	phoneStr: string,
	text: string,
) {
	const metaResponse = await fetch(
		`https://graph.facebook.com/v19.0/${metaPhoneNumberId}/messages`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${metaAccessToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				messaging_product: "whatsapp",
				recipient_type: "individual",
				to: phoneStr,
				type: "text",
				text: { preview_url: false, body: text },
			}),
		},
	);

	if (!metaResponse.ok) {
		const errorText = await metaResponse.text();
		throw new Error(`Falha API Meta: ${errorText}`);
	}
}

async function sendEvolutionMessage(
	instanceName: string,
	instanceToken: string,
	phoneStr: string,
	text: string,
	leadId: number,
	aiAnalysis?: string | null,
) {
	const evolutionUrl = process.env.EVOLUTION_API_URL;
	if (!evolutionUrl) throw new Error("WhatsApp Evolution não configurado.");

	const sendPayload = {
		instance: instanceName,
		number: phoneStr,
		text,
		delay: 1200,
	};

	const headers = {
		"Content-Type": "application/json",
		apikey: instanceToken,
	};

	let response = await fetch(`${evolutionUrl}/send/text`, {
		method: "POST",
		headers,
		body: JSON.stringify(sendPayload),
	});

	if (!response.ok) {
		let errorText = await response.text();
		if (errorText.includes("is not registered") && phoneStr.startsWith("55")) {
			let retryPhone = "";
			if (phoneStr.length === 12)
				retryPhone = `${phoneStr.substring(0, 4)}9${phoneStr.substring(4)}`;
			else if (phoneStr.length === 13)
				retryPhone = phoneStr.substring(0, 4) + phoneStr.substring(5);

			if (retryPhone) {
				sendPayload.number = retryPhone;
				response = await fetch(`${evolutionUrl}/send/text`, {
					method: "POST",
					headers,
					body: JSON.stringify(sendPayload),
				});
				if (!response.ok) errorText = await response.text();
			}
		}

		if (!response.ok) {
			if (errorText.includes("is not registered")) {
				await db
					.update(leads)
					.set({
						status: "discarded",
						aiAnalysis: aiAnalysis
							? aiAnalysis +
								"\n\n[SISTEMA] Lead descartado automaticamente: Número não possui WhatsApp ativo."
							: "[SISTEMA] Lead descartado automaticamente: Número não possui WhatsApp ativo.",
					})
					.where(eq(leads.id, leadId));
				throw new Error(
					"Este número não possui WhatsApp ativo. Lead descartado.",
				);
			}
			throw new Error(`Falha API WhatsApp: ${errorText}`);
		}
	}
}

export async function sendManualWhatsAppMessageAction(
	leadId: number,
	text: string,
) {
	try {
		const user = await getCurrentUser();
		if (!user) return { success: false, error: "Usuário não autenticado." };

		const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
		if (!lead?.phone) return { success: false, error: "Lead sem número." };

		const provider = user.whatsappProvider || "evolution";
		const phoneStr = lead.phone.replace(/\D/g, "");

		if (provider === "meta_official") {
			if (!user.metaAccessToken || !user.metaPhoneNumberId) {
				return { success: false, error: "Credenciais Meta não configuradas." };
			}
			await sendMetaMessage(
				user.metaPhoneNumberId,
				user.metaAccessToken,
				phoneStr,
				text,
			);
		} else {
			if (!user.whatsappInstanceName || !user.whatsappInstanceToken) {
				return { success: false, error: "WhatsApp Evolution não configurado." };
			}
			await sendEvolutionMessage(
				user.whatsappInstanceName,
				user.whatsappInstanceToken,
				phoneStr,
				text,
				lead.id,
				lead.aiAnalysis,
			);
		}

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
		return { success: false, error: err.message || "Erro ao enviar mensagem." };
	}
}

export async function getWhatsAppSettingsAction() {
	try {
		const user = await getCurrentUser();
		if (!user) return { success: false, error: "Não autenticado." };

		return {
			success: true,
			provider: user.whatsappProvider || "evolution",
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
	provider: "evolution" | "meta_official";
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
				whatsappProvider: data.provider,
				metaAccessToken: data.metaAccessToken || null,
				metaPhoneNumberId: data.metaPhoneNumberId || null,
				metaWabaId: data.metaWabaId || null,
				notificationsEnabled: data.notificationsEnabled ? 1 : 0,
			})
			.where(eq(users.id, user.id));

		return { success: true };
	} catch (error) {
		console.error("[saveWhatsAppSettingsAction]", error);
		return { success: false, error: "Erro ao salvar." };
	}
}

export async function disconnectWhatsAppAction() {
	try {
		const user = await getCurrentUser();
		if (!user) throw new Error("Não autorizado");
		if (!user.whatsappInstanceName) return { success: true };

		const instanceName = user.whatsappInstanceName;
		const token = user.whatsappInstanceToken || getGlobalKey();
		const evolutionUrl =
			process.env.EVOLUTION_API_URL ||
			"https://evolution-api.brasilonthebox.shop";

		try {
			await fetch(`${evolutionUrl}/instance/logout/${instanceName}`, {
				method: "DELETE",
				headers: { apikey: token },
			});
			await fetch(`${evolutionUrl}/instance/delete/${instanceName}`, {
				method: "DELETE",
				headers: { apikey: getGlobalKey() },
			});
		} catch (e) {
			console.error("Falha ao remover da Evolution API:", e);
		}

		await db
			.update(users)
			.set({ whatsappInstanceName: null, whatsappInstanceToken: null })
			.where(eq(users.id, user.id));

		return { success: true };
	} catch (error) {
		console.error("[disconnectWhatsAppAction]", error);
		return { success: false, error: "Falha ao desconectar." };
	}
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

		const instanceName = user.whatsappInstanceName;
		const instanceToken = user.whatsappInstanceToken;
		const evolutionUrl =
			process.env.EVOLUTION_API_URL ||
			"https://evolution-api.brasilonthebox.shop";

		if (!evolutionUrl || !instanceName || !instanceToken) {
			return { success: false, error: "WhatsApp Evolution não configurado." };
		}

		const phoneStr = lead.phone.replace(/\D/g, "");

		const response = await fetch(`${evolutionUrl}/send/audio`, {
			method: "POST",
			headers: { "Content-Type": "application/json", apikey: instanceToken },
			body: JSON.stringify({
				instance: instanceName,
				number: phoneStr,
				audio: audioBase64,
				encoding: true,
				delay: 1200,
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
		return { success: false, error: "Falha ao enviar áudio." };
	}
}
