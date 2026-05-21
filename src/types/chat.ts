export interface ChatMessage {
  id?: number;
  leadId: number | null;
  role: "user" | "assistant" | null;
  content: string | null;
  type: "text" | "audio" | null;
  createdAt?: Date | string;
}
