import "server-only";

import type { Fortbildung } from "@prisma/client";
import { jsPDF } from "jspdf";
import { formatLabel, niveaustufeLabel, organisationsformKurz, schulartLabel } from "@/constants/fortbildung";
import { formatDatum, formatDatumLang, formatZeit } from "@/lib/datetime";
import { bestimmeFibsAnmeldestatus } from "@/lib/fibs/status";
import type { GeladenesLogo } from "@/lib/logo";
import { organisationsKennzeichnungen } from "@/lib/namensfreigabe";
import { zeichneQr } from "@/lib/qrZeichnen";
import { leseBeschreibungsAbsaetze, planeBeschreibung } from "@/lib/beschreibungPdf";

type AushangFortbildung = Pick<Fortbildung,
  "titel" | "kurztitel" | "beschreibungHtml" | "organisationsform" | "format" |
  "beginn" | "ende" | "maxTn" | "schularten" | "fach" | "niveaustufe" |
  "inFibs" | "fibsUrl" | "fibsLehrgangsnummer"
> & {
  bezirk: { name: string };
  veranstaltungsort: { name: string };
  referenten: Array<{ referent: { vorname: string; nachname: string } }>;
};

const BLAU = "#1d3869";
const GRAU = "#70747e";
const TEXT = "#2d323c";
const QR_OBEN = 220;
const QR_LINKS = 145;
const QR_KANTE = 45;
const INHALT_UNTEN = QR_OBEN - 14;

export class AushangLayoutFehler extends Error {}

/** Erst vermessen, dann zeichnen: Hauptinhalt und QR-Bereich überlappen nie. */
function planeInhalt(doc: jsPDF, fortbildung: AushangFortbildung, absaetze: ReturnType<typeof leseBeschreibungsAbsaetze>, faktor: number) {
  const schritte: Array<() => void> = [];
  const abstand = (groesse: number) => groesse * 25.4 / 72 * 1.3;
  function zeilen(text: string, breite: number, groesse: number, fett = false): string[] {
    doc.setFont("helvetica", fett ? "bold" : "normal");
    doc.setFontSize(groesse);
    return doc.splitTextToSize(text.replace(/\s+/g, " ").trim(), breite) as string[];
  }
  function text(wert: string | string[], x: number, y: number, groesse: number, fett = false, farbe = TEXT) {
    schritte.push(() => {
      doc.setFont("helvetica", fett ? "bold" : "normal");
      doc.setFontSize(groesse);
      doc.setTextColor(farbe);
      doc.text(wert, x, y, { lineHeightFactor: 1.3 });
    });
  }
  const bezirkZeilen = zeilen(`Schulamtsbezirk ${fortbildung.bezirk.name}`, 79, 9);
  const formZeilen = zeilen(`${organisationsformKurz(fortbildung.organisationsform)} · ${formatLabel(fortbildung.format).toUpperCase()}`, 79, 10, true);
  text(formZeilen, 20, 28, 10, true, BLAU);
  text(bezirkZeilen, 111, 28, 9, false, GRAU);
  let y = 28 + Math.max(formZeilen.length * abstand(10), bezirkZeilen.length * abstand(9)) + 9 * faktor;
  const titelgroesse = Math.max(19, 26 * faktor);
  const titelZeilen = zeilen(fortbildung.titel, 170, titelgroesse, true);
  text(titelZeilen, 20, y, titelgroesse, true, "#141820");
  y += titelZeilen.length * abstand(titelgroesse);
  if (fortbildung.kurztitel) {
    const groesse = Math.max(10, 13 * faktor);
    const untertitel = zeilen(fortbildung.kurztitel, 170, groesse);
    text(untertitel, 20, y + 2, groesse, false, GRAU);
    y += untertitel.length * abstand(groesse) + 2;
  }

  y += 6 * faktor;
  const feldOben = y;
  const wertgroesse = Math.max(10, 12 * faktor);
  const gleicherTag = formatDatum(fortbildung.beginn) === formatDatum(fortbildung.ende);
  const reihen = [
    [
      { label: gleicherTag ? "Termin" : "Zeitraum", wert: gleicherTag ? formatDatumLang(fortbildung.beginn) : `${formatDatum(fortbildung.beginn)} bis ${formatDatum(fortbildung.ende)}` },
      { label: "Ort", wert: fortbildung.veranstaltungsort.name },
    ],
    [
      { label: gleicherTag ? "Uhrzeit" : "Beginn / Ende", wert: `${formatZeit(fortbildung.beginn)} bis ${formatZeit(fortbildung.ende)} Uhr` },
      { label: "Plätze", wert: `${fortbildung.maxTn} Teilnehmende` },
    ],
  ];
  const feldSchritteStart = schritte.length;
  for (const reihe of reihen) {
    const inhalte = reihe.map((angabe) => zeilen(angabe.wert, 73, wertgroesse, true));
    reihe.forEach((angabe, spalte) => {
      const x = spalte === 0 ? 26 : 111;
      text(angabe.label.toUpperCase(), x, y + 7, 8, false, GRAU);
      text(inhalte[spalte], x, y + 13, wertgroesse, true, "#141820");
    });
    y += 13 + (Math.max(...inhalte.map((inhalt) => inhalt.length)) - 1) * abstand(wertgroesse) + 5 * faktor;
  }
  const feldHoehe = y - feldOben;
  schritte.splice(feldSchritteStart, 0, () => {
    doc.setFillColor("#f6f4ee");
    doc.rect(20, feldOben, 170, feldHoehe, "F");
    doc.setFillColor(BLAU);
    doc.rect(20, feldOben, 1.5, feldHoehe, "F");
  });
  y += 10 * faktor;

  const fusszeilen = [
    `Zielgruppe: ${fortbildung.schularten.map(schulartLabel).join(", ")}`,
    ...organisationsKennzeichnungen(fortbildung.bezirk.name),
  ];
  if (fortbildung.fach) fusszeilen.push(`Fach: ${fortbildung.fach}`);
  if (fortbildung.niveaustufe) fusszeilen.push(`DigCompEdu: ${niveaustufeLabel(fortbildung.niveaustufe)}`);
  if (fortbildung.referenten.length) fusszeilen.push(`Leitung: ${fortbildung.referenten.map(({ referent }) => `${referent.vorname} ${referent.nachname}`).join(", ")}`);
  const fussgroesse = Math.max(8.5, 9.5 * faktor);
  const fuss = fusszeilen.flatMap((wert) => zeilen(wert, 170, fussgroesse));
  const fussHoehe = fuss.length * abstand(fussgroesse);
  if (y + fussHoehe > INHALT_UNTEN) return null;

  const textgroesse = Math.max(10, 11 * faktor);
  const beschreibung = planeBeschreibung(doc, absaetze, 170, textgroesse, INHALT_UNTEN - y - fussHoehe - 6);
  for (const zeile of beschreibung.zeilen) {
    y += zeile.abstandVor;
    let x = 20 + zeile.einzug;
    if (zeile.listenzeichen) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(textgroesse);
      text(zeile.listenzeichen, x - doc.getTextWidth(zeile.listenzeichen) - 1.5, y, textgroesse);
    }
    for (const teil of zeile.teile) {
      text(teil.text, x, y, textgroesse, teil.fett);
      doc.setFont("helvetica", teil.fett ? "bold" : "normal");
      doc.setFontSize(textgroesse);
      x += doc.getTextWidth(teil.text);
    }
    y += beschreibung.zeilenhoehe;
  }
  if (beschreibung.zeilen.length) y += 6;
  text(fuss, 20, y, fussgroesse, false, GRAU);
  return { schritte, gekuerzt: beschreibung.gekuerzt };
}

function kuerzeZeile(doc: jsPDF, text: string, breite: number): string {
  if (doc.getTextWidth(text) <= breite) return text;
  let kurz = text.replace(/\s*…$/, "");
  while (kurz && doc.getTextWidth(`${kurz} …`) > breite) kurz = kurz.slice(0, -1);
  return `${kurz.trimEnd()} …`;
}

export function erstelleAushangPdf(fortbildung: AushangFortbildung, adresse: string, logo: GeladenesLogo | null): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const absaetze = leseBeschreibungsAbsaetze(fortbildung.beschreibungHtml);
  let schritte: Array<() => void> | null = null;
  for (const faktor of [1, 0.9, 0.8, 0.7]) {
    const plan = planeInhalt(doc, fortbildung, absaetze, faktor);
    if (!plan) continue;
    schritte = plan.schritte;
    // Zuerst die vollständige Beschreibung versuchen; bei sehr langen Texten
    // bleibt ein strukturierter Auszug mit Verweis auf die Veranstaltungsseite.
    if (!plan.gekuerzt) break;
  }
  if (!schritte) throw new AushangLayoutFehler("Die Veranstaltungsangaben sind für einen einseitigen Aushang zu umfangreich. Bitte Titel, Kurztitel und Ortsangabe auf überlange Einträge prüfen.");
  doc.setFillColor(BLAU);
  doc.rect(0, 0, 210, 6, "F");
  schritte.forEach((zeichnen) => zeichnen());

  doc.setDrawColor("#dce2ea");
  doc.setLineWidth(0.4);
  doc.line(20, QR_OBEN - 8, 190, QR_OBEN - 8);
  zeichneQr(doc, adresse, { x: QR_LINKS, y: QR_OBEN, groesse: QR_KANTE, farbe: [29, 56, 105], logo: logo ?? undefined });

  const anmeldestatus = bestimmeFibsAnmeldestatus(fortbildung);
  const schulintern = anmeldestatus === "SCHILF_INTERN";
  const textbreite = QR_LINKS - 20 - 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(BLAU);
  doc.text(schulintern ? "Alle Infos zum Termin" : "Alle Infos und Anmeldung", 20, QR_OBEN + 10);
  const hinweis = schulintern ? "Code scannen - die Teilnahme wird schulintern organisiert."
    : fortbildung.fibsLehrgangsnummer ? `Code scannen oder in FIBS nach der Lehrgangsnummer ${fortbildung.fibsLehrgangsnummer} suchen.`
      : anmeldestatus === "FIBS_OFFEN" ? "Code scannen - die Anmeldung läuft über FIBS."
        : "Code scannen - der FIBS-Anmeldelink wird ergänzt, sobald er verfügbar ist.";
  doc.setFont("helvetica", "normal");
  doc.setTextColor(TEXT);
  let hinweisZeilen: string[] = [];
  let hinweisgroesse = 10;
  for (const groesse of [10, 9, 8]) {
    doc.setFontSize(groesse);
    hinweisgroesse = groesse;
    hinweisZeilen = doc.splitTextToSize(hinweis, textbreite) as string[];
    if (hinweisZeilen.length <= 4) break;
  }
  if (hinweisZeilen.length > 4) throw new AushangLayoutFehler("Die FIBS-Lehrgangsnummer ist für den Aushang zu lang. Bitte die Nummer prüfen.");
  doc.text(hinweisZeilen, 20, QR_OBEN + 17, { lineHeightFactor: 1.25 });

  // Der lange Veranstaltungspfad steckt vollständig im QR und im PDF-Link.
  // Auf Papier bleibt die kurze Portaladresse innerhalb der linken Spalte.
  doc.setFontSize(9);
  doc.setTextColor(BLAU);
  const linkY = Math.max(QR_OBEN + 36, QR_OBEN + 17 + (hinweisZeilen.length - 1) * hinweisgroesse * 25.4 / 72 * 1.25 + 6);
  doc.textWithLink("Veranstaltung online öffnen", 20, linkY, { url: adresse });
  doc.setFontSize(8);
  doc.setTextColor(GRAU);
  doc.textWithLink(kuerzeZeile(doc, new URL(adresse).host, textbreite), 20, linkY + 6, { url: adresse });
  doc.setFillColor(BLAU);
  doc.rect(0, 293, 210, 4, "F");
  return doc;
}
