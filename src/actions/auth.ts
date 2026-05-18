"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

interface RegisterResult {
  success: boolean;
  error?: string;
}

export async function registerAction(
  name: string,
  email: string,
  password: string
): Promise<RegisterResult> {
  try {
    // Validações básicas
    if (!name || name.trim().length < 2) {
      return { success: false, error: "Nome deve ter pelo menos 2 caracteres." };
    }

    if (!email || !email.includes("@")) {
      return { success: false, error: "Email inválido." };
    }

    if (!password || password.length < 6) {
      return { success: false, error: "Senha deve ter pelo menos 6 caracteres." };
    }

    // Verificar se o email já existe
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()));

    if (existingUser) {
      return { success: false, error: "Este email já está cadastrado." };
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar o usuário
    await db.insert(users).values({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[registerAction] Erro:", message);
    return { success: false, error: "Erro interno ao criar conta. Tente novamente." };
  }
}
