// src/services/evolution-parser.ts

export interface NormalizedMessage {
	instanceName: string;
	instanceToken: string;
	remoteJid: string;
	isFromMe: boolean;
	messageType: string;
	messageId: string;
	pushName: string;
	messagePayload: {
		conversation?: string;
		extendedTextMessage?: { text: string };
		audioMessage?: Record<string, unknown>;
		[key: string]: unknown;
	};
	rawData: any;
}

export function normalizeEvolutionPayload(
	body: any,
	instanceTokenFallback: string,
): NormalizedMessage | null {
	const isV3 = !!body?.data?.Info;

	if (isV3) {
		const info = body.data.Info;
		const msg = body.data.Message || {};

		const remoteJid: string = info.Chat || "";
		if (!remoteJid) return null;

		const rawType = (info.Type || "").toLowerCase();
		let messageType = "text";
		if (rawType === "audio" || msg.audioMessage) messageType = "audio";
		else if (rawType === "image" || msg.imageMessage) messageType = "image";
		else if (rawType === "document" || msg.documentMessage)
			messageType = "document";

		return {
			instanceName: body.instanceName || body.instance || "",
			instanceToken: body.instanceToken || instanceTokenFallback,
			remoteJid,
			isFromMe: !!info.IsFromMe,
			messageType,
			messageId: info.ID || "",
			pushName: info.PushName || "",
			messagePayload: {
				conversation: msg.conversation,
				extendedTextMessage: msg.extendedTextMessage,
				audioMessage: msg.audioMessage,
				...msg,
			},
			rawData: body.data,
		};
	}

	const data = body.data || body;
	const remoteJid: string = data?.key?.remoteJid || data?.Info?.Chat || "";
	if (!remoteJid) return null;

	const msg = data.message || data.Message || {};
	let messageType = "text";
	if (msg.audioMessage) messageType = "audio";
	else if (msg.imageMessage) messageType = "image";

	return {
		instanceName: body.instance || body.instanceName || "",
		instanceToken: body.instanceToken || instanceTokenFallback,
		remoteJid,
		isFromMe: !!data?.key?.fromMe,
		messageType,
		messageId: data?.key?.id || "",
		pushName: data?.pushName || "",
		messagePayload: msg,
		rawData: data,
	};
}
