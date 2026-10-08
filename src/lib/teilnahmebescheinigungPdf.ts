import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { jsPDF } from "jspdf";
import { formatDatum, formatDatumAusgeschrieben, formatZeit } from "@/lib/datetime";
import { MAX_BESCHEINIGUNGEN } from "@/lib/teilnahmebescheinigung";

export interface BescheinigungsDaten {
  titel: string;
  beginn: Date;
  ende: Date;
  ort: string;
  bezirk: string;
  bdbs: Array<{ name: string; unterschrift?: Uint8Array | null }>;
  referenten: string[];
}

export class BescheinigungsFehler extends Error {}

const BLAU = "#2589c7";
const DUNKEL = "#15384d";
const TEXT = "#243944";
const GRAU = "#63737c";
const LINIE = "#bccdd7";
const vorlagenPfad = path.join(process.cwd(), "src", "assets", "teilnahmebescheinigung");

/** Schriften und Logo werden lokal eingebettet, ohne externe Abrufe. */
async function ladeVorlagen() {
  const [normal, fett, logo] = await Promise.all([
    readFile(path.join(vorlagenPfad, "Carlito-Regular.ttf"), "base64"),
    readFile(path.join(vorlagenPfad, "Carlito-Bold.ttf"), "base64"),
    readFile(path.join(vorlagenPfad, "bdb-logo.png")),
  ]);
  return { normal, fett, logo };
}

/** Alle Namen und Titel bleiben vollständig; bei Platzmangel werden Abstände kompakter. */
function planeSeite(pdf: jsPDF, daten: BescheinigungsDaten, faktor: number) {
  const schritte: Array<() => void> = [];
  const sauber = (inhalt: string) => inhalt.normalize("NFC").replace(/\s+/g, " ").trim();
  function umbrechen(inhalt: string, breite: number, groesse: number, fett = false): string[] {
    pdf.setFont("Carlito", fett ? "bold" : "normal");
    pdf.setFontSize(groesse);
    return pdf.splitTextToSize(sauber(inhalt), breite) as string[];
  }
  function text(inhalt: string | string[], x: number, y: number, groesse = 11, fett = false, farbe = TEXT) {
    schritte.push(() => {
      pdf.setFont("Carlito", fett ? "bold" : "normal");
      pdf.setFontSize(groesse);
      pdf.setTextColor(farbe);
      pdf.text(inhalt, x, y, { lineHeightFactor: 1.2 });
    });
  }
  function strich(y: number, x1 = 20, x2 = 190, farbe = LINIE, staerke = 0.22) {
    schritte.push(() => {
      pdf.setDrawColor(farbe);
      pdf.setLineWidth(staerke);
      pdf.line(x1, y, x2, y);
    });
  }
  const zeilenhoehe = (groesse: number) => groesse * 25.4 / 72 * 1.2;

  text("SCHULAMTSBEZIRK", 119, 25, 8.5, true, BLAU);
  const bezirkZeilen = umbrechen(daten.bezirk, 71, 12, true);
  text(bezirkZeilen, 119, 32, 12, true, DUNKEL);
  const kopfEnde = 32 + (bezirkZeilen.length - 1) * zeilenhoehe(12) + 7;
  text("Beratung digitale Bildung", 119, kopfEnde, 9.5, false, GRAU);
  const trennlinie = Math.max(57, kopfEnde + 8);
  strich(trennlinie);
  strich(trennlinie, 20, 49, BLAU, 0.8);

  let y = trennlinie + 16 * faktor;
  text("SCHULINTERNE LEHRERFORTBILDUNG · SchiLf", 20, y, 9, true, BLAU);
  y += 16 * faktor;
  text("Teilnahmebescheinigung", 20, y, Math.max(26, 31 * faktor), true, DUNKEL);
  y += 27 * faktor;
  strich(y, 20, 190, "#7f98a6", 0.28);
  y += 6;
  text("Vor- und Nachname der teilnehmenden Person", 20, y, 9, false, GRAU);
  y += 18 * faktor;
  text("Hiermit wird die Teilnahme an der Veranstaltung", 20, y, 12);

  const titelgroesse = Math.max(18, 23 * faktor);
  let titelZeilen = umbrechen(daten.titel, 170, titelgroesse, true);
  // Möglichst ausgeglichene Zeilen statt eines einzelnen Wortes am Ende.
  const titelZeilenAnzahl = titelZeilen.length;
  if (titelZeilenAnzahl > 1) {
    for (let breite = 169; breite >= 85; breite--) {
      const vorschlag = umbrechen(daten.titel, breite, titelgroesse, true);
      if (vorschlag.length > titelZeilenAnzahl) break;
      titelZeilen = vorschlag;
    }
  }
  y += 13 * faktor;
  text(titelZeilen, 20, y, titelgroesse, true, DUNKEL);
  y += (titelZeilen.length - 1) * zeilenhoehe(titelgroesse) + 11 * faktor;
  text("bestätigt.", 20, y, 12);
  y += 11 * faktor;
  strich(y);

  const gleicherTag = formatDatum(daten.beginn) === formatDatum(daten.ende);
  const datum = gleicherTag ? formatDatumAusgeschrieben(daten.beginn) : `${formatDatum(daten.beginn)} bis ${formatDatum(daten.ende)}`;
  const dauer = Math.round((daten.ende.getTime() - daten.beginn.getTime()) / 60_000);
  const angaben = [
    { x: 20, breite: 59, titel: gleicherTag ? "DATUM" : "ZEITRAUM", wert: datum },
    { x: 83, breite: 57, titel: gleicherTag ? "UHRZEIT" : "BEGINN / ENDE", wert: `${formatZeit(daten.beginn)} bis ${formatZeit(daten.ende)} Uhr` },
    { x: 144, breite: 46, titel: "DAUER", wert: `${dauer} Minuten` },
  ];
  let angabenZeilen = 1;
  for (const angabe of angaben) {
    text(angabe.titel, angabe.x, y + 8, 8, true, GRAU);
    const zeilen = umbrechen(angabe.wert, angabe.breite, 11, true);
    text(zeilen, angabe.x, y + 15, 11, true);
    angabenZeilen = Math.max(angabenZeilen, zeilen.length);
  }
  y += 15 + (angabenZeilen - 1) * zeilenhoehe(11) + 11 * faktor;
  const ortZeilen = umbrechen(daten.ort, 141, 10);
  text("Ort", 20, y, 10, true, GRAU);
  text(ortZeilen, 49, y, 10);
  y += (ortZeilen.length - 1) * zeilenhoehe(10);
  if (daten.referenten.length) {
    y += 8 * faktor;
    const namenZeilen = umbrechen(daten.referenten.join(", "), 141, 10);
    text("Referierende", 20, y, 10, true, GRAU);
    text(namenZeilen, 49, y, 10);
    y += (namenZeilen.length - 1) * zeilenhoehe(10);
  }

  // Bestätigungsbereich unten verankern; weitere BdBs erhalten weitere Zeilen.
  const bdbZeilen = daten.bdbs.map((bdb, index) => ({ zeilen: umbrechen(bdb.name, 78, 11, true), unterschrift: bdb.unterschrift, index }));
  const reihen = [];
  for (let i = 0; i < bdbZeilen.length; i += 2) {
    const namen = bdbZeilen.slice(i, i + 2);
    const abstandNaechsteUnterschrift = bdbZeilen.slice(i + 2, i + 4).some((bdb) => bdb.unterschrift) ? 11 * faktor : 0;
    reihen.push({ namen, hoehe: 23 * faktor + abstandNaechsteUnterschrift + (Math.max(...namen.map(({ zeilen }) => zeilen.length)) - 1) * zeilenhoehe(11) });
  }
  const bestaetigungsZeilen = umbrechen(`Für den Schulamtsbezirk ${daten.bezirk}`, 170, 11, true);
  const bestaetigungsHoehe = (bestaetigungsZeilen.length - 1) * zeilenhoehe(11);
  const fussOben = 272 - reihen.reduce((summe, reihe) => summe + reihe.hoehe, 0) - bestaetigungsHoehe - 10 * faktor;
  if (y + 20 * faktor > fussOben) return null;
  strich(fussOben - 12 * faktor);
  text(bestaetigungsZeilen, 20, fussOben, 11, true, DUNKEL);
  let fussY = fussOben + bestaetigungsHoehe + 10 * faktor;
  for (const reihe of reihen) {
    reihe.namen.forEach(({ zeilen, unterschrift, index }, spalte) => {
      const x = spalte === 0 ? 20 : 112;
      const linienY = fussY + 10 * faktor;
      if (unterschrift) {
        // Seitenverhältnis erhalten und Bild vollständig oberhalb der Linie halten.
        const bild = pdf.getImageProperties(unterschrift);
        const skalierung = Math.min(70 / bild.width, (15 * faktor) / bild.height);
        const breite = bild.width * skalierung;
        const hoehe = bild.height * skalierung;
        schritte.push(() => pdf.addImage(unterschrift, "PNG", x + 2, linienY - hoehe - 1, breite, hoehe, `bdb-unterschrift-${index}`));
      }
      strich(linienY, x, x + 78);
      text(zeilen, x, linienY + 7 * faktor, 11, true, DUNKEL);
      text("Beratung digitale Bildung (BdB)", x, linienY + 13 * faktor + (zeilen.length - 1) * zeilenhoehe(11), 9, false, GRAU);
    });
    fussY += reihe.hoehe;
  }
  return schritte;
}

export async function erstelleTeilnahmebescheinigung(daten: BescheinigungsDaten, anzahl: number): Promise<ArrayBuffer> {
  if (!Number.isInteger(anzahl) || anzahl < 1 || anzahl > MAX_BESCHEINIGUNGEN) {
    throw new BescheinigungsFehler("Bitte eine Anzahl zwischen 1 und 100 wählen.");
  }
  if (!daten.bdbs.length || daten.bdbs.some((bdb) => !bdb.name.trim())) {
    throw new BescheinigungsFehler("Die Namen der zuständigen BdBs fehlen.");
  }
  if (!Number.isFinite(daten.beginn.getTime()) || !Number.isFinite(daten.ende.getTime()) || daten.ende <= daten.beginn) {
    throw new BescheinigungsFehler("Beginn und Ende der Veranstaltung müssen geprüft werden.");
  }
  const vorlagen = await ladeVorlagen();
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true, putOnlyUsedFonts: true });
  pdf.addFileToVFS("Carlito-Regular.ttf", vorlagen.normal);
  pdf.addFont("Carlito-Regular.ttf", "Carlito", "normal");
  pdf.addFileToVFS("Carlito-Bold.ttf", vorlagen.fett);
  pdf.addFont("Carlito-Bold.ttf", "Carlito", "bold");
  pdf.setProperties({ title: `Teilnahmebescheinigung: ${daten.titel}`, author: `Beratung digitale Bildung - ${daten.bezirk}` });
  let schritte: Array<() => void> | null = null;
  for (const faktor of [1, 0.88, 0.76, 0.64]) {
    schritte = planeSeite(pdf, daten, faktor);
    if (schritte) break;
  }
  if (!schritte) {
    throw new BescheinigungsFehler("Die Angaben passen nicht vollständig auf eine A4-Seite. Bitte Veranstaltungstitel, Ortsangabe und BdB-Namen auf überlange Einträge prüfen.");
  }
  for (let exemplar = 0; exemplar < anzahl; exemplar++) {
    if (exemplar > 0) pdf.addPage();
    pdf.addImage(vorlagen.logo, "PNG", 20, 18, 57, 30.05, "bdb-logo");
    schritte.forEach((zeichnen) => zeichnen());
  }
  return pdf.output("arraybuffer");
}
