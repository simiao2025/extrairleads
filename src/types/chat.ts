export interface ChatMessage {
	id?: number;
	leadId: number | null;
	role: "user" | "assistant" | null;
	content: string | null;
	audioBase64: string | null;
	type: string | null;
	createdAt?: Date | string;
}
