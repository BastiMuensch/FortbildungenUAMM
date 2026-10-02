import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { ERFASSER, fortbildungScope, getSessionUser } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { ladeLogo } from "@/lib/logo";
import { AushangLayoutFehler, erstelleAushangPdf } from "@/lib/aushangPdf";
import { oeffentlicherReferentSelect, oeffentlicherReferentWhere } from "@/lib/namensfreigabe";

export const dynamic = "force-dynamic";

/**
 * Aushang für das Lehrerzimmer: eine A4-Seite je Fortbildung.
 *
 * Gedacht zum Ausdrucken und Anpinnen — deshalb große Typografie, viel Weiß
 * und ein QR-Code, über den Lehrkräfte direkt auf die Detailseite kommen.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user || !ERFASSER.includes(user.role)) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const { id } = await params;

  const fortbildung = await prisma.fortbildung.findFirst({
    where: { AND: [{ id }, fortbildungScope(user)] },
    include: {
      bezirk: { select: { name: true } },
      veranstaltungsort: true,
      referenten: {
        where: { referent: oeffentlicherReferentWhere },
        select: { referent: { select: oeffentlicherReferentSelect } },
      },
    },
  });

  if (!fortbildung) {
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }

  const basis = (
    process.env.APP_BASE_URL ?? request.nextUrl.origin
  ).replace(/\/+$/, "");
  const adresse = `${basis}/fortbildungen/${fortbildung.slug}`;
  let doc;
  try {
    doc = erstelleAushangPdf(fortbildung, adresse, await ladeLogo());
  } catch (fehler) {
    if (fehler instanceof AushangLayoutFehler) {
      return NextResponse.json({ error: fehler.message }, { status: 422, headers: { "Cache-Control": "no-store" } });
    }
    throw fehler;
  }

  await auditLog({
    userId: user.id,
    aktion: "UPDATE",
    entitaet: "Aushang",
    entitaetId: fortbildung.id,
  });

  const dateiname = `aushang-${fortbildung.slug}.pdf`;

  return new NextResponse(Buffer.from(doc.output("arraybuffer")), {
    headers: {
      "Content-Type": "application/pdf",
      // inline, damit der Aushang im Browser aufgeht und direkt gedruckt
      // werden kann — genau dafür ist er gedacht.
      "Content-Disposition": `inline; filename="${dateiname}"`,
      "Cache-Control": "no-store",
    },
  });
}
