import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import argon2 from "@node-rs/argon2";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { authConfig } from "./auth.config";

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
        if (!user || !user.password) {
          return null;
        }

        // Impede login se o e-mail não estiver verificado
        if (!user.emailVerified) {
          throw new Error("unverified_email");
        }

        let isValid = false;
        try {
          isValid = await argon2.verify(user.password, password);
        } catch (e) {
          return null;
        }

        if (!isValid) {
          return null;
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