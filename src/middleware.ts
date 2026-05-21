import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const { auth: middleware } = NextAuth(authConfig);

const PUBLIC_ROUTES = ["/login", "/reset-password", "/api/auth", "/api/webhook/whatsapp"];

export default middleware((req) => {
  const session = req.auth;
  const isPublic = PUBLIC_ROUTES.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  if (!session && !isPublic) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session && req.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};