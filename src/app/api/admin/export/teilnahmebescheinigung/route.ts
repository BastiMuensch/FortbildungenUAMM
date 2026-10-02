import { NextResponse, type NextRequest } from "next/server";
import { AuthError, ERFASSER, fortbildungScope, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { oeffentlicherReferentSelect, oeffentlicherReferentWhere } from "@/lib/namensfreigabe";
import { BescheinigungsAnfrageSchema, istBescheinigungVerfuegbar } from "@/lib/teilnahmebescheinigung";
import { BescheinigungsFehler, erstelleTeilnahmebescheinigung } from "@/lib/teilnahmebescheinigungPdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fehlerAntwort(fehler: string, status: number) {
  return NextResponse.json({ fehler }, { status, headers: { "Cache-Control": "private, no-store" } });
}

/** Reiner Download: erstellt weder Teilnehmerdaten noch FIBS-Versandvermerke. */
export async function GET(anfrage: NextRequest) {
  let user;
  try {
    user = await requireRole(...ERFASSER);
  } catch (fehler) {
    if (fehler instanceof AuthError) return fehlerAntwort(fehler.message, 401);
    throw fehler;
  }

  const parameter = anfrage.nextUrl.searchParams;
  const eingabe = BescheinigungsAnfrageSchema.safeParse({ id: parameter.get("id"), anzahl: parameter.get("anzahl") });
  if (!eingabe.success || parameter.getAll("id").length !== 1 || parameter.getAll("anzahl").length !== 1) {
    return fehlerAntwort(eingabe.error?.issues[0]?.message ?? "Bitte Fortbildung und Anzahl eindeutig angeben.", 400);
  }

  const fortbildung = await prisma.fortbildung.findFirst({
    where: { AND: [{ id: eingabe.data.id }, fortbildungScope(user)] },
    select: {
      titel: true, organisationsform: true, status: true, beginn: true, ende: true,
      veranstaltungsort: { select: { name: true, ort: true, istOnline: true } },
      bezirk: { select: {
        name: true,
        users: {
          where: { role: "ADMIN", isActive: true },
          select: { name: true },
          orderBy: [{ name: "asc" }, { id: "asc" }],
        },
      } },
      // Gedruckte Bescheinigungen verlassen den internen Bereich. Daher wie
      // beim Aushang nur freigegebene Referentennamen, niemals Kontaktdaten.
      referenten: {
        where: { referent: oeffentlicherReferentWhere },
        select: { referent: { select: oeffentlicherReferentSelect } },
        orderBy: { referent: { nachname: "asc" } },
      },
    },
  });
  if (!fortbildung) return fehlerAntwort("Fortbildung nicht gefunden oder kein Zugriff.", 404);
  if (!istBescheinigungVerfuegbar(fortbildung)) {
    return fehlerAntwort("Teilnahmebescheinigungen sind nur für freigegebene oder archivierte SchiLf verfügbar.", 409);
  }
  const bdbNamen = fortbildung.bezirk.users.map((bdb) => bdb.name?.trim() ?? "");
  if (!bdbNamen.length || bdbNamen.some((name) => !name)) {
    return fehlerAntwort("Für diesen Schulamtsbezirk fehlen vollständige BdB-Namen. Bitte die RvS bitten, unter „Bezirke und BdBs“ die aktiven BdB-Konten und ihre Namen zu ergänzen.", 409);
  }

  try {
    const pdf = await erstelleTeilnahmebescheinigung({
      titel: fortbildung.titel,
      beginn: fortbildung.beginn,
      ende: fortbildung.ende,
      ort: fortbildung.veranstaltungsort.istOnline ? "Online" :
        [fortbildung.veranstaltungsort.name, fortbildung.veranstaltungsort.ort].filter(Boolean).join(", "),
      bezirk: fortbildung.bezirk.name,
      bdbNamen,
      referenten: fortbildung.referenten.map(({ referent }) => `${referent.vorname} ${referent.nachname}`),
    }, eingabe.data.anzahl);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="teilnahmebescheinigungen-${eingabe.data.id}-${eingabe.data.anzahl}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (fehler) {
    if (fehler instanceof BescheinigungsFehler) return fehlerAntwort(fehler.message, 422);
    throw fehler;
  }
}
