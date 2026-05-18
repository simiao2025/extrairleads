import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads, chatHistory } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Necessário para Voz (TTS)
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.event !== "messages.upsert") return NextResponse.json({ ok: true });

    const messageData = body.data;
    const remoteJid = messageData.key.remoteJid;
    if (messageData.key.fromMe) return NextResponse.json({ ok: true });

    const phone = remoteJid.split("@")[0];
    const textContent = messageData.message?.conversation || messageData.message?.extendedTextMessage?.text;
    if (!textContent) return NextResponse.json({ ok: true });

    // 1. Localizar o Lead
    const [lead] = await db.select().from(leads).where(eq(leads.phone, phone));
    if (!lead) return NextResponse.json({ ok: true });

    // 2. Salvar Histórico do Usuário
    await db.insert(chatHistory).values({ leadId: lead.id, role: "user", content: textContent });

    // 3. Buscar Histórico Recente
    const history = await db.select().from(chatHistory).where(eq(chatHistory.leadId, lead.id)).orderBy(desc(chatHistory.createdAt)).limit(10);

    // 4. Agente 2: Gerar Resposta
    const systemPrompt = `Você é o Agente SDR da empresa ${lead.name}. Sua missão é agendar reuniões.
- Se o lead quiser falar com humano, use [HANDOFF].
- Responda de forma humanizada. Se for uma explicação complexa, use [AUDIO] no início.
- Histórico: ${history.reverse().map(h => `${h.role}: ${h.content}`).join("\n")}
`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: textContent }],
      model: "llama-3.3-70b-versatile",
    });

    const aiResponse = completion.choices[0].message.content || "";
    const isHandoff = aiResponse.includes("[HANDOFF]");
    const isAudio = aiResponse.includes("[AUDIO]");
    const cleanMessage = aiResponse.replace("[AUDIO]", "").replace("[HANDOFF]", "").trim();

    // 5. Tratar Handoff
    if (isHandoff) {
      await db.update(leads).set({ status: "interested" }).where(eq(leads.id, lead.id));
    }

    // 6. Enviar Resposta (Áudio ou Texto)
    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const evolutionKey = process.env.EVOLUTION_API_KEY!;
    const instance = process.env.EVOLUTION_INSTANCE;

    if (isAudio && process.env.OPENAI_API_KEY) {
      // Gerar Áudio com OpenAI
      const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: cleanMessage,
      });
      const buffer = Buffer.from(await mp3.arrayBuffer());
      const fileName = `reply-${Date.now()}.mp3`;
      const filePath = path.join(process.cwd(), "public", "audio", fileName);
      fs.writeFileSync(filePath, buffer);

      // Enviar Áudio via Evolution (Exemplo usando URL pública se disponível, ou base64)
      // Para este exemplo, vamos enviar como Base64 para garantir que funcione localmente
      const base64Audio = buffer.toString("base64");
      
      await fetch(`${evolutionUrl}/message/sendWhatsAppAudio/${instance}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": evolutionKey },
        body: JSON.stringify({
          number: phone,
          base64: base64Audio,
          delay: 2000
        }),
      });
    } else {
      // Enviar como Texto
      await fetch(`${evolutionUrl}/message/sendText/${instance}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": evolutionKey },
        body: JSON.stringify({ number: phone, text: cleanMessage, delay: 1000 }),
      });
    }

    // 7. Salvar Histórico do Assistente
    await db.insert(chatHistory).values({ leadId: lead.id, role: "assistant", content: cleanMessage, type: isAudio ? "audio" : "text" });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro no Webhook:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
