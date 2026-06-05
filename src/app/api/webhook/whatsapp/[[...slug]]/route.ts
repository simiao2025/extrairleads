import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { and, eq, gte } from "drizzle-orm";
import { sql as drizzleSql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/db";
import { chatHistory, leads } from "@/db/schema";
import { getCachedAudio, saveCachedAudio } from "@/lib/cache";
import { parseZavuWebhook } from "@/services/zavu-parser";
import { processAIResponse } from "@/services/ai-agent";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function findOrCreateLead(phone: string) {
	const rawPhone = phone.replace(/\D/g, "");

	// Pela Zavu, como é SaaS global (no teste não temos dono vinculado diretamente),
	// podemos assumir um ownerUserId como o admin default, ou se vier metadata.
	// Vamos buscar ou criar o lead global.
	let [lead] = await db
		.select()
		.from(leads)
		.where(drizzleSql`regexp_replace(${leads.phone}, '\\D', '', 'g') = ${rawPhone}`);

	if (!lead) {
		const [newLead] = await db
			.insert(leads)
			.values({
				userId: 1, // Fixando 1 apenas para este demo SaaS
				phone: rawPhone,
				name: "Contato WhatsApp (Zavu)",
				status: "raw",
			})
			.returning();
		lead = newLead;
	}
	return lead;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function extractMessageContent(
	messageType: string,
	textContent: string,
	audioUrl: string | undefined,
): Promise<{ textContent: string; base64Audio: string | null }> {
	if (messageType === "audio" && audioUrl) {
		try {
			// Zavu envia URL pronta
			const mediaRes = await fetch(audioUrl);

			if (mediaRes.ok) {
				const arrayBuffer = await mediaRes.arrayBuffer();
				const buffer = Buffer.from(arrayBuffer);
				
				const tempFile = path.join(os.tmpdir(), `audio-${crypto.randomUUID()}.mp3`);
				fs.writeFileSync(tempFile, buffer);

				const transcriptionResponse = await openai.audio.transcriptions.create({
					file: fs.createReadStream(tempFile),
					model: "whisper-1",
				});

				const text = transcriptionResponse.text;

				try {
					fs.unlinkSync(tempFile);
				} catch (e) {
					console.error("Falha ao remover arquivo temporário", e);
				}

				return { textContent: text, base64Audio: `data:audio/mp3;base64,${buffer.toString("base64")}` };
			}
		} catch (err) {
			console.error("[extractMessageContent] Erro ao processar áudio Zavu:", err);
		}
	}

	return { textContent, base64Audio: null };
}

async function sendZavuReply({
	shouldReplyAudio,
	aiResponseText,
	phone,
	zavuKey,
}: {
	shouldReplyAudio: boolean;
	aiResponseText: string;
	phone: string;
	zavuKey: string;
}) {
	const ZAVU_API_URL = "https://api.zavu.dev/v1/messages";

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

			await fetch(ZAVU_API_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${zavuKey}` },
				body: JSON.stringify({
					channel: "whatsapp",
					to: phone,
					type: "audio",
					audio: { base64: base64Audio }
				}),
			});
			return;
		} catch (err) {
			console.error("[sendZavuReply] Erro no TTS:", err);
		}
	}

	const blocks = aiResponseText
		.split(/\n\n+/)
		.map((b) => b.trim())
		.filter((b) => b.length > 0);

	for (let i = 0; i < blocks.length; i++) {
		const block = blocks[i];
		const typingDelay = Math.min(3000, Math.max(1000, block.length * 35));

		await fetch(ZAVU_API_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json", Authorization: `Bearer ${zavuKey}` },
			body: JSON.stringify({
				channel: "whatsapp",
				to: phone,
				type: "text",
				text: block,
			}),
		});

		if (i < blocks.length - 1) {
			await sleep(typingDelay + 300);
		}
	}
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		
		// 1. ZAVU WEBHOOK DUMP PARA DEBUG (Test Mode)
		// Isso nos ajudará a ver exatamente como a Zavu nos chama.
		console.log("[ZAVU WEBHOOK DUMP]:", JSON.stringify(body, null, 2));

		const zavuKey = process.env.ZAVU_API_KEY || "zv_live_3433196b8211b9d3dc00a461298dc64570f5a295dbabb95e";

		// Validação se é um webhook válido do Zavu (Ex: checar evento)
		const parsed = parseZavuWebhook(body);
		
		if (!parsed) {
			// Ignorar eventos que não são mensagens ativas (Ex: delivery status)
			return NextResponse.json({ ok: true });
		}

		const { phone, isFromMe, messageType, textContent: rawText, audioUrl } = parsed;

		if (phone.includes("@g.us")) {
			return NextResponse.json({ ok: true }); // Ignora grupos
		}

		const lead = await findOrCreateLead(phone);

		const extracted = await extractMessageContent(
			messageType,
			rawText,
			audioUrl,
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

		const ownerUserId = lead.userId || 1; // Assumimos 1 (dono global)
		const { aiResponseText, forceAudio } = await processAIResponse(lead, textContent, ownerUserId);

		if (!aiResponseText || !aiResponseText.trim()) {
			return NextResponse.json({ ok: true });
		}

		const shouldReplyAudio = (messageType === "audio" || forceAudio) && !!process.env.OPENAI_API_KEY;

		await sendZavuReply({
			shouldReplyAudio,
			aiResponseText,
			phone,
			zavuKey,
		});

		await db.insert(chatHistory).values({
			leadId: lead.id,
			role: "assistant",
			content: aiResponseText,
			type: shouldReplyAudio ? "audio" : "text",
		});

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("Zavu Webhook error:", error);
		return NextResponse.json({ ok: false }, { status: 500 });
	}
}
