import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Ausschließlich feste Betriebswerkzeuge; kein vom Client bestimmter Dateipfad. */
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "RVS") return NextResponse.json({ error: "Nicht berechtigt." }, { status: 403 });
  const auswahl = request.nextUrl.searchParams.get("datei");
  const dateiname = auswahl === "windows" ? "Uebernehme-Vollbackup.ps1" : auswahl === "wiederherstellung" ? "test-vollbackup-wiederherstellung.sh" : null;
  if (!dateiname) return NextResponse.json({ error: "Unbekanntes Werkzeug." }, { status: 400 });
  try {
    const text = await readFile(path.join(process.cwd(), "ops", dateiname), "utf8");
    return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8", "Content-Disposition": `attachment; filename="${dateiname}"`, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  } catch { return NextResponse.json({ error: "Das Betriebswerkzeug fehlt in dieser Installation." }, { status: 503 }); }
}
