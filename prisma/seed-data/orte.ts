/**
 * Veranstaltungsorte: Grund- und Mittelschulen in Memmingen und im Landkreis
 * Unterallgäu, dazu der Sonderfall "Online" für eSessions.
 *
 * ACHTUNG — Platzhalterliste. Die Einträge folgen dem Schema
 * "Grundschule <Ort>" / "Mittelschule <Ort>" und sind noch nicht mit dem
 * amtlichen Schulverzeichnis abgeglichen (offizielle Bezeichnungen,
 * Schulnummern, Verbünde, Außenstellen). Vor dem Produktivbetrieb durch die
 * echte Liste ersetzen; die Orte lassen sich auch im Admin unter
 * /admin/orte pflegen.
 */

export interface OrtSeed {
  name: string;
  ort?: string;
  istOnline?: boolean;
  sortOrder?: number;
}

/** Kommunen mit Grund- und/oder Mittelschulstandort im Sprengel. */
const STANDORTE: Array<{ ort: string; grundschule: boolean; mittelschule: boolean }> = [
  { ort: "Memmingen", grundschule: true, mittelschule: true },
  { ort: "Memmingerberg", grundschule: true, mittelschule: false },
  { ort: "Mindelheim", grundschule: true, mittelschule: true },
  { ort: "Bad Wörishofen", grundschule: true, mittelschule: true },
  { ort: "Bad Grönenbach", grundschule: true, mittelschule: true },
  { ort: "Babenhausen", grundschule: true, mittelschule: true },
  { ort: "Ottobeuren", grundschule: true, mittelschule: true },
  { ort: "Türkheim", grundschule: true, mittelschule: true },
  { ort: "Pfaffenhausen", grundschule: true, mittelschule: true },
  { ort: "Erkheim", grundschule: true, mittelschule: true },
  { ort: "Legau", grundschule: true, mittelschule: true },
  { ort: "Kirchheim in Schwaben", grundschule: true, mittelschule: false },
  { ort: "Boos", grundschule: true, mittelschule: false },
  { ort: "Buxheim", grundschule: true, mittelschule: false },
  { ort: "Dirlewang", grundschule: true, mittelschule: false },
  { ort: "Ettringen", grundschule: true, mittelschule: false },
  { ort: "Fellheim", grundschule: true, mittelschule: false },
  { ort: "Heimertingen", grundschule: true, mittelschule: false },
  { ort: "Holzgünz", grundschule: true, mittelschule: false },
  { ort: "Kettershausen", grundschule: true, mittelschule: false },
  { ort: "Kronburg", grundschule: true, mittelschule: false },
  { ort: "Lachen", grundschule: true, mittelschule: false },
  { ort: "Markt Rettenbach", grundschule: true, mittelschule: false },
  { ort: "Markt Wald", grundschule: true, mittelschule: false },
  { ort: "Niederrieden", grundschule: true, mittelschule: false },
  { ort: "Oberrieden", grundschule: true, mittelschule: false },
  { ort: "Oberschönegg", grundschule: true, mittelschule: false },
  { ort: "Rammingen", grundschule: true, mittelschule: false },
  { ort: "Sontheim", grundschule: true, mittelschule: false },
  { ort: "Stetten", grundschule: true, mittelschule: false },
  { ort: "Trunkelsberg", grundschule: true, mittelschule: false },
  { ort: "Tussenhausen", grundschule: true, mittelschule: false },
  { ort: "Ungerhausen", grundschule: true, mittelschule: false },
  { ort: "Westerheim", grundschule: true, mittelschule: false },
  { ort: "Wiedergeltingen", grundschule: true, mittelschule: false },
  { ort: "Wolfertschwenden", grundschule: true, mittelschule: false },
  { ort: "Woringen", grundschule: true, mittelschule: false },
];

export const ORTE_SEED: OrtSeed[] = [
  // Sonderfälle zuerst, damit sie in der Auswahlliste oben stehen.
  { name: "Online", istOnline: true, sortOrder: 0 },
  { name: "Staatliches Schulamt Memmingen-Unterallgäu", ort: "Mindelheim", sortOrder: 1 },
  ...STANDORTE.flatMap<OrtSeed>(({ ort, grundschule, mittelschule }) => [
    ...(grundschule ? [{ name: `Grundschule ${ort}`, ort, sortOrder: 10 }] : []),
    ...(mittelschule ? [{ name: `Mittelschule ${ort}`, ort, sortOrder: 20 }] : []),
  ]),
];
