import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/msp-admin")) {
    // Check cookie (server-side)
    const token = request.cookies.get("adminToken")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/msp-admin/:path*"],
};
