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
const { leseBeschreibungsAbsaetze, planeBeschreibung } = require("../src/lib/beschreibungPdf");
const { jsPDF } = require("jspdf");
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
  const struktur = leseBeschreibungsAbsaetze(`<p>Gemeinsam &amp; praxisnah.</p><ul><li><p><strong>Einstieg</strong> und Austausch</p><ul><li>IServ kennenlernen</li><li>Notenverwaltung erproben</li></ul></li><li>Workshops<ol><li>Paddy</li><li>Mathe-Magma<br>mit Beispielen</li></ol></li></ul><p>Abschluss.</p><script>nicht drucken</script>`);
  assert.deepEqual(struktur.map((absatz) => [absatz.ebene, absatz.listenzeichen, absatz.teile.map((teil) => teil.text).join("")]), [
    [0, undefined, "Gemeinsam & praxisnah."],
    [1, "•", "Einstieg und Austausch"],
    [2, "•", "IServ kennenlernen"],
    [2, "•", "Notenverwaltung erproben"],
    [1, "•", "Workshops"],
    [2, "1.", "Paddy"],
    [2, "2.", "Mathe-Magma"],
    [2, undefined, "mit Beispielen"],
    [0, undefined, "Abschluss."],
  ]);
  assert.deepEqual(struktur[1].teile[0], { text: "Einstieg", fett: true });
  const messung = new jsPDF({ unit: "mm" });
  const listenabsatz = leseBeschreibungsAbsaetze(`<ul><li><strong>Ausführlicher Punkt:</strong> ${"Wort ".repeat(90)}</li></ul>`);
  const umbruch = planeBeschreibung(messung, listenabsatz, 80, 11, 1000);
  assert.equal(umbruch.gekuerzt, false);
  assert.ok(umbruch.zeilen.length > 2);
  assert.equal(umbruch.zeilen.filter((zeile) => zeile.listenzeichen).length, 1, "Umgebrochene Listenpunkte erhalten kein zweites Aufzählungszeichen.");
  assert.ok(umbruch.zeilen.every((zeile) => zeile.einzug === umbruch.zeilen[0].einzug), "Folgezeilen müssen unter dem Text beginnen.");
  const kurz = planeBeschreibung(messung, struktur, 80, 11, 20);
  assert.equal(kurz.gekuerzt, true);
  assert.ok(kurz.hoehe <= 20);
  assert.match(kurz.zeilen.at(-1).teile.map((teil) => teil.text).join(""), / …$/);
  assert.equal(planeBeschreibung(messung, struktur, 80, 11, 0).zeilen.length, 0);
  const ohneLeerzeichen = planeBeschreibung(messung, leseBeschreibungsAbsaetze(`<p>${"langeswort".repeat(100)}</p>`), 40, 11, 1000);
  for (const zeile of [...umbruch.zeilen, ...kurz.zeilen, ...ohneLeerzeichen.zeilen]) {
    let breite = 0;
    for (const teil of zeile.teile) {
      messung.setFont("helvetica", teil.fett ? "bold" : "normal"); messung.setFontSize(11);
      breite += messung.getTextWidth(teil.text);
    }
    const maximum = ohneLeerzeichen.zeilen.includes(zeile) ? 40 : 80 - zeile.einzug;
    assert.ok(breite <= maximum + 0.01, "Auch lange Wörter und Auslassungszeichen müssen innerhalb der Spalte bleiben.");
  }
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
    { name: "stichpunkte", daten: {
      ...vorlage, titel: "Digitales Arbeiten an der Bismarckschule", organisationsform: "SCHILF", inFibs: false,
      beschreibungHtml: `<p>Neues entdecken und praktisch erproben: Digitale Anwendungen für Unterricht und Schulorganisation gemeinsam kennenlernen.</p>
        <ul><li><strong>Ablauf | 13:30–16:00 Uhr</strong></li>
        <li><p><strong>13:30–14:30 Uhr: Gemeinsamer Einstieg</strong></p><ul><li>Neuigkeiten in IServ – Referent/in: Christian Müller</li><li>Einführung in die Notenverwaltung mit edoop – Referent/in: Heinrich Rothermel</li></ul></li>
        <li><strong>14:30–14:45 Uhr: Pause</strong></li>
        <li><strong>14:45–15:30 Uhr: Workshops</strong><ul><li><strong>14:45–15:15 Uhr:</strong> Erste Workshoprunde</li><li><strong>15:10–15:15 Uhr:</strong> Wechsel zwischen den Workshops</li><li><strong>15:15–15:45 Uhr:</strong> Zweite Workshoprunde</li></ul></li>
        <li>Zur Auswahl stehen:<ul><li><strong>Paddy</strong> – Referent/in: Heinrich Rothermel</li><li><strong>Mathe-Magma</strong> – Referent/in: Rosalba Melis</li><li><strong>LearningView</strong> – Referent/in: Maria Schönrock</li></ul></li>
        <li>Die Auswahl der beiden Workshops erfolgt am Veranstaltungstag nach individuellem Interesse.</li>
        <li><strong>15:45–16:00 Uhr: Gemeinsamer Abschluss</strong></li><li>Austausch, offene Fragen und Ausblick – Moderation: Christian Müller</li></ul>`,
    }, adresse: adressen[0] },
    { name: "nummeriert", daten: { ...vorlage, beschreibungHtml: "<h2>Das nehmen Sie mit</h2><ol><li><p>Erster Schritt</p><p>Mit einem zweiten Absatz im gleichen Listenpunkt.</p><ul><li>Unterpunkt zum ersten Schritt</li></ul></li><li>Zweiter Schritt<br>mit einem ausdrücklichen Zeilenumbruch</li></ol><p>Ein abschließender Absatz.</p>" }, adresse: adressen[0] },
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
