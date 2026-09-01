import { NextResponse, type NextRequest } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { prisma } from "@/lib/prisma";
import { getSessionUser, fortbildungScope } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { filterZuWhere, leseFilter, type SuchParameter } from "@/lib/filter";
import {
  berlinIsoDatum,
  formatDatum,
  formatDatumZeit,
  formatZeit,
} from "@/lib/datetime";
import {
  ORGANISATIONSFORMEN,
  ORGANISATIONSFORM_REIHENFOLGE,
  formatLabel,
  niveaustufeLabel,
  schulartLabel,
  statusLabel,
} from "@/constants/fortbildung";

export const dynamic = "force-dynamic";

const REITER_FILTER: Record<string, Record<string, string>> = {
  regional: { organisationsform: "REGIONAL" },
  schilf: { organisationsform: "SCHILF" },
  alp: { organisationsform: "ALP" },
  eingereicht: { status: "EINGEREICHT" },
  entwuerfe: { status: "ENTWURF" },
};

/**
 * Berichts-PDF, gegliedert nach den drei Ebenen der Lehrerfortbildung:
 * SchiLf, RLFB und ALP — in dieser Reihenfolge, je mit eigener Tabelle und
 * einer Summenzeile.
 *
 * Gedacht für die Berichterstattung des Schulamts, deshalb liegt der
 * Schwerpunkt auf Zahlen (geplante Plätze gegenüber tatsächlichen
 * Teilnehmenden), nicht auf der Ausschreibung.
 */
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const params: SuchParameter = Object.fromEntries(
    request.nextUrl.searchParams.entries(),
  );
  const reiter = typeof params.reiter === "string" ? params.reiter : "";

  const fortbildungen = await prisma.fortbildung.findMany({
    where: {
      AND: [
        fortbildungScope(user),
        filterZuWhere({ ...leseFilter(params), ...(REITER_FILTER[reiter] ?? {}) }),
      ],
    },
    orderBy: { beginn: "asc" },
    include: {
      veranstaltungsort: true,
      referenten: { include: { referent: true } },
    },
  });

  // jsPDF nutzt die eingebauten Standardschriften mit WinAnsi-Kodierung.
  // Gedankenstriche (– —) sind darin nicht enthalten und verschlucken beim
  // Rendern das Folgezeichen — deshalb stehen in diesem Dokument bewusst nur
  // Bindestriche und Doppelpunkte.
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const breite = doc.internal.pageSize.getWidth();
  const rand = 12;

  // --- Kopf ---------------------------------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Fortbildungsübersicht", rand, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    "Staatliches Schulamt im Landkreis Unterallgäu und in der Stadt Memmingen",
    rand,
    22,
  );

  const zeitraum = beschreibeZeitraum(fortbildungen);
  doc.setTextColor(110);
  doc.text(zeitraum, rand, 27);
  doc.text(`Erstellt am ${formatDatumZeit(new Date())}`, breite - rand, 27, {
    align: "right",
  });
  doc.setTextColor(0);

  let y = 34;

  // --- Je Ebene eine Tabelle ---------------------------------------------
  const gesamt = { termine: 0, plaetze: 0, teilnehmer: 0, gemeldet: 0, inFibs: 0 };

  for (const ebene of ORGANISATIONSFORM_REIHENFOLGE) {
    const gruppe = fortbildungen.filter((f) => f.organisationsform === ebene);
    const info = ORGANISATIONSFORMEN.find((o) => o.value === ebene)!;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`${info.kurz}: ${info.beschreibung}`, rand, y);
    y += 5;

    if (gruppe.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(130);
      doc.text("Keine Veranstaltungen im gewählten Zeitraum.", rand, y);
      doc.setTextColor(0);
      y += 10;
      continue;
    }

    const summe = gruppe.reduce(
      (acc, f) => ({
        plaetze: acc.plaetze + f.maxTn,
        teilnehmer: acc.teilnehmer + (f.tnTatsaechlich ?? 0),
        gemeldet: acc.gemeldet + (f.tnTatsaechlich === null ? 0 : 1),
        inFibs: acc.inFibs + (f.inFibs ? 1 : 0),
      }),
      { plaetze: 0, teilnehmer: 0, gemeldet: 0, inFibs: 0 },
    );

    gesamt.termine += gruppe.length;
    gesamt.plaetze += summe.plaetze;
    gesamt.teilnehmer += summe.teilnehmer;
    gesamt.gemeldet += summe.gemeldet;
    gesamt.inFibs += summe.inFibs;

    autoTable(doc, {
      startY: y,
      margin: { left: rand, right: rand },
      head: [
        [
          "Datum",
          "Zeit",
          "Titel",
          "Ort",
          "Format",
          "Schularten",
          "Niveau",
          "Referenten",
          "Plätze",
          "TN",
          "FIBS",
          "Status",
        ],
      ],
      body: gruppe.map((f) => [
        formatDatum(f.beginn),
        `${formatZeit(f.beginn)}-${formatZeit(f.ende)}`,
        f.titel,
        f.veranstaltungsort.name,
        formatLabel(f.format),
        f.schularten.map((s) => schulartLabel(s)).join(", "),
        f.niveaustufe ? niveaustufeLabel(f.niveaustufe).replace("Niveaustufe ", "") : "-",
        f.referenten
          .map((r) => `${r.referent.vorname[0]}. ${r.referent.nachname}`)
          .join(", ") || "-",
        String(f.maxTn),
        // Ein leeres Feld hieße "null Teilnehmende" — die offene Meldung wird
        // deshalb ausdrücklich als solche gekennzeichnet.
        f.tnTatsaechlich === null ? "offen" : String(f.tnTatsaechlich),
        f.inFibs ? "ja" : "nein",
        statusLabel(f.status),
      ]),
      foot: [
        [
          {
            content: `${gruppe.length} ${gruppe.length === 1 ? "Veranstaltung" : "Veranstaltungen"}`,
            colSpan: 8,
          },
          String(summe.plaetze),
          `${summe.teilnehmer}${summe.gemeldet < gruppe.length ? ` (${gruppe.length - summe.gemeldet} offen)` : ""}`,
          `${summe.inFibs}/${gruppe.length}`,
          "",
        ],
      ],
      styles: { fontSize: 7.5, cellPadding: 1.6, overflow: "linebreak" },
      headStyles: { fillColor: [29, 56, 105], fontSize: 7.5 },
      footStyles: { fillColor: [246, 244, 238], textColor: 20, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 17 },
        2: { cellWidth: 55 },
        3: { cellWidth: 36 },
        4: { cellWidth: 15 },
        5: { cellWidth: 30 },
        6: { cellWidth: 12 },
        7: { cellWidth: 30 },
        8: { cellWidth: 12, halign: "right" },
        9: { cellWidth: 13, halign: "right" },
        10: { cellWidth: 12 },
        11: { cellWidth: 24 },
      },
    });

    // jspdf-autotable schreibt die Endposition der letzten Tabelle hierher.
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 10;

    if (y > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      y = 18;
    }
  }

  // --- Gesamtsumme --------------------------------------------------------
  if (y > doc.internal.pageSize.getHeight() - 30) {
    doc.addPage();
    y = 18;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Gesamt", rand, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `${gesamt.termine} Veranstaltungen · ${gesamt.plaetze} geplante Plätze · ` +
      `${gesamt.teilnehmer} gemeldete Teilnehmende` +
      (gesamt.termine - gesamt.gemeldet > 0
        ? ` · ${gesamt.termine - gesamt.gemeldet} Meldungen noch offen`
        : "") +
      (gesamt.termine - gesamt.inFibs > 0
        ? ` · ${gesamt.termine - gesamt.inFibs} nicht in FIBS`
        : ""),
    rand,
    y + 5,
  );

  // --- Seitenzahlen -------------------------------------------------------
  const seiten = doc.getNumberOfPages();
  for (let seite = 1; seite <= seiten; seite += 1) {
    doc.setPage(seite);
    doc.setFontSize(8);
    doc.setTextColor(130);
    doc.text(
      `Seite ${seite} von ${seiten}`,
      breite - rand,
      doc.internal.pageSize.getHeight() - 8,
      { align: "right" },
    );
  }

  await auditLog({
    userId: user.id,
    aktion: "UPDATE",
    entitaet: "Export",
    details: { format: "pdf", anzahl: fortbildungen.length, reiter: reiter || "alle" },
  });

  const puffer = Buffer.from(doc.output("arraybuffer"));
  const dateiname = `fortbildungen-uamm-${berlinIsoDatum(new Date())}.pdf`;

  return new NextResponse(puffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${dateiname}"`,
      "Cache-Control": "no-store",
    },
  });
}

function beschreibeZeitraum(
  fortbildungen: Array<{ beginn: Date; ende: Date }>,
): string {
  if (fortbildungen.length === 0) return "Keine Veranstaltungen in der Auswahl";

  const frueheste = fortbildungen.reduce(
    (a, f) => (f.beginn < a ? f.beginn : a),
    fortbildungen[0]!.beginn,
  );
  const spaeteste = fortbildungen.reduce(
    (a, f) => (f.ende > a ? f.ende : a),
    fortbildungen[0]!.ende,
  );

  return `Zeitraum ${formatDatum(frueheste)} bis ${formatDatum(spaeteste)} · ${fortbildungen.length} Veranstaltungen`;
}
