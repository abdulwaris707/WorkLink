import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  process.env.JWT_SECRET ||
  "worklink-super-secret-jwt-key-production-ready-min-32-chars";
const secretKey = new TextEncoder().encode(AUTH_SECRET);
const SESSION_COOKIE_NAME = "worklink_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  let session: { id: string; role: string; email: string; name: string } | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secretKey);
      session = {
        id: payload.id as string,
        role: payload.role as string,
        email: payload.email as string,
        name: payload.name as string,
      };
    } catch {
      session = null;
    }
  }

  // 1. Hidden Admin Entry: /jo
  if (pathname === "/jo") {
    if (!session) {
      // Unauthenticated: render the hidden Admin Sign In screen
      return NextResponse.next();
    }
    if (session.role === "ADMIN") {
      return NextResponse.redirect(new URL("/jo/dashboard", request.url));
    }
    // Authenticated non-admin: redirect to their own dashboard, never grant access
    if (session.role === "WORKER") {
      return NextResponse.redirect(new URL("/worker", request.url));
    }
    return NextResponse.redirect(new URL("/client", request.url));
  }

  // 2. Hidden Admin Sub-Routes: /jo/*
  if (pathname.startsWith("/jo/")) {
    if (!session) {
      return NextResponse.redirect(new URL("/jo", request.url));
    }
    if (session.role !== "ADMIN") {
      if (session.role === "WORKER") {
        return NextResponse.redirect(new URL("/worker", request.url));
      }
      return NextResponse.redirect(new URL("/client", request.url));
    }
  }

  // 3. Legacy /admin redirects safely to /jo
  if (pathname.startsWith("/admin")) {
    if (!session || session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.redirect(new URL("/jo/dashboard", request.url));
  }

  // 4. Protected client routes
  if (pathname.startsWith("/client")) {
    if (!session) {
      const url = new URL("/login", request.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    if (session.role === "WORKER") {
      return NextResponse.redirect(new URL("/worker", request.url));
    }
    if (session.role === "ADMIN") {
      return NextResponse.redirect(new URL("/jo/dashboard", request.url));
    }
  }

  // 5. Protected worker routes
  if (pathname.startsWith("/worker")) {
    if (!session) {
      const url = new URL("/login", request.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    if (session.role === "CLIENT") {
      return NextResponse.redirect(new URL("/client", request.url));
    }
    if (session.role === "ADMIN") {
      return NextResponse.redirect(new URL("/jo/dashboard", request.url));
    }
  }

  // 6. Public auth pages redirect if already logged in
  if (pathname === "/login" || pathname === "/signup") {
    if (session) {
      const dest =
        session.role === "ADMIN"
          ? "/jo/dashboard"
          : session.role === "WORKER"
          ? "/worker"
          : "/client";
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/client/:path*",
    "/worker/:path*",
    "/admin/:path*",
    "/jo",
    "/jo/:path*",
    "/login",
    "/signup",
  ],
};
