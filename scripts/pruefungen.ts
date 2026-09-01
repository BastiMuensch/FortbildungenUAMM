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
import { filterZuWhere, suchbegriffe } from "@/lib/filter";
import { mapFibsLehrgang } from "@/lib/fibs/mapper";
import { parseSuchergebnis } from "@/lib/fibs/parser";
import { fehlendeReferentIds, pruefeVeroeffentlichung } from "@/lib/validation/fortbildung";
import { readFileSync } from "node:fs";
import jsQR from "jsqr";
import { qrMatrix } from "@/lib/qr";
import { liesSessionVersion } from "@/constants/session";
import { DIGCOMP_BAUM } from "../prisma/seed-data/digcomp";
import { NIVEAUSTUFEN } from "@/constants/fortbildung";

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

console.log("\nSitzungstoken");
pruefe("gültige Sitzungsversion", liesSessionVersion(7), 7);
pruefe("fehlende Sitzungsversion wird verworfen", liesSessionVersion(undefined), null);
pruefe("ungültige Sitzungsversion wird verworfen", liesSessionVersion(-1), null);

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
  "Osterferien 2028 sind gepflegt",
  ferienStatus(new Date("2028-04-12T12:00:00Z")).label,
  "Osterferien",
);
pruefe(
  "Sommerferien 2030 sind gepflegt",
  ferienStatus(new Date("2030-09-09T12:00:00Z")).label,
  "Sommerferien",
);
pruefe(
  "außerhalb des gepflegten Zeitraums",
  terminWarnung(new Date("2031-05-12T12:00:00Z"), new Date("2031-05-12T14:00:00Z"))?.art,
  "unbekannt",
);

console.log("\nDigCompEdu Bavaria");
const teilkompetenzen = DIGCOMP_BAUM.flatMap((bereich) => bereich.children);
pruefe("sechs Kompetenzbereiche", DIGCOMP_BAUM.length, 6);
pruefe("22 amtliche Teilkompetenzen", teilkompetenzen.length, 22);
pruefe(
  "keine vorläufige Teilkompetenz",
  teilkompetenzen.some((kompetenz) => kompetenz.istPlatzhalter),
  false,
);
pruefe(
  "amtliche Bezeichnung 4.2",
  teilkompetenzen.find((kompetenz) => kompetenz.code === "4.2")?.titel,
  "Analyse der Lernevidenz",
);
pruefe(
  "amtliche Bezeichnung Bereich 6",
  DIGCOMP_BAUM.find((bereich) => bereich.code === "6")?.titel,
  "Förderung der Medienkompetenz der Lernenden",
);
pruefe(
  "FIBS-Niveaustufen vollständig",
  NIVEAUSTUFEN.map((stufe) => stufe.label),
  ["Niveaustufe I/II", "Niveaustufe III/IV", "Niveaustufe V/VI"],
);

console.log("\nSlug");
pruefe(
  "Umlaute werden umgeschrieben",
  bildeSlug("Künstliche Intelligenz für Anfänger", new Date("2026-10-15T12:00:00Z"), "abcdef123"),
  "kuenstliche-intelligenz-fuer-anfaenger-2026-10-15-abcdef",
);
pruefe(
  "Slug verwendet den Berliner Kalendertag",
  bildeSlug("Abendtermin", new Date("2026-10-14T22:30:00Z"), "abcdef123"),
  "abendtermin-2026-10-15-abcdef",
);

console.log("\nSuche");
pruefe("ein Begriff", suchbegriffe("ipad"), ["ipad"]);
pruefe("zwei Begriffe werden getrennt", suchbegriffe("ipad grundschule"), [
  "ipad",
  "grundschule",
]);
pruefe("Mehrfach-Leerzeichen", suchbegriffe("  ipad   grundschule "), [
  "ipad",
  "grundschule",
]);
pruefe("Einzelbuchstaben fliegen raus", suchbegriffe("a ipad"), ["ipad"]);
pruefe("kurze Eingabe bleibt erhalten", suchbegriffe("KI"), ["KI"]);
pruefe("leere Eingabe", suchbegriffe(undefined), []);
pruefe(
  "höchstens acht Begriffe",
  suchbegriffe("a1 a2 a3 a4 a5 a6 a7 a8 a9 a10").length,
  8,
);

{
  // Jeder Begriff wird zu einer eigenen UND-Bedingung; innerhalb davon darf
  // er in einem beliebigen Feld stehen.
  const wo = filterZuWhere({ q: "ipad grundschule" }) as {
    AND: Array<{ OR?: unknown[] }>;
  };
  pruefe("zwei Begriffe ergeben zwei Bedingungen", wo.AND.length, 2);
  pruefe(
    "jede Bedingung durchsucht sechs Felder",
    wo.AND.every((teil) => teil.OR?.length === 6),
    true,
  );
}

console.log("\nVeröffentlichung und Referenten");
pruefe(
  "unbekannte Referenten-ID wird erkannt",
  fehlendeReferentIds(["referent-a", "referent-b", "referent-a"], ["referent-b"]),
  ["referent-a"],
);
pruefe(
  "vollständig aufgelöste Referenten bestehen die Veröffentlichungspflicht",
  pruefeVeroeffentlichung({
    status: "VEROEFFENTLICHT",
    niveaustufe: "NIVEAU_III_IV",
    kompetenzen: ["1.1"],
    referenten: ["referent-a"],
  }),
  null,
);
pruefe(
  "ohne aufgelösten Referenten ist Veröffentlichung nicht möglich",
  pruefeVeroeffentlichung({
    status: "VEROEFFENTLICHT",
    niveaustufe: "NIVEAU_III_IV",
    kompetenzen: ["1.1"],
    referenten: [],
  }),
  {
    referenten:
      "Vor dem Veröffentlichen bitte mindestens eine Referentin oder einen Referenten zuordnen.",
  },
);

console.log("\nQR-Code (gegen einen echten Decoder gelesen)");
{
  // Der Encoder ist selbst geschrieben (src/lib/qr.ts). Ohne Gegenprobe wäre
  // das fahrlässig: Ein Fehler in der Reed-Solomon-Rechnung oder der
  // Maskierung fällt sonst erst auf, wenn im Lehrerzimmer niemand den Aushang
  // scannen kann. jsqr ist reine Entwicklungs-Abhängigkeit.
  const proben = [
    "https://fortbildungen.schulamt-uamm.de/fortbildungen/ki-2026-10-15-abc123",
    "https://example.org/f/x",
    "https://fortbildungen.schulamt-uamm.de/fortbildungen/kuenstliche-intelligenz-im-grundschulunterricht-2026-10-15-f2a91d",
    "Umlaute prüfen: Grundschule Wörishofen, Buß- und Bettag, 30 Plätze",
  ];

  for (const text of proben) {
    const { module, groesse, version } = qrMatrix(text, "H");

    // jsqr erwartet RGBA-Pixel. Vier Module Ruhezone ringsum sind
    // vorgeschrieben — ohne sie findet kein Lesegerät den Code.
    const rand = 4;
    const skala = 4;
    const kante = (groesse + rand * 2) * skala;
    const pixel = new Uint8ClampedArray(kante * kante * 4).fill(255);

    for (let z = 0; z < groesse; z += 1) {
      for (let s = 0; s < groesse; s += 1) {
        if (!module[z]![s]) continue;
        for (let dz = 0; dz < skala; dz += 1) {
          for (let ds = 0; ds < skala; ds += 1) {
            const y = (z + rand) * skala + dz;
            const x = (s + rand) * skala + ds;
            const i = (y * kante + x) * 4;
            pixel[i] = 0;
            pixel[i + 1] = 0;
            pixel[i + 2] = 0;
          }
        }
      }
    }

    const gelesen = jsQR(pixel, kante, kante);
    pruefe(
      `Version ${version} liest sich zurück (${text.length} Zeichen)`,
      gelesen?.data,
      text,
    );
  }

  // Das Logo in der Mitte verdeckt echte Module. Fehlerkorrektur H verkraftet
  // rund 30 % Verlust — hier wird nachgewiesen, dass die tatsächlich genutzte
  // Fläche (22 % der Kantenlänge, also knapp 5 % der Module) unkritisch ist.
  const text = "https://fortbildungen.schulamt-uamm.de/fortbildungen/ki-2026-10-15-abc123";
  const { module, groesse } = qrMatrix(text, "H");

  const rand = 4;
  const skala = 4;
  const kante = (groesse + rand * 2) * skala;
  const pixel = new Uint8ClampedArray(kante * kante * 4).fill(255);

  for (let z = 0; z < groesse; z += 1) {
    for (let s = 0; s < groesse; s += 1) {
      if (!module[z]![s]) continue;
      for (let dz = 0; dz < skala; dz += 1) {
        for (let ds = 0; ds < skala; ds += 1) {
          const i = (((z + rand) * skala + dz) * kante + (s + rand) * skala + ds) * 4;
          pixel[i] = 0;
          pixel[i + 1] = 0;
          pixel[i + 2] = 0;
        }
      }
    }
  }

  // Weißes Feld in der Mitte, wie es das Logo hinterlässt
  const feld = Math.round(groesse * 0.22);
  const von = Math.floor((groesse - feld) / 2) + rand;
  for (let z = von; z < von + feld; z += 1) {
    for (let s = von; s < von + feld; s += 1) {
      for (let dz = 0; dz < skala; dz += 1) {
        for (let ds = 0; ds < skala; ds += 1) {
          const i = ((z * skala + dz) * kante + s * skala + ds) * 4;
          pixel[i] = 255;
          pixel[i + 1] = 255;
          pixel[i + 2] = 255;
        }
      }
    }
  }

  pruefe(
    `mit ${feld}×${feld} Modulen Logo-Aussparung noch lesbar`,
    jsQR(pixel, kante, kante)?.data,
    text,
  );
}

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
