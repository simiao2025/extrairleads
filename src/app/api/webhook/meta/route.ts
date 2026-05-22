import { NextResponse } from "next/server";
import { eq, desc, sql as drizzleSql } from "drizzle-orm";
import { db } from "@/db";
import { users, leads, chatHistory, campaignConfigs, appointments } from "@/db/schema";
import OpenAI from "openai";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || "extrairleads2026";

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ ok: true });
    }

    for (const entry of body.entry) {
      for (const change of entry.changes) {
        if (change.field === "messages" && change.value.messages) {
          const metadata = change.value.metadata;
          const phoneNumberId = metadata.phone_number_id;

          // Localizar usuário pelo phone number ID do Meta
          const [owner] = await db
            .select()
            .from(users)
            .where(eq(users.metaPhoneNumberId, phoneNumberId));

          if (!owner) continue;

          for (const message of change.value.messages) {
            const phone = message.from; 
            let textContent = "";

            if (message.type === "text") {
              textContent = message.text.body;
            } else if (message.type === "audio") {
              // TODO: Implementar transcrição de áudio via Graph API
              textContent = "[Áudio Recebido - Não transcrito no momento]";
            }

            if (!textContent) continue;

            // 1. Localizar ou Auto-Cadastrar o Lead
            let [lead] = await db.select().from(leads).where(eq(leads.phone, phone));
            if (!lead) {
              const [newLead] = await db
                .insert(leads)
                .values({
                  userId: owner.id,
                  phone: phone,
                  name: "Contato WhatsApp Meta",
                  status: "raw",
                })
                .returning();
              lead = newLead;
            }

            // 2. Salvar Histórico do Usuário
            await db.insert(chatHistory).values({
              leadId: lead.id,
              role: "user",
              content: textContent,
              type: message.type === "audio" ? "audio" : "text",
            });

            // 3. Obter Histórico Recente para RAG e Contexto
            const history = await db
              .select()
              .from(chatHistory)
              .where(eq(chatHistory.leadId, lead.id))
              .orderBy(desc(chatHistory.createdAt))
              .limit(10);

            const formattedHistory = history
              .reverse()
              .map((h) => `${h.role === "user" ? "Cliente" : "SDR"}: ${h.content}`)
              .join("\n");

            const [config] = owner.id
              ? await db.select().from(campaignConfigs).where(eq(campaignConfigs.userId, owner.id))
              : [];

            const systemPrompt = `${config?.agent2Prompt || "Você é um SDR focado em abordagens."}

DADOS PRÉVIOS DO LEAD:
- Empresa: ${lead.name}
- Nicho: ${lead.niche || "Não informado"}
- Cidade: ${lead.city || "Não informada"}

DIRETRIZES DE AUTONOMIA:
- Você possui autonomia para TRANSBORDAR PARA HUMANO chamando a ferramenta 'escalate_to_human'.
- Você possui autonomia para FECHAR AGENDAMENTOS chamando a ferramenta 'create_appointment'.

HISTÓRICO DA CONVERSA:
${formattedHistory}`;

            const tools = [
              {
                type: "function" as const,
                function: {
                  name: "update_lead_info",
                  description: "Atualiza os dados e muda status para qualificado ('qualified').",
                  parameters: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      niche: { type: "string" },
                      city: { type: "string" },
                    },
                    required: ["name"],
                  },
                },
              },
              {
                type: "function" as const,
                function: {
                  name: "create_appointment",
                  description: "Agenda uma reunião oficial na agenda.",
                  parameters: {
                    type: "object",
                    properties: {
                      dateStr: { type: "string" },
                      notes: { type: "string" },
                    },
                    required: ["dateStr"],
                  },
                },
              },
              {
                type: "function" as const,
                function: {
                  name: "escalate_to_human",
                  description: "Aciona o transbordo para um atendente humano.",
                  parameters: {
                    type: "object",
                    properties: {
                      reason: { type: "string" },
                    },
                    required: ["reason"],
                  },
                },
              },
            ];

            const completion = await groq.chat.completions.create({
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: textContent },
              ],
              model: "llama-3.3-70b-versatile",
              tools: tools,
              tool_choice: "auto",
            });

            const choice = completion.choices[0];
            const toolCalls = choice.message.tool_calls as any[];
            let aiResponseText = choice.message.content || "";

            // Tratar chamadas de ferramentas e movimentar Kanban (Trigger card movement)
            if (toolCalls && toolCalls.length > 0) {
              for (const toolCall of toolCalls) {
                const toolName = toolCall.function.name;
                const toolArgs = JSON.parse(toolCall.function.arguments);

                if (toolName === "update_lead_info") {
                  await db.update(leads)
                    .set({
                      name: toolArgs.name,
                      niche: toolArgs.niche || lead.niche,
                      city: toolArgs.city || lead.city,
                      status: "qualified", // Movimenta Kanban
                      updatedAt: new Date(),
                    })
                    .where(eq(leads.id, lead.id));
                } else if (toolName === "create_appointment") {
                  await db.insert(appointments).values({
                    leadId: lead.id,
                    scheduledAt: new Date(toolArgs.dateStr),
                    notes: toolArgs.notes || "Agendado autonomamente",
                    status: "confirmed",
                  });
                  await db.update(leads).set({ status: "interested" }).where(eq(leads.id, lead.id)); // Movimenta Kanban
                } else if (toolName === "escalate_to_human") {
                  await db.update(leads).set({ status: "human_intervention" }).where(eq(leads.id, lead.id)); // Movimenta Kanban
                }
              }

              const secondCompletion = await groq.chat.completions.create({
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: textContent },
                  choice.message,
                  ...toolCalls.map((tc) => ({
                    role: "tool" as const,
                    tool_call_id: tc.id,
                    name: tc.function.name,
                    content: "Success",
                  })),
                ],
                model: "llama-3.3-70b-versatile",
              });

              aiResponseText = secondCompletion.choices[0].message.content || "";
            }

            if (!aiResponseText.trim()) continue;

            // Enviar Resposta via API da Meta
            const metaResponse = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${owner.metaAccessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: phone,
                type: "text",
                text: { preview_url: false, body: aiResponseText }
              }),
            });

            if (metaResponse.ok) {
              await db.insert(chatHistory).values({
                leadId: lead.id,
                role: "assistant",
                content: aiResponseText,
                type: "text",
              });
            }
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
