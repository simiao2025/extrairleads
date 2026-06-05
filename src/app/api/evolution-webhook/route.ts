import { NextRequest } from "next/server";
import { POST as handleWhatsappWebhook } from "../webhook/whatsapp/[[...slug]]/route";

export async function POST(req: NextRequest) {
	// Chamamos a rota original passando params vazios
	return handleWhatsappWebhook(req, { params: Promise.resolve({}) });
}
