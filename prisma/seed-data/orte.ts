/**
 * Veranstaltungsorte: Grund- und Mittelschulen im Landkreis Unterallgäu und
 * in der Stadt Memmingen, dazu der Sonderfall "ViKo (online)" für eSessions.
 *
 * Quelle: Schulverzeichnis des Staatlichen Schulamts, abgerufen am 31.07.2026
 *   https://schulamt.unterallgaeu.de/schulamt/schulverzeichnis/grundschulen-und-mittelschulen/im-landkreis-unterallgaeu
 *   https://schulamt.unterallgaeu.de/schulamt/schulverzeichnis/grundschulen-und-mittelschulen/in-der-stadt-memmingen
 *
 * Schulnummern ergänzt aus dem RvS-Schulverzeichnis (MM/UA), 09.11.2026:
 * https://www.regierung.schwaben.bayern.de/fachverfahren/schulverzeichnisse/grundschulen/index.php
 *
 * Namen und Anschriften sind unverändert übernommen. Ändert sich etwas
 * (Zusammenlegung, Umbenennung, Umzug), lässt sich das entweder hier pflegen
 * und neu seeden oder direkt unter /admin/orte bearbeiten — der Seed arbeitet
 * mit upsert und überschreibt bestehende Einträge nicht destruktiv.
 */

export interface OrtSeed {
  name: string;
  schulnummer?: string;
  ort?: string;
  strasse?: string;
  istOnline?: boolean;
  sortOrder?: number;
}

/** Sortierung: Online zuerst, dann Schulamt, dann Memmingen, dann Landkreis. */
const SORT_ONLINE = 0;
const SORT_SCHULAMT = 1;
const SORT_MEMMINGEN = 10;
const SORT_LANDKREIS = 20;

/** Grund- und Mittelschulen in der Stadt Memmingen. */
const MEMMINGEN: OrtSeed[] = [
  { name: "Bismarckschule, Mittelschule Memmingen", schulnummer: "8580", strasse: "St.-Josefs-Kirchplatz 1", ort: "Memmingen" },
  { name: "Edith-Stein-Schule, Grundschule Memmingen", schulnummer: "8583", strasse: "Kneippstraße 22", ort: "Memmingen" },
  { name: "Elsbethenschule, Grundschule Memmingen", schulnummer: "8582", strasse: "St.-Josefs-Kirchplatz 3", ort: "Memmingen" },
  { name: "Lindenschule, Mittelschule Memmingen", schulnummer: "8581", strasse: "Maserstraße 2", ort: "Memmingen" },
  { name: "Theodor-Heuss-Schule, Grundschule Memmingen", schulnummer: "8585", strasse: "Machnigstraße 8", ort: "Memmingen" },
  { name: "Grundschule Memmingen-Amendingen", schulnummer: "8418", strasse: "Waimerstraße 10", ort: "Memmingen" },
  { name: "Mittelschule Memmingen-Amendingen", schulnummer: "8586", strasse: "Waimerstraße 10", ort: "Memmingen" },
  { name: "Grundschule Memmingen-Dickenreishausen", schulnummer: "8862", strasse: "Oberdorfstraße 34", ort: "Memmingen" },
  { name: "Grundschule Memmingen-Steinheim", schulnummer: "8882", strasse: "Schulweg 2", ort: "Memmingen" },
  { name: "Grundschule St. Aloysius, Privatschule Memmingen", schulnummer: "8421", strasse: "Pfarrhofstraße 6", ort: "Memmingen" },
];

/** Grund- und Mittelschulen im Landkreis Unterallgäu. */
const LANDKREIS: OrtSeed[] = [
  { name: "Grundschule Babenhausen", schulnummer: "8855", strasse: "Pestalozzistraße 10", ort: "Babenhausen" },
  { name: "Mittelschule Babenhausen", schulnummer: "8856", strasse: "Pestalozzistraße 7", ort: "Babenhausen" },
  { name: "Sebastian-Kneipp-Grundschule Bad Grönenbach", schulnummer: "8990", strasse: "Kemptener Straße 7", ort: "Bad Grönenbach" },
  { name: "Sebastian-Kneipp-Mittelschule Bad Grönenbach", schulnummer: "8867", strasse: "Kemptener Straße 7", ort: "Bad Grönenbach" },
  { name: "Pfarrer-Kneipp-Grundschule Bad Wörishofen", schulnummer: "8985", strasse: "Kaufbeurer Straße 12", ort: "Bad Wörishofen" },
  { name: "Pfarrer-Kneipp-Mittelschule Bad Wörishofen", schulnummer: "8857", strasse: "Kaufbeurer Straße 12", ort: "Bad Wörishofen" },
  { name: "Grundschule Benningen-Lachen", schulnummer: "8859", strasse: "Hawanger Straße 2", ort: "Benningen" },
  { name: "Dominikus-Hertel-Grundschule Boos", schulnummer: "8860", strasse: "Jahnstraße 7", ort: "Boos" },
  { name: "Grundschule Buxheim", schulnummer: "8861", strasse: "Wiesenstraße 7", ort: "Buxheim" },
  { name: "Grundschule Dirlewang", schulnummer: "8863", strasse: "Marktstraße 23", ort: "Dirlewang" },
  { name: "Grundschule Egg a.d. Günz", schulnummer: "8864", strasse: "Dr.-Eck-Platz 1", ort: "Egg a.d. Günz" },
  { name: "Grundschule Erkheim", schulnummer: "8979", strasse: "Schulweg 1", ort: "Erkheim" },
  { name: "Mittelschule Erkheim", schulnummer: "8865", strasse: "Schulweg 1", ort: "Erkheim" },
  { name: "Albert-Schweitzer-Grundschule Ettringen", schulnummer: "8986", strasse: "Schulstraße 10", ort: "Ettringen" },
  { name: "Albert-Schweitzer-Mittelschule Ettringen", schulnummer: "8866", strasse: "Schulstraße 10", ort: "Ettringen" },
  { name: "Grundschule Heimertingen", schulnummer: "8868", strasse: "Sechsbaumweg 5", ort: "Heimertingen" },
  { name: "Grundschule Illerbeuren", schulnummer: "8871", strasse: "Anton-Hohl-Straße 2", ort: "Kronburg-Illerbeuren" },
  { name: "Grundschule Kammlach", schulnummer: "8562", strasse: "Obere Hauptstraße 56", ort: "Kammlach" },
  { name: "Grundschule Kettershausen", schulnummer: "8889", strasse: "Schulstraße 4", ort: "Kettershausen" },
  { name: "Grundschule Kirchheim", schulnummer: "8987", strasse: "Angerweg 10", ort: "Kirchheim i. Schw." },
  { name: "Mittelschule Kirchheim", schulnummer: "8870", strasse: "Angerweg 10", ort: "Kirchheim i. Schw." },
  { name: "Grundschule Legau", schulnummer: "8957", strasse: "Altusrieder Straße 13", ort: "Legau" },
  { name: "Mittelschule Legau", schulnummer: "8872", strasse: "Altusrieder Straße 13", ort: "Legau" },
  { name: "Grundschule Markt Rettenbach", schulnummer: "8989", strasse: "Schulstraße 26", ort: "Markt Rettenbach" },
  { name: "Mittelschule Markt Rettenbach", schulnummer: "8873", strasse: "Schulstraße 26", ort: "Markt Rettenbach" },
  { name: "Christoph-Scheiner-Grundschule Markt Wald", schulnummer: "8874", strasse: "Schnerzhofer Straße 18", ort: "Markt Wald" },
  { name: "Grund- und Mittelschule Memmingerberg", strasse: "August-Hederer-Straße 11", ort: "Memmingerberg" },
  { name: "Grundschule Mindelheim", schulnummer: "8876", strasse: "Brennerstraße 3", ort: "Mindelheim" },
  { name: "Mittelschule Mindelheim", schulnummer: "8877", strasse: "Brennerstraße 5", ort: "Mindelheim" },
  { name: "St.-Josef-Schule, Kath. Freie Grundschule Mindelheim", schulnummer: "3296", strasse: "Champagnatplatz 1", ort: "Mindelheim" },
  { name: "Grundschule Ottobeuren", schulnummer: "8878", strasse: "Bergstraße 78", ort: "Ottobeuren" },
  { name: "Mittelschule Ottobeuren", schulnummer: "8879", strasse: "Bergstraße 80", ort: "Ottobeuren" },
  { name: "Grundschule Pfaffenhausen", schulnummer: "8978", strasse: "Schulstraße 9", ort: "Pfaffenhausen" },
  { name: "Mittelschule Pfaffenhausen", schulnummer: "8880", strasse: "Schulstraße 9", ort: "Pfaffenhausen" },
  { name: "Grundschule Sontheim", schulnummer: "8881", strasse: "Hauptstraße 41", ort: "Sontheim" },
  { name: "Grundschule Türkheim", schulnummer: "8883", strasse: "Wörishofer Straße 5", ort: "Türkheim" },
  { name: "Ludwig-Aurbacher-Mittelschule Türkheim", schulnummer: "8884", strasse: "Oberjägerstraße 7", ort: "Türkheim" },
  { name: "Grundschule Tussenhausen", schulnummer: "8885", strasse: "Marktplatz 4", ort: "Tussenhausen" },
  { name: "Grundschule Westerheim", schulnummer: "8886", strasse: "Bahnhofstraße 2", ort: "Westerheim" },
  { name: "Grundschule Wiedergeltingen", schulnummer: "8887", strasse: "Mindelheimer Straße 26", ort: "Wiedergeltingen" },
  { name: "Grundschule Wolfertschwenden", schulnummer: "8577", strasse: "Am Sportplatz 7", ort: "Wolfertschwenden" },
  { name: "Grundschule Woringen", schulnummer: "8888", strasse: "Kempter Straße 10", ort: "Woringen" },
];

export const ORTE_SEED: OrtSeed[] = [
  { name: "ViKo (online)", istOnline: true, sortOrder: SORT_ONLINE },
  {
    name: "Staatliches Schulamt Memmingen-Unterallgäu",
    ort: "Mindelheim",
    sortOrder: SORT_SCHULAMT,
  },
  ...MEMMINGEN.map((o) => ({ ...o, sortOrder: SORT_MEMMINGEN })),
  ...LANDKREIS.map((o) => ({ ...o, sortOrder: SORT_LANDKREIS })),
];
