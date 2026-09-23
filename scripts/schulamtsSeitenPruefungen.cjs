/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS folgt den vorhandenen isolierten DB-Tests. */
/* Echte SSR-Prüfung der öffentlichen Schulamtsseiten gegen die isolierte Test-DB. */
const assert = require("node:assert/strict");
const { PrismaClient } = require("@prisma/client");
const cheerio = require("cheerio");

const datenbankUrl = process.env.DATABASE_URL;
if (!datenbankUrl?.startsWith("postgresql://bezirketest@127.0.0.1:54329/")) {
  throw new Error("Dieser Test darf nur mit der isolierten bezirketest-Datenbank laufen.");
}

const basisUrl = process.env.SCHULAMT_TEST_URL ?? "http://localhost:3019";
const prisma = new PrismaClient();
const prefix = `ssr-schulamt-${Date.now().toString(36)}`;
const titelA = `${prefix} Angebot A`;
const titelB = `${prefix} Angebot B`;
const titelEntwurf = `${prefix} Entwurf`;
const kuerzelA = `sa${Date.now().toString(36)}a`;
const kuerzelB = `sa${Date.now().toString(36)}b`;
const slugA = `${prefix}-angebot-a`;
const slugB = `${prefix}-angebot-b`;
const tagInZukunft = (tage) => {
  const datum = new Date(Date.now() + tage * 24 * 60 * 60 * 1000);
  datum.setUTCHours(9, 0, 0, 0);
  return datum;
};
const beginnA = tagInZukunft(10);
const beginnB = tagInZukunft(14);
const beginnEntwurf = tagInZukunft(18);
const monat = (datum) => `${datum.getUTCFullYear()}-${String(datum.getUTCMonth() + 1).padStart(2, "0")}`;
const nachbarMonat = (datum, richtung) => {
  const ergebnis = new Date(Date.UTC(datum.getUTCFullYear(), datum.getUTCMonth() + richtung, 1));
  return monat(ergebnis);
};
const kalenderMonat = monat(beginnA);

async function anfrage(pfad) {
  const antwort = await fetch(new URL(pfad, basisUrl), { cache: "no-store", redirect: "manual" });
  return { antwort, html: await antwort.text() };
}

function sichtbarerText(html) {
  const $ = cheerio.load(html);
  $("script, style, noscript, template").remove();
  return $.text().replace(/\s+/g, " ").trim();
}

function enthaelt(text, wert, nachricht = `${wert} fehlt.`) {
  assert.ok(text.includes(wert), nachricht);
}

function enthaeltNicht(text, wert, nachricht = `${wert} darf nicht sichtbar sein.`) {
  assert.equal(text.includes(wert), false, nachricht);
}

function kennzahl(html, beschriftung) {
  const $ = cheerio.load(html);
  const zeile = $("dl dd").filter((_, element) => $(element).text().includes(beschriftung)).first();
  assert.ok(zeile.length, `Die Kennzahl „${beschriftung}“ fehlt.`);
  return zeile.find(".zahl").first().text();
}

async function aufraeumen() {
  await prisma.fortbildung.deleteMany({ where: { slug: { in: [slugA, slugB, `${prefix}-entwurf`] } } });
  await prisma.veranstaltungsort.deleteMany({ where: { name: `${prefix} Online` } });
  await prisma.bezirk.deleteMany({ where: { kuerzel: { in: [kuerzelA, kuerzelB] } } });
}

(async () => {
  await aufraeumen();
  try {
    const [bezirkA, bezirkB] = await Promise.all([
      prisma.bezirk.create({ data: { name: `${prefix} Schulamt A`, kuerzel: kuerzelA } }),
      prisma.bezirk.create({ data: { name: `${prefix} Schulamt B`, kuerzel: kuerzelB } }),
    ]);
    const ort = await prisma.veranstaltungsort.create({ data: { name: `${prefix} Online`, istOnline: true } });

    await prisma.fortbildung.createMany({ data: [
      {
        slug: slugA, titel: titelA, beschreibungHtml: "<p>Öffentlicher Termin A</p>", beschreibungText: "Öffentlicher Termin A",
        organisationsform: "REGIONAL", maxTn: 20, format: "ESESSION", beginn: beginnA, ende: new Date(beginnA.getTime() + 2 * 60 * 60 * 1000),
        veranstaltungsortId: ort.id, schularten: ["GRUNDSCHULE"], status: "VEROEFFENTLICHT", bezirkId: bezirkA.id,
      },
      {
        slug: slugB, titel: titelB, beschreibungHtml: "<p>Öffentlicher Termin B</p>", beschreibungText: "Öffentlicher Termin B",
        organisationsform: "REGIONAL", maxTn: 20, format: "PRAESENZ", beginn: beginnB, ende: new Date(beginnB.getTime() + 2 * 60 * 60 * 1000),
        veranstaltungsortId: ort.id, schularten: ["MITTELSCHULE"], status: "VEROEFFENTLICHT", bezirkId: bezirkB.id,
      },
      {
        slug: `${prefix}-entwurf`, titel: titelEntwurf, beschreibungHtml: "<p>Entwurf</p>", beschreibungText: "Entwurf",
        organisationsform: "REGIONAL", maxTn: 20, format: "ESESSION", beginn: beginnEntwurf, ende: new Date(beginnEntwurf.getTime() + 2 * 60 * 60 * 1000),
        veranstaltungsortId: ort.id, schularten: ["GRUNDSCHULE"], status: "ENTWURF", bezirkId: bezirkA.id,
      },
    ] });

    let ergebnis = await anfrage(`/${kuerzelA}`);
    assert.equal(ergebnis.antwort.status, 200, "Schulamts-Startseite A muss erreichbar sein.");
    let text = sichtbarerText(ergebnis.html);
    enthaelt(text, titelA);
    assert.equal(kennzahl(ergebnis.html, "kommende Termine"), "1", "Die Kennzahl darf nur den veröffentlichten Termin von A zählen.");
    enthaeltNicht(text, titelB);
    enthaeltNicht(text, titelEntwurf);

    ergebnis = await anfrage("/");
    assert.equal(ergebnis.antwort.status, 200, "Die Schwaben-Startseite muss erreichbar sein.");
    text = sichtbarerText(ergebnis.html);
    enthaelt(text, "Schwaben", "Die Standardstartseite muss den gemeinsamen Schwaben-Auftritt zeigen.");
    const $standard = cheerio.load(ergebnis.html);
    const standardLinks = $standard("a[href]").map((_, element) => $standard(element).attr("href")).get();
    assert.ok(standardLinks.includes("/fortbildungen"), "Die Standardstartseite muss zur globalen Liste verlinken.");
    assert.ok(standardLinks.includes("/kalender"), "Die Standardstartseite muss zum globalen Kalender verlinken.");
    assert.ok(standardLinks.includes("/api/ics"), "Die Standardstartseite muss den globalen ICS-Feed verlinken.");

    ergebnis = await anfrage("/fortbildungen");
    assert.equal(ergebnis.antwort.status, 200, "Die globale Fortbildungsliste muss erreichbar sein.");
    text = sichtbarerText(ergebnis.html);
    enthaelt(text, titelA);
    enthaelt(text, titelB);
    enthaeltNicht(text, titelEntwurf);

    ergebnis = await anfrage(`/${kuerzelA}/fortbildungen?bezirk=${bezirkB.id}`);
    assert.equal(ergebnis.antwort.status, 200, "Ein fremder Bezirkfilter darf keine Fehlerseite erzeugen.");
    text = sichtbarerText(ergebnis.html);
    enthaelt(text, titelA, "Der Pfadbezirk muss den veränderbaren Bezirkfilter überstimmen.");
    enthaeltNicht(text, titelB, "Der fremde Bezirkfilter darf keine Daten aus Bezirk B zeigen.");

    ergebnis = await anfrage(`/${kuerzelA}/kalender?monat=${kalenderMonat}`);
    assert.equal(ergebnis.antwort.status, 200, "Der Schulamtskalender muss erreichbar sein.");
    text = sichtbarerText(ergebnis.html);
    enthaelt(text, titelA);
    enthaeltNicht(text, titelB);
    const $ = cheerio.load(ergebnis.html);
    const monatsLinks = $("a[href]").map((_, element) => $(element).attr("href")).get()
      .filter((href) => href?.includes("/kalender?monat="));
    assert.ok(monatsLinks.includes(`/${kuerzelA}/kalender?monat=${nachbarMonat(beginnA, -1)}`), "Der Link zum vorherigen Monat muss im Schulamtsbereich bleiben.");
    assert.ok(monatsLinks.includes(`/${kuerzelA}/kalender?monat=${nachbarMonat(beginnA, 1)}`), "Der Link zum nächsten Monat muss im Schulamtsbereich bleiben.");

    ergebnis = await anfrage(`/${kuerzelA}/fortbildungen/${slugB}`);
    assert.equal(ergebnis.antwort.status, 404, "Ein fremder Fortbildungs-Slug darf im Schulamtsbereich nicht erreichbar sein.");

    ergebnis = await anfrage(`/unbekannt-${prefix}`);
    assert.equal(ergebnis.antwort.status, 404, "Unbekannte Schulamts-Kürzel müssen 404 liefern.");

    ergebnis = await anfrage(`/api/ics?schulamt=${kuerzelA}`);
    assert.equal(ergebnis.antwort.status, 200, "Der Schulamts-ICS-Feed muss erreichbar sein.");
    enthaelt(ergebnis.html, titelA);
    enthaeltNicht(ergebnis.html, titelB, "Der Schulamts-ICS-Feed darf keine fremden Termine enthalten.");

    ergebnis = await anfrage(`/api/ics?schulamt=${kuerzelA}&slug=${slugB}`);
    assert.equal(ergebnis.antwort.status, 200, "Der gefilterte Schulamts-ICS-Feed muss erreichbar sein.");
    enthaeltNicht(ergebnis.html, titelB, "Ein fremder Slug darf den Schulamts-ICS-Filter nicht umgehen.");

    await prisma.bezirk.update({ where: { id: bezirkB.id }, data: { aktiv: false } });
    ergebnis = await anfrage(`/${kuerzelB}`);
    assert.equal(ergebnis.antwort.status, 404, "Inaktive Schulämter müssen 404 liefern.");

    console.log("Schulamtsseiten-SSR: Startseite, Listen, Kalender, Detail- und ICS-Scope bestanden.");
  } finally {
    await aufraeumen();
    await prisma.$disconnect();
  }
})().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
