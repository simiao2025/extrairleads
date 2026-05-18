import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const PUBLIC_ROUTES = ["/login", "/api/auth", "/api/webhook/whatsapp"];

export default async function middleware(request: NextRequest) {
  const session = await auth();
  const isPublic = PUBLIC_ROUTES.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (!session && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session && request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};