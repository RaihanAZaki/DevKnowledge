import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AUTH_COOKIE } from "@/lib/constants";

const protectedPrefixes = [
  "/dashboard",
  "/snippets",
  "/documentation",
  "/forum",
  "/ai",
  "/settings",
  "/friends",
  "/profile",
  "/audit-logs",
];

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const hasToken = Boolean(
    request.cookies.get(AUTH_COOKIE)?.value
  );

  const isProtected = protectedPrefixes.some(
    (prefix) => pathname.startsWith(prefix)
  );

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register";

  if (isProtected && !hasToken) {
    const url = new URL(
      "/login",
      request.url
    );

    url.searchParams.set(
      "next",
      pathname
    );

    return NextResponse.redirect(url);
  }

  if (isAuthPage && hasToken) {
    return NextResponse.redirect(
      new URL(
        "/dashboard",
        request.url
      )
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/snippets/:path*",
    "/documentation/:path*",
    "/forum/:path*",
    "/ai/:path*",
    "/settings/:path*",
    "/friends/:path*",
    "/profile/:path*",
    "/audit-logs/:path*",
    "/login",
    "/register",
  ],
};