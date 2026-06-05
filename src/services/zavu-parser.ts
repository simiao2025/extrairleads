export interface NormalizedZavuMessage {
	phone: string;
	isFromMe: boolean;
	messageType: "text" | "audio" | "image" | "document" | "unsupported";
	messageId: string;
	textContent: string;
	audioUrl?: string;
	rawData: any;
}

export function parseZavuWebhook(body: any): NormalizedZavuMessage | null {
	// A Zavu costuma enviar payloads com a estrutura parecida com a Cloud API ou um schema padrão próprio.
	// Vamos capturar de forma resiliente as propriedades principais.

	const event = body?.event || body?.type;
	
	// Normalmente ignoramos mensagens de status de envio se o foco for responder
	if (event === "message.status" || event === "message_status") {
		return null;
	}

	const data = body?.data || body?.message || body;
	if (!data) return null;

	const isFromMe = data.direction === "outbound" || data.fromMe === true;
	
	// A Zavu normalmente separa o número de quem envia/recebe de forma limpa.
	// Se outbound (isFromMe), nós enviamos para `to`. Se inbound, recebemos de `from`.
	let phone = isFromMe ? data.to : data.from;
	if (!phone) {
		// Fallbacks genéricos caso o payload tenha outra estrutura
		phone = data.chatId || data.remoteJid;
	}
	
	if (!phone) return null;

	// Limpar o número para conter apenas dígitos (garantir padrão de banco de dados)
	phone = phone.replace(/\D/g, "");

	const rawType = (data.type || "text").toLowerCase();
	let messageType: NormalizedZavuMessage["messageType"] = "unsupported";
	let textContent = "";
	let audioUrl: string | undefined = undefined;

	if (rawType === "text" || rawType === "chat") {
		messageType = "text";
		textContent = data.text?.body || data.text || data.content || "";
	} else if (rawType === "audio" || rawType === "ptt") {
		messageType = "audio";
		audioUrl = data.audio?.url || data.mediaUrl || data.url;
	} else if (rawType === "image") {
		messageType = "image";
	} else if (rawType === "document") {
		messageType = "document";
	}

	return {
		phone,
		isFromMe,
		messageType,
		messageId: data.id || data.messageId || "",
		textContent,
		audioUrl,
		rawData: body,
	};
}
