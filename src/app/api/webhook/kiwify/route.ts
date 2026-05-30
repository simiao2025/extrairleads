import crypto from "node:crypto";
import argon2 from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";

async function sendOnboardingEmail(
	email: string,
	name: string,
	tempPassword: string,
) {
	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) {
		return;
	}

	try {
		const response = await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				from: "ExtrairLeads Onboarding <onboarding@resend.dev>",
				to: email,
				subject: "Seu acesso ao ExtrairLeads está liberado!",
				html: `
          <div style="font-family: sans-serif; background-color: #050505; color: #ffffff; padding: 40px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1f1f1f;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #10b981; font-size: 28px; font-weight: 800; margin: 0;">ExtrairLeads</h1>
              <p style="color: #a1a1aa; font-size: 14px; margin-top: 5px;">O motor neural de prospecção B2B</p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #e4e4e7;">Olá, <strong>${name}</strong>!</p>
            <p style="font-size: 16px; line-height: 1.6; color: #e4e4e7;">Seu pagamento foi confirmado com sucesso e sua conta foi gerada no sistema. Veja abaixo os seus dados de acesso temporário:</p>
            
            <div style="background-color: #121214; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #27272a; text-align: center;">
              <p style="margin: 0; color: #a1a1aa; font-size: 14px;">E-mail cadastrado:</p>
              <p style="margin: 5px 0 15px 0; color: #ffffff; font-size: 18px; font-weight: bold;">${email}</p>
              <p style="margin: 0; color: #a1a1aa; font-size: 14px;">Senha Temporária:</p>
              <p style="margin: 5px 0 0 0; color: #10b981; font-size: 20px; font-weight: bold; letter-spacing: 2px;">${tempPassword}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://extrairleads.brasilonthebox.shop/login?email=${encodeURIComponent(email)}&temp=${tempPassword}" 
                 style="background-color: #10b981; color: #000000; padding: 14px 28px; font-weight: bold; border-radius: 8px; text-decoration: none; display: inline-block; font-size: 16px;">
                Concluir Primeiro Acesso
              </a>
            </div>
            
            <p style="font-size: 14px; line-height: 1.6; color: #71717a; margin-top: 40px; border-top: 1px solid #1f1f1f; padding-top: 20px; text-align: center;">
              Ao clicar no link e fazer o login com a sua senha temporária, você será redirecionado para preencher seus dados de contato e atualizar a sua senha de segurança.
            </p>
          </div>
        `,
			}),
		});

		if (!response.ok) {
			await response.text(); // consume body
		}
	} catch (_error) {}
}

export async function POST(request: Request) {
	try {
		// PROTEÇÃO CONTRA WEBHOOKS FALSOS (Cybersecurity)
		// Exigir um token secreto na URL (ex: ?token=xyz123)
		const url = new URL(request.url);
		const token = url.searchParams.get("token");

		// Validar token (Configurar na Vercel e na Kiwify)
		const SECRET =
			process.env.KIWIFY_WEBHOOK_TOKEN || "extrairleads_padrao_2026";
		if (token !== SECRET) {
			return NextResponse.json(
				{ success: false, error: "Token inválido/Ausente" },
				{ status: 401 },
			);
		}

		const body = await request.json();

		const { order_status, customer } = body;

		// Apenas processa se o status for aprovado (Kiwify envia "approved" ou similar)
		if (order_status === "approved" && customer?.email) {
			const name = customer.name || "Cliente ExtrairLeads";
			const email = customer.email.toLowerCase().trim();
			const cpfCnpj = (customer.cpf_cnpj || customer.CPF || customer.CNPJ || "")
				.toString()
				.replace(/\D/g, "");

			// Verifica se o usuário já existe
			const [existingUser] = await db
				.select()
				.from(users)
				.where(eq(users.email, email));

			// Lógica de Identificação de Produto/Pacote da Kiwify
			// Baseado no nome do produto, ID, ou valor cobrado, definimos os créditos.
			const productName = (body.product?.name || "").toLowerCase();

			let addedCredits = 1000; // Padrão
			let newPlan = "Starter";

			if (productName.includes("2.500") || productName.includes("2500")) {
				addedCredits = 2500;
			} else if (
				productName.includes("10.000") ||
				productName.includes("10000")
			) {
				addedCredits = 10000;
				newPlan = "Scale";
			} else if (
				productName.includes("5.000") ||
				productName.includes("5000") ||
				productName.includes("growth")
			) {
				addedCredits = 5000;
				newPlan = "Growth";
			}

			if (!existingUser) {
				// Gera senha temporária de 12 caracteres hexadecimais
				const tempPassword = crypto.randomBytes(6).toString("hex");
				const hashedPassword = await argon2.hash(tempPassword);

				// Salva usuário no banco de dados com status de onboarding PENDING_INFO
				await db.insert(users).values({
					email,
					name,
					password: hashedPassword,
					cpfCnpj,
					onboardingStatus: "PENDING_INFO",
					isTemporaryPassword: 1,
					leadsBalance: addedCredits,
					plan: newPlan,
				});

				// Envia o e-mail de boas-vindas com o link de login
				await sendOnboardingEmail(email, name, tempPassword);

				return NextResponse.json({
					success: true,
					message: "Usuário criado com sucesso e e-mail enviado.",
				});
			} else {
				// Usuário já existe: vamos adicionar saldo (Top-up) ou atualizar plano
				const currentBalance = existingUser.leadsBalance || 0;
				const newBalance = currentBalance + addedCredits;

				await db
					.update(users)
					.set({
						leadsBalance: newBalance,
						plan: newPlan,
					})
					.where(eq(users.id, existingUser.id));

				return NextResponse.json({
					success: true,
					message: `Saldo adicionado: +${addedCredits}. Novo saldo: ${newBalance}`,
				});
			}
		}

		return NextResponse.json({
			success: true,
			message: "Ignorado - status do pedido não aprovado ou e-mail ausente.",
		});
	} catch (_error: unknown) {
		return NextResponse.json(
			{ success: false, error: "Erro interno do servidor." },
			{ status: 500 },
		);
	}
}
