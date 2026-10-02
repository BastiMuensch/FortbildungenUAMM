import "server-only";

import type { jsPDF } from "jspdf";

import { qrMatrix } from "@/lib/qr";

/**
 * Zeichnet einen QR-Code gestaltet in ein PDF.
 *
 * Statt harter schwarzer Quadrate: abgerundete Datenpunkte und Sucher mit
 * abgerundeten Ecken, in der Hausfarbe. Das ist keine Spielerei — ein Aushang
 * im Lehrerzimmer konkurriert mit zwanzig anderen Zetteln.
 *
 * Die Gestaltung bleibt dabei innerhalb dessen, was die Norm erlaubt:
 * Modulform und Farbe sind frei, solange der Kontrast stimmt und die
 * Ruhezone frei bleibt. Die Fehlerkorrektur steht auf H (rund 30 %), damit
 * das Logo in der Mitte nichts kaputt macht.
 */

export interface QrGestaltung {
  /** Linke obere Ecke in Millimetern. */
  x: number;
  y: number;
  /** Kantenlänge des Codes ohne Ruhezone, in Millimetern. */
  groesse: number;
  /** Modulfarbe als RGB 0–255. */
  farbe: [number, number, number];
  /** Optionales Logo für die Mitte. */
  logo?: { daten: string; format: "PNG" | "JPEG"; seitenverhaeltnis: number };
}

export function zeichneQr(doc: jsPDF, text: string, stil: QrGestaltung): void {
  const { module, funktionsmodule, groesse: n } = qrMatrix(text, "H");
  const modulGroesse = stil.groesse / n;

  // Vier vollständige Module Ruhezone gehören zum Code, auch wenn später
  // ein farbiger Hintergrund hinter dem Anmeldebereich verwendet wird.
  const ruhezone = 4 * modulGroesse;
  doc.setFillColor(255, 255, 255);
  doc.rect(stil.x - ruhezone, stil.y - ruhezone, stil.groesse + 2 * ruhezone, stil.groesse + 2 * ruhezone, "F");

  doc.setFillColor(...stil.farbe);

  // Die drei Sucher werden eigens gezeichnet — als Ring mit abgerundeten
  // Ecken statt als Klotz aus 49 Einzelmodulen.
  const sucherEcken: Array<[number, number]> = [
    [0, 0],
    [0, n - 7],
    [n - 7, 0],
  ];

  const imSucher = (zeile: number, spalte: number): boolean =>
    sucherEcken.some(
      ([z0, s0]) => zeile >= z0 && zeile < z0 + 7 && spalte >= s0 && spalte < s0 + 7,
    );

  // Aussparung für das Logo: nur so groß, dass die Fehlerkorrektur sie
  // sicher ausgleicht (Scanprüfung mit Logo in scripts/aushangPruefungen.cjs).
  // Eine ungerade Modulzahl hält das Logo exakt mittig. 18 % lassen auch
  // bei kurzen Links genügend Reserven in den einzelnen Korrekturblöcken.
  const logoFeld = stil.logo ? Math.max(3, 2 * Math.floor(n * 0.18 / 2) + 1) : 0;
  const logoVon = Math.floor((n - logoFeld) / 2);
  const imLogo = (zeile: number, spalte: number): boolean =>
    logoFeld > 0 &&
    zeile >= logoVon &&
    zeile < logoVon + logoFeld &&
    spalte >= logoVon &&
    spalte < logoVon + logoFeld;

  // --- Datenmodule als abgerundete Punkte ---------------------------------
  const punkt = modulGroesse * 0.86;
  const versatz = (modulGroesse - punkt) / 2;

  for (let zeile = 0; zeile < n; zeile += 1) {
    for (let spalte = 0; spalte < n; spalte += 1) {
      if (!module[zeile]![spalte]) continue;
      if (imSucher(zeile, spalte) || imLogo(zeile, spalte)) continue;

      // Ausrichtungs- und Taktmuster müssen zusammenhängend bleiben.
      // Einzelne runde Punkte können sonst wie zusätzliche Sucher wirken.
      if (funktionsmodule[zeile]![spalte]) {
        doc.rect(stil.x + spalte * modulGroesse, stil.y + zeile * modulGroesse, modulGroesse, modulGroesse, "F");
        continue;
      }

      doc.roundedRect(
        stil.x + spalte * modulGroesse + versatz,
        stil.y + zeile * modulGroesse + versatz,
        punkt,
        punkt,
        punkt * 0.35,
        punkt * 0.35,
        "F",
      );
    }
  }

  // --- Sucher ------------------------------------------------------------
  for (const [z0, s0] of sucherEcken) {
    const x = stil.x + s0 * modulGroesse;
    const y = stil.y + z0 * modulGroesse;
    const kante = 7 * modulGroesse;

    // Äußerer Ring: gefülltes Quadrat, dann weiß ausgestanzt
    doc.setFillColor(...stil.farbe);
    doc.roundedRect(x, y, kante, kante, modulGroesse * 0.5, modulGroesse * 0.5, "F");

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(
      x + modulGroesse,
      y + modulGroesse,
      kante - 2 * modulGroesse,
      kante - 2 * modulGroesse,
      modulGroesse * 0.3,
      modulGroesse * 0.3,
      "F",
    );

    doc.setFillColor(...stil.farbe);
    doc.roundedRect(
      x + 2 * modulGroesse,
      y + 2 * modulGroesse,
      3 * modulGroesse,
      3 * modulGroesse,
      modulGroesse * 0.2,
      modulGroesse * 0.2,
      "F",
    );
  }

  // --- Logo --------------------------------------------------------------
  if (stil.logo && logoFeld > 0) {
    const feld = logoFeld * modulGroesse;
    const x = stil.x + logoVon * modulGroesse;
    const y = stil.y + logoVon * modulGroesse;

    // Weißer Grund mit etwas Luft, damit das Logo nicht in den Modulen klebt
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(
      x - modulGroesse * 0.4,
      y - modulGroesse * 0.4,
      feld + modulGroesse * 0.8,
      feld + modulGroesse * 0.8,
      modulGroesse,
      modulGroesse,
      "F",
    );

    // Seitenverhältnis wahren, damit das Logo nicht verzerrt
    const breite = stil.logo.seitenverhaeltnis >= 1 ? feld : feld * stil.logo.seitenverhaeltnis;
    const hoehe = stil.logo.seitenverhaeltnis >= 1 ? feld / stil.logo.seitenverhaeltnis : feld;

    doc.addImage(
      stil.logo.daten,
      stil.logo.format,
      x + (feld - breite) / 2,
      y + (feld - hoehe) / 2,
      breite,
      hoehe,
    );
  }
}
