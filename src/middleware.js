import { NextResponse } from "next/server";

// No server-side auth check handled client-side via AuthGuard
export function middleware(request) {
  return NextResponse.next();
}
