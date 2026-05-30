import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const token = searchParams.get("token");
	const email = searchParams.get("email");

	if (!token || !email) {
		return NextResponse.redirect(
			new URL("/login?error=token_invalid", request.url),
		);
	}

	// Busca o token no banco
	const [dbToken] = await db
		.select()
		.from(verificationTokens)
		.where(
			and(
				eq(verificationTokens.token, token),
				eq(verificationTokens.identifier, email.toLowerCase().trim()),
			),
		);

	if (!dbToken || new Date() > new Date(dbToken.expires)) {
		return NextResponse.redirect(
			new URL("/login?error=token_expired", request.url),
		);
	}

	// Atualiza o e-mail do usuário como verificado
	await db
		.update(users)
		.set({ emailVerified: new Date() })
		.where(eq(users.email, email.toLowerCase().trim()));

	// Remove o token utilizado para evitar reaproveitamento
	await db
		.delete(verificationTokens)
		.where(eq(verificationTokens.id, dbToken.id));

	return NextResponse.redirect(
		new URL("/login?success=email_verified", request.url),
	);
}
