/**
 * Leichtgewichtige Prüfungen der Kernlogik ohne Test-Framework.
 *
 *   npm test
 *
 * Abgedeckt ist, was still und unbemerkt falsch sein kann: das Filtern von
 * HTML, die Zeitzonen-Umrechnung und der Ferienkalender. Die Oberfläche wird
 * hier bewusst nicht geprüft.
 */
import { sanitizeBeschreibung, htmlZuText, istLeer } from "@/lib/sanitize";
import {
  formatDatumZeit,
  fromDatetimeLocalValue,
  parseDeDateTime,
  toDatetimeLocalValue,
  aktuellesSchuljahr,
} from "@/lib/datetime";
import { ferienStatus, terminWarnung } from "@/lib/ferien";
import { bildeSlug } from "@/lib/queries";
import { mapFibsLehrgang } from "@/lib/fibs/mapper";
import { parseSuchergebnis } from "@/lib/fibs/parser";
import { readFileSync } from "node:fs";

let fehler = 0;

function pruefe(name: string, ist: unknown, soll: unknown) {
  const ok = JSON.stringify(ist) === JSON.stringify(soll);
  if (!ok) fehler += 1;
  console.log(
    `${ok ? "  ok  " : "  FEHL"} ${name}` +
      (ok
        ? ""
        : `\n         ist:  ${JSON.stringify(ist)}\n         soll: ${JSON.stringify(soll)}`),
  );
}

console.log("\nHTML-Filterung");
pruefe("script wird entfernt", sanitizeBeschreibung("<p>Hallo</p><script>alert(1)</script>"), "<p>Hallo</p>");
pruefe("Event-Attribut wird entfernt", sanitizeBeschreibung('<p onclick="alert(1)">Hallo</p>'), "<p>Hallo</p>");
pruefe(
  "javascript:-Link wird entschärft",
  sanitizeBeschreibung('<a href="javascript:alert(1)">x</a>'),
  '<a target="_blank" rel="noopener noreferrer nofollow">x</a>',
);
pruefe(
  "erlaubtes Markup bleibt",
  sanitizeBeschreibung("<p><strong>fett</strong> und <em>kursiv</em></p>"),
  "<p><strong>fett</strong> und <em>kursiv</em></p>",
);
pruefe("Klartext trennt Blöcke", htmlZuText("<p>Ende</p><p>Anfang</p>"), "Ende Anfang");
pruefe("leerer Editor erkannt", istLeer("<p></p>"), true);

console.log("\nDatum und Zeitzone");
pruefe("Sommerzeit (MESZ, +2)", parseDeDateTime("15.10.2026 14:00")?.toISOString(), "2026-10-15T12:00:00.000Z");
pruefe("Winterzeit (MEZ, +1)", parseDeDateTime("15.01.2027 09:30")?.toISOString(), "2027-01-15T08:30:00.000Z");
pruefe("ungültiges Datum abgelehnt", parseDeDateTime("31.02.2026"), null);
pruefe("Hin- und Rückweg stabil", toDatetimeLocalValue(fromDatetimeLocalValue("2026-10-15T14:00")!), "2026-10-15T14:00");
pruefe("Anzeige auf Deutsch", formatDatumZeit(new Date("2026-10-15T12:00:00Z")), "15.10.2026, 14:00");
pruefe("Schuljahr wechselt im August", aktuellesSchuljahr(new Date("2026-08-01T10:00:00Z")), "2026/2027");
pruefe("Schuljahr im Juli", aktuellesSchuljahr(new Date("2026-07-31T10:00:00Z")), "2025/2026");

console.log("\nFerien und Feiertage (Bayern)");
pruefe("Sommerferien 2026", ferienStatus(new Date("2026-08-10T12:00:00Z")).label, "Sommerferien");
pruefe("normaler Schultag", ferienStatus(new Date("2026-10-15T12:00:00Z")).art, "unterrichtstag");
pruefe("Allerheiligen 2026", ferienStatus(new Date("2026-11-01T12:00:00Z")).label, "Allerheiligen");
pruefe(
  "Tag der Deutschen Einheit schlägt Wochenende",
  ferienStatus(new Date("2026-10-03T12:00:00Z")).label,
  "Tag der Deutschen Einheit",
);
// Fronleichnam 2026 (04.06.) liegt in den Pfingstferien. Für die Frage
// "kann hier eine Fortbildung stattfinden?" ist das ein Ferientag — die
// Ferienauskunft hat deshalb absichtlich Vorrang vor dem Feiertag.
pruefe("Ferien schlagen Feiertag", ferienStatus(new Date("2026-06-04T12:00:00Z")).label, "Pfingstferien");
pruefe("Buß- und Bettag 2026", ferienStatus(new Date("2026-11-18T12:00:00Z")).label, "Buß- und Bettag (unterrichtsfrei)");
pruefe("Samstag", ferienStatus(new Date("2026-10-17T12:00:00Z")).art, "wochenende");
pruefe("Warnung bei Ferien", terminWarnung(new Date("2026-08-10T12:00:00Z"), new Date("2026-08-10T14:00:00Z"))?.art, "ferien");
pruefe("keine Warnung am Schultag", terminWarnung(new Date("2026-10-15T12:00:00Z"), new Date("2026-10-15T14:00:00Z")), null);
pruefe(
  "mehrtägiger Termin läuft in die Ferien",
  terminWarnung(new Date("2026-10-30T12:00:00Z"), new Date("2026-11-03T12:00:00Z"))?.art,
  "ferien",
);
pruefe(
  "außerhalb des gepflegten Zeitraums",
  terminWarnung(new Date("2028-05-10T12:00:00Z"), new Date("2028-05-10T14:00:00Z"))?.art,
  "unbekannt",
);

console.log("\nSlug");
pruefe(
  "Umlaute werden umgeschrieben",
  bildeSlug("Künstliche Intelligenz für Anfänger", new Date("2026-10-15T12:00:00Z"), "abcdef123"),
  "kuenstliche-intelligenz-fuer-anfaenger-2026-10-15-abcdef",
);

console.log("\nFIBS-Import (gegen die Beispieldatei)");
const html = readFileSync("src/lib/fibs/fixtures/suchergebnis.html", "utf8");
const lehrgaenge = parseSuchergebnis(html);
pruefe("drei Treffer erkannt", lehrgaenge.length, 3);
pruefe("Lehrgangsnummer gelesen", lehrgaenge[0]?.lehrgangsnummer, "E123-4/26/1");

const ersteres = mapFibsLehrgang(lehrgaenge[0]!, "https://fibs.example");
pruefe("Präsenztermin gemappt", ersteres.ok && ersteres.daten.format, "PRAESENZ");
pruefe(
  "Beginn in UTC umgerechnet",
  ersteres.ok && ersteres.daten.beginn.toISOString(),
  "2026-10-15T12:00:00.000Z",
);
pruefe("Zielgruppe erkannt", ersteres.ok && ersteres.daten.schularten, ["GRUNDSCHULE"]);

const zweites = mapFibsLehrgang(lehrgaenge[1]!, "https://fibs.example");
pruefe("eSession erkannt", zweites.ok && zweites.daten.format, "ESESSION");
pruefe("Online-Ort erkannt", zweites.ok && zweites.daten.ortIstOnline, true);

const drittes = mapFibsLehrgang(lehrgaenge[2]!, "https://fibs.example");
pruefe("unvollständiger Datensatz wird verworfen", drittes.ok, false);

console.log(
  fehler === 0
    ? "\nAlle Prüfungen bestanden.\n"
    : `\n${fehler} Prüfung(en) fehlgeschlagen.\n`,
);
process.exit(fehler === 0 ? 0 : 1);
