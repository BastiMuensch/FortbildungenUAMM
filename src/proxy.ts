import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

import { SESSION_COOKIE } from "@/constants/session";

/**
 * Vorgelagerte Prüfung für den Redaktionsbereich (in Next 16 heißt die frühere
 * Middleware "Proxy", siehe node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md).
 *
 * Das ist ausdrücklich NUR eine Bequemlichkeit: Wer kein gültiges Cookie hat,
 * landet gleich auf der Anmeldeseite statt auf einer leeren Adminseite. Die
 * eigentliche Autorisierung passiert im Admin-Layout und — verbindlich — in
 * jeder einzelnen Server Action über requireRole().
 */
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token || !(await tokenGueltig(token))) {
    const ziel = new URL("/login", request.url);
    ziel.searchParams.set("weiter", request.nextUrl.pathname);
    return NextResponse.redirect(ziel);
  }

  return NextResponse.next();
}

async function tokenGueltig(token: string): Promise<boolean> {
  const secret = process.env.JWT_SECRET;
  if (!secret) return false;

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
