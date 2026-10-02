/* eslint-disable @typescript-eslint/no-require-imports -- Ladehook isoliert server-only und Next-Schrift-/CSS-Loader. */
const assert = require("node:assert/strict");
const { readFile, mkdir, writeFile } = require("node:fs/promises");
const path = require("node:path");
const Module = require("node:module");
const originalLoad = Module._load;
Module._load = function (anfrage, eltern, hauptmodul) {
  if (anfrage === "server-only" || anfrage.endsWith(".css")) return {};
  if (anfrage === "next/font/local") return () => ({ variable: "testschrift" });
  if (anfrage === "@/lib/schulamt") return { ladeSchulamt: async () => { throw new Error("Icons dürfen nicht auf die Datenbank warten."); } };
  return originalLoad.call(this, anfrage, eltern, hauptmodul);
};
require("tsx/cjs");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { load } = require("cheerio");
const sharp = require("sharp");
const jsQR = require("jsqr");
const { erstelleAushangPdf, AushangLayoutFehler } = require("../src/lib/aushangPdf");
const { ladeLogo } = require("../src/lib/logo");
const { zeichneQr } = require("../src/lib/qrZeichnen");
const { default: RootLayout } = require("../src/app/layout");

const vorlage = {
  titel: "Onboarding Mathegym - Bismarckschule Memmingen", kurztitel: null,
  beschreibungHtml: "<p>Digitale Lernangebote gemeinsam erproben und im Unterricht einsetzen.</p>",
  organisationsform: "REGIONAL", format: "PRAESENZ",
  beginn: new Date("2026-09-23T12:00:00Z"), ende: new Date("2026-09-23T14:00:00Z"),
  maxTn: 25, schularten: ["GRUNDSCHULE", "MITTELSCHULE"], fach: "Mathematik", niveaustufe: "NIVEAU_I_II",
  inFibs: true, fibsUrl: "https://fibs.alp.dillingen.de/", fibsLehrgangsnummer: "445878-1",
  bezirk: { name: "Memmingen-Unterallgäu" }, veranstaltungsort: { name: "Bismarckschule Memmingen" },
  referenten: [{ referent: { vorname: "Anna", nachname: "Musterfrau" } }],
};

/** Rasterisiert genau die Formen des gemeinsamen PDF-QR-Zeichners. */
async function scanneQr(adresse, logo) {
  const formen = [];
  let farbe = "#fff";
  const zeichenflaeche = {
    setFillColor: (...rgb) => { farbe = `rgb(${rgb.join(",")})`; },
    rect: (x, y, breite, hoehe) => formen.push(`<rect x="${x}" y="${y}" width="${breite}" height="${hoehe}" fill="${farbe}"/>`),
    roundedRect: (x, y, breite, hoehe, rx, ry) => formen.push(`<rect x="${x}" y="${y}" width="${breite}" height="${hoehe}" rx="${rx}" ry="${ry}" fill="${farbe}"/>`),
    addImage: (daten, format, x, y, breite, hoehe) => formen.push(`<image href="${daten}" x="${x}" y="${y}" width="${breite}" height="${hoehe}"/>`),
  };
  zeichneQr(zeichenflaeche, adresse, { x: 7, y: 7, groesse: 45, farbe: [29, 56, 105], logo });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="708" height="708" viewBox="0 0 59 59"><rect width="59" height="59" fill="white"/>${formen.join("")}</svg>`;
  const { data, info } = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(jsQR(new Uint8ClampedArray(data), info.width, info.height)?.data, adresse, "Gestalteter QR-Code mit echtem Logo muss vollständig lesbar bleiben.");
}

(async () => {
  const logo = await ladeLogo();
  assert.ok(logo, "Ohne eigenes Schulamtslogo muss die weiter.bilden-Bildmarke vorhanden sein.");
  const bildmarke = await readFile("public/marke/apple-touch-icon-v1.png");
  assert.ok(logo.daten === `data:image/png;base64,${bildmarke.toString("base64")}`, "Der Standard-QR verwendet die weiter.bilden-Bildmarke.");
  assert.ok(logo.seitenverhaeltnis > 0);
  const adressen = [
    "https://fortbildung.bdb-uamm.de/fortbildungen/onboarding-mathegym-bismarckschule-memmingen-2026-09-23-a81ffa",
    "https://example.org/fortbildungen/test",
    `https://fortbildung.bdb-uamm.de/fortbildungen/${"langer-veranstaltungstitel-".repeat(5)}2026-09-23-abcdef`,
  ];
  for (const adresse of adressen) await scanneQr(adresse, logo);
  const faelle = [
    { name: "standard", daten: vorlage, adresse: adressen[0] },
    { name: "lang", daten: {
      ...vorlage,
      titel: "Individuelle Lernwege mit digitalen Medien gestalten: Unterricht gemeinsam weiterentwickeln, differenzierte Aufgaben erstellen und Lernfortschritte im Schulalltag sichtbar machen - Beispiele aus der Praxis",
      kurztitel: "Konkrete Ideen für die Unterrichtspraxis an Grund- und Mittelschulen",
      beschreibungHtml: `<p>${"Ausführliche Informationen zum Fortbildungsangebot. ".repeat(100)}</p>`,
      veranstaltungsort: { name: "Grund- und Mittelschule mit einem ausführlichen Schulnamen und mehreren Standorten, Schulstraße 123, 87700 Memmingen" },
      bezirk: { name: "Schulamtsbezirk mit mehreren Landkreisen und einer besonders ausführlichen amtlichen Bezeichnung" },
      referenten: Array.from({ length: 5 }, (_, index) => ({ referent: { vorname: `Anna-Lena ${index + 1}`, nachname: "Müller-Lüdenscheidt" } })),
    }, adresse: adressen[2] },
    { name: "schilf", daten: { ...vorlage, organisationsform: "SCHILF", inFibs: false, fibsUrl: null, fibsLehrgangsnummer: null }, adresse: adressen[0] },
  ];
  for (const fall of faelle) {
    const pdf = erstelleAushangPdf(fall.daten, fall.adresse, logo);
    assert.equal(pdf.getNumberOfPages(), 1);
    const inhalt = pdf.output();
    assert.match(inhalt, /\/Subtype \/Image/);
    assert.ok(inhalt.includes(fall.adresse), "Der anklickbare PDF-Link enthält die vollständige Veranstaltungsadresse.");
    if (process.env.AUSHANG_PRUEFORDNER) {
      await mkdir(process.env.AUSHANG_PRUEFORDNER, { recursive: true });
      await writeFile(path.join(process.env.AUSHANG_PRUEFORDNER, `${fall.name}.pdf`), Buffer.from(pdf.output("arraybuffer")));
    }
  }
  assert.throws(() => erstelleAushangPdf({ ...vorlage, titel: "Viel zu umfangreich ".repeat(500) }, adressen[0], logo), AushangLayoutFehler);

  const html = load(renderToStaticMarkup(React.createElement(RootLayout, { children: React.createElement("main", null, "Inhalt") })));
  const icons = html("head link[rel='icon']");
  assert.equal(icons.length, 3, "ICO, SVG und PNG müssen ohne Metadaten-Abfrage im Kopf stehen.");
  for (const icon of html("head link").toArray()) {
    const href = html(icon).attr("href");
    const daten = await readFile(path.join("public", href.split("?")[0]));
    assert.ok(daten.length > 0, `${href} muss im Image mitgeliefert werden.`);
    if (href.includes(".png")) {
      const meta = await sharp(daten).metadata();
      assert.equal(`${meta.width}x${meta.height}`, html(icon).attr("sizes"));
    }
  }
  console.log("Aushang: lange Texte, einseitiges Layout, echte QR-Geometrie mit Logo und vollständige Links geprüft. Favicon: statischer Kopf und lokale Bilddateien geprüft.");
})().catch((fehler) => { console.error(fehler); process.exitCode = 1; });
