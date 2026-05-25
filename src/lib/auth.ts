import argon2 from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/db";
import { users } from "@/db/schema";
import { authConfig } from "./auth.config";

class UnverifiedEmailError extends CredentialsSignin {
  code = "unverified_email";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const [user] = await db.select().from(users).where(eq(users.email, email));
        if (!user?.password) {
          return null;
        }

        let isValid = false;
        try {
          isValid = await argon2.verify(user.password, password);
        } catch (_e) {
          return null;
        }

        if (!isValid) {
          return null;
        }

        // Impede login se o e-mail não estiver verificado (só após validar a senha)
        if (!user.emailVerified) {
          throw new UnverifiedEmailError();
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
});
