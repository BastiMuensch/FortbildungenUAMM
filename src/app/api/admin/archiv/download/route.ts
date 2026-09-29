import JSZip from "jszip";
import { NextResponse, type NextRequest } from "next/server";

import { auditLog } from "@/lib/audit";
import { getSessionUser, bezirkScope } from "@/lib/auth";
import { archivinhaltsCsv, archivinhaltsHash, archivinhaltsJson, ladeArchivInhalt, manifest, paketkennung } from "@/lib/archiv";
import { prisma } from "@/lib/prisma";
import { parseSchuljahr } from "@/lib/schuljahr";

export const dynamic = "force-dynamic";

/** Download ist absichtlich der einzige Route Handler: er liefert reine Paketbytes. */
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || !["RVS", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Nicht berechtigt." }, { status: 401 });
  }
  const bezirkId = request.nextUrl.searchParams.get("bezirkId") ?? "";
  const schuljahr = parseSchuljahr(request.nextUrl.searchParams.get("schuljahr") ?? undefined);
  if (!bezirkId || schuljahr === null) return NextResponse.json({ error: "Ungültige Paketangabe." }, { status: 400 });

  const bezirk = await prisma.bezirk.findFirst({
    where: { AND: [{ id: bezirkId }, bezirkScope(user)] }, select: { id: true },
  });
  if (!bezirk) return NextResponse.json({ error: "Für diesen Bezirk fehlt die Berechtigung." }, { status: 403 });

  const inhalt = await ladeArchivInhalt(bezirkId, schuljahr);
  if (!inhalt) return NextResponse.json({ error: "Bezirk nicht gefunden." }, { status: 404 });
  if (inhalt.fortbildungen.some((f) => new Date(f.aufbewahrenBis) <= new Date())) {
    const nachfrist = await prisma.archivnachfristFreigabe.findFirst({ where: { bezirkId, schuljahr, gueltigBis: { gt: new Date() } }, select: { id: true } });
    if (!nachfrist) return NextResponse.json({ error: "Die Frist ist abgelaufen. Eine begründete RvS-Nachfrist ist erforderlich." }, { status: 423 });
  }
  const inhaltsHash = archivinhaltsHash(inhalt);
  const kennung = paketkennung(bezirkId, schuljahr, inhaltsHash);
  const paket = await prisma.archivpaket.findUnique({
    where: { bezirkId_schuljahr: { bezirkId, schuljahr } },
    select: { paketkennung: true, inhaltsHash: true },
  });
  if (!paket || paket.inhaltsHash !== inhaltsHash || paket.paketkennung !== kennung) {
    return NextResponse.json({ error: "Das Paket muss wegen geänderter Daten zuerst neu vorbereitet werden." }, { status: 409 });
  }

  const zip = new JSZip();
  const zipDatum = new Date("2000-01-01T00:00:00.000Z");
  zip.file("manifest.json", `${JSON.stringify(manifest(inhalt, inhaltsHash, kennung))}\n`, { date: zipDatum });
  zip.file("fortbildungen.json", archivinhaltsJson(inhalt), { date: zipDatum });
  zip.file("fortbildungen.csv", `\uFEFF${archivinhaltsCsv(inhalt)}\r\n`, { date: zipDatum });
  zip.file("pruefsumme.sha256", `${inhaltsHash}  fortbildungen.json\n`, { date: zipDatum });
  const bytes = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });

  await auditLog({ userId: user.id, aktion: "CREATE", entitaet: "ArchivpaketDownload", details: { bezirkId, schuljahr, paketkennung: kennung, inhaltsHash } });
  return new NextResponse(bytes as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${kennung}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
