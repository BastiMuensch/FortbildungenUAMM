import { Readable } from "node:stream";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/lib/auth";
import { oeffneDatensicherung } from "@/lib/datensicherung";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "RVS") return NextResponse.json({ error: "Nicht berechtigt." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  const id = z.string().uuid().safeParse(request.nextUrl.searchParams.get("id"));
  if (!id.success) return NextResponse.json({ error: "Ungültige Sicherung." }, { status: 400 });
  let paket;
  try { paket = await oeffneDatensicherung(id.data); } catch { return NextResponse.json({ error: "Die Sicherung ist derzeit nicht verfügbar." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
  if (!paket) return NextResponse.json({ error: "Die Sicherung ist nicht mehr zum Download verfügbar." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  try {
    // Fail closed: Ohne Protokoll kein Export des vollständigen Datenbestands.
    // Der Eintrag bezeichnet nur den Downloadbeginn, niemals die externe Ablage.
    await prisma.auditLog.create({ data: { userId: user.id, aktion: "CREATE", entitaet: "DatensicherungDownload", entitaetId: id.data, details: { sha256: paket.sha256 } } });
  } catch {
    paket.stream.destroy();
    return NextResponse.json({ error: "Der Download konnte nicht protokolliert werden. Bitte erneut versuchen." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  request.signal.addEventListener("abort", () => paket.stream.destroy(), { once: true });
  return new Response(Readable.toWeb(paket.stream) as ReadableStream<Uint8Array>, { headers: {
    "Content-Type": "application/octet-stream",
    "Content-Disposition": `attachment; filename="${paket.dateiname}"`,
    "Content-Length": String(paket.bytes),
    "Cache-Control": "private, no-store, max-age=0",
    "Pragma": "no-cache",
    "X-Content-Type-Options": "nosniff",
    "X-Backup-SHA256": paket.sha256,
  } });
}
