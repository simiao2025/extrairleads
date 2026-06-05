import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { and, sql as drizzleSql, eq, gte } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/db";
import { chatHistory, leads, users } from "@/db/schema";
import { getCachedAudio, saveCachedAudio } from "@/lib/cache";
import { processAIResponse } from "@/services/ai-agent";
import { normalizeEvolutionPayload } from "@/services/evolution-parser";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function findOrCreateLead(phone: string, ownerUserId: number | null) {
	const rawPhone = phone.replace(/\D/g, "");

	let [lead] = await db
		.select()
		.from(leads)
		.where(
			drizzleSql`regexp_replace(${leads.phone}, '\\D', '', 'g') = ${rawPhone}`,
		);

	if (!lead) {
		const [newLead] = await db
			.insert(leads)
			.values({
				userId: ownerUserId,
				phone: rawPhone,
				name: "Contato WhatsApp",
				status: "raw",
			})
			.returning();
		lead = newLead;
	}
	return lead;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function extractMessageContent(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	messagePayload: any,
	messageType: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	rawData: any,
	instanceName: string,
	instanceToken: string,
	evolutionUrl: string,
): Promise<{ textContent: string; base64Audio: string | null }> {
	const conversation = messagePayload.conversation;
	const extendedText = messagePayload.extendedTextMessage?.text;
	const audioMessage = messagePayload.audioMessage;

	if (conversation) return { textContent: conversation, base64Audio: null };
	if (extendedText) return { textContent: extendedText, base64Audio: null };

	if (audioMessage || messageType === "audio") {
		try {
			const downloadUrl = `${evolutionUrl}/media/download/${instanceName}`;
			const mediaRes = await fetch(downloadUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json", apikey: instanceToken },
				body: JSON.stringify({ message: rawData }),
			});

			if (mediaRes.ok) {
				const mediaData = await mediaRes.json();
				const base64Audio = mediaData.base64 || mediaData?.data?.base64 || null;

				if (base64Audio) {
					const buffer = Buffer.from(base64Audio, "base64");
					// Correção de segurança: tmpdir e UUID
					const tempFile = path.join(
						os.tmpdir(),
						`audio-${crypto.randomUUID()}.mp3`,
					);
					fs.writeFileSync(tempFile, buffer);

					const transcriptionResponse =
						await openai.audio.transcriptions.create({
							file: fs.createReadStream(tempFile),
							model: "whisper-1",
						});

					const textContent = transcriptionResponse.text;

					try {
						fs.unlinkSync(tempFile);
					} catch (e) {
						console.error("Falha ao remover arquivo temporário", e);
					}

					return {
						textContent,
						base64Audio: `data:audio/mp3;base64,${base64Audio}`,
					};
				}
			}
		} catch (err) {
			console.error("[extractMessageContent] Erro:", err);
		}
	}

	return { textContent: "", base64Audio: null };
}

async function sendWhatsAppReply({
	shouldReplyAudio,
	aiResponseText,
	instanceName,
	phone,
	instanceToken,
	evolutionUrl,
}: {
	shouldReplyAudio: boolean;
	aiResponseText: string;
	instanceName: string;
	phone: string;
	instanceToken: string;
	evolutionUrl: string;
}) {
	if (shouldReplyAudio) {
		try {
			let base64Audio = await getCachedAudio(aiResponseText);

			if (!base64Audio) {
				const mp3 = await openai.audio.speech.create({
					model: "tts-1",
					voice: "alloy",
					input: aiResponseText,
				});

				const arrayBuf = await mp3.arrayBuffer();
				base64Audio = Buffer.from(arrayBuf).toString("base64");
				await saveCachedAudio(aiResponseText, base64Audio);
			}

			await fetch(`${evolutionUrl}/send/audio`, {
				method: "POST",
				headers: { "Content-Type": "application/json", apikey: instanceToken },
				body: JSON.stringify({
					instance: instanceName,
					number: phone,
					audio: base64Audio,
					ptt: true,
					encoding: true,
					delay: 1500,
				}),
			});
			return;
		} catch (err) {
			console.error("[sendWhatsAppReply] Erro no TTS:", err);
		}
	}

	const blocks = aiResponseText
		.split(/\n\n+/)
		.map((b) => b.trim())
		.filter((b) => b.length > 0);

	for (let i = 0; i < blocks.length; i++) {
		const block = blocks[i];
		const typingDelay = Math.min(3000, Math.max(1000, block.length * 35));

		await fetch(`${evolutionUrl}/send/text`, {
			method: "POST",
			headers: { "Content-Type": "application/json", apikey: instanceToken },
			body: JSON.stringify({
				instance: instanceName,
				number: phone,
				text: block,
				delay: typingDelay,
			}),
		});

		if (i < blocks.length - 1) {
			await sleep(typingDelay + 300);
		}
	}
}

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ slug?: string[] }> },
) {
	try {
		const body = await req.json();
		let eventName = (body.event || "").toUpperCase();

		try {
			const resolvedParams = await params;
			if (resolvedParams?.slug && resolvedParams.slug.length > 0) {
				const slugEvent = resolvedParams.slug[0].toUpperCase();
				if (!eventName || slugEvent.includes("MESSAGE")) {
					eventName = slugEvent;
				}
			}
		} catch (err) {
			console.error("Falha ao extrair slug", err);
		}

		if (!eventName.includes("MESSAGE")) {
			return NextResponse.json({ ok: true });
		}

		const rawInstanceName = body.instanceName || body.instance || "";

		const [owner] = rawInstanceName
			? await db
					.select()
					.from(users)
					.where(eq(users.whatsappInstanceName, rawInstanceName))
			: [];

		const instanceTokenFallback =
			owner?.whatsappInstanceToken || process.env.EVOLUTION_API_KEY || "";

		// AUTENTICAÇÃO DO WEBHOOK (Security)
		const secretParam = req.nextUrl.searchParams.get("secret");
		if (owner?.whatsappInstanceToken) {
			if (secretParam !== owner.whatsappInstanceToken) {
				console.warn(
					`[Security] Webhook bloqueado. Instância: ${rawInstanceName}. Secret inválido.`,
				);
				return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
			}
		}

		const normalized = normalizeEvolutionPayload(body, instanceTokenFallback);
		if (!normalized?.remoteJid || !normalized.instanceName) {
			return NextResponse.json({ ok: true, error: "Payload inválido" });
		}

		const {
			instanceName,
			instanceToken,
			remoteJid,
			isFromMe,
			messageType,
			messagePayload,
			rawData,
		} = normalized;
		const phone = remoteJid.split("@")[0];

		if (remoteJid.includes("@g.us")) {
			return NextResponse.json({ ok: true });
		}

		const evolutionUrl =
			process.env.EVOLUTION_API_URL ||
			"https://evolution-api.brasilonthebox.shop";
		const ownerUserId = owner?.id || null;
		const resolvedToken =
			owner?.whatsappInstanceToken || instanceToken || instanceTokenFallback;

		const lead = await findOrCreateLead(phone, ownerUserId);

		const extracted = await extractMessageContent(
			messagePayload,
			messageType,
			rawData,
			instanceName,
			resolvedToken,
			evolutionUrl,
		);

		const { textContent, base64Audio } = extracted;
		if (!textContent.trim() && !base64Audio) {
			return NextResponse.json({ ok: true });
		}

		if (isFromMe) {
			const fifteenSecondsAgo = new Date(Date.now() - 15000);
			const [existingMsg] = await db
				.select()
				.from(chatHistory)
				.where(
					and(
						eq(chatHistory.leadId, lead.id),
						eq(chatHistory.role, "assistant"),
						eq(chatHistory.content, textContent),
						gte(chatHistory.createdAt, fifteenSecondsAgo),
					),
				);

			if (!existingMsg) {
				await db.insert(chatHistory).values({
					leadId: lead.id,
					role: "assistant",
					content: textContent,
					audioBase64: base64Audio,
					type: messageType === "audio" ? "audio" : "text",
				});
			}
			return NextResponse.json({ ok: true });
		}

		await db.insert(chatHistory).values({
			leadId: lead.id,
			role: "user",
			content: textContent,
			audioBase64: base64Audio,
			type: messageType === "audio" ? "audio" : "text",
		});

		(async () => {
			try {
				await db.execute(drizzleSql`
					UPDATE chat_history 
					SET audio_base64 = NULL 
					WHERE role = 'user' AND type = 'audio' AND audio_base64 IS NOT NULL
					AND created_at < NOW() - INTERVAL '24 HOURS'
				`);
			} catch (e) {
				console.error("Erro no cleanup de áudio:", e);
			}
		})();

		// DELEGA PARA O AGENT AI EXTERNALIZADO (Code Purity)
		const { aiResponseText, forceAudio } = await processAIResponse(
			lead,
			textContent,
			ownerUserId,
		);

		if (!aiResponseText?.trim()) {
			return NextResponse.json({ ok: true });
		}

		const shouldReplyAudio =
			(messageType === "audio" || forceAudio) && !!process.env.OPENAI_API_KEY;

		await sendWhatsAppReply({
			shouldReplyAudio,
			aiResponseText,
			instanceName,
			phone,
			instanceToken: resolvedToken,
			evolutionUrl,
		});

		await db.insert(chatHistory).values({
			leadId: lead.id,
			role: "assistant",
			content: aiResponseText,
			type: shouldReplyAudio ? "audio" : "text",
		});

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("Webhook error:", error);
		// Retorna 500 sem expor a stack trace para o cliente
		return NextResponse.json({ ok: false }, { status: 500 });
	}
}
