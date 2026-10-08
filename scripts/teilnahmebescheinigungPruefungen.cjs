/* eslint-disable @typescript-eslint/no-require-imports -- Ladehook isoliert Sitzung und Datenbank. */
const assert = require("node:assert/strict");
const { mkdir, writeFile } = require("node:fs/promises");
const path = require("node:path");
const Module = require("node:module");
const { mock } = require("node:test");
const sharp = require("sharp");
require("tsx/cjs");

mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-01T12:00:00Z") });
const { fortbildungScope } = require("../src/lib/berechtigungsScope");
const { oeffentlicherReferentWhere, oeffentlicherReferentSelect } = require("../src/lib/namensfreigabe");
const { BescheinigungsAnfrageSchema } = require("../src/lib/teilnahmebescheinigung");
const { NextRequest } = require("next/server");
let user;
let fortbildung;
let abfragen = 0;
let ausgaben = [];
class AuthError extends Error {}
let pdfFehler = false;
let echtePdf;
let bilderLaden = true;

const originalLoad = Module._load;
Module._load = function (anfrage, eltern, hauptmodul) {
  if (anfrage === "server-only") return {};
  if (anfrage === "@/lib/auth") return {
    AuthError, ERFASSER: ["RVS", "ADMIN", "REFERENT"], fortbildungScope,
    requireRole: async (...rollen) => {
      if (!user || !rollen.includes(user.role) || !user.mfaBestaetigt) throw new AuthError("Nicht angemeldet.");
      return user;
    },
  };
  if (anfrage === "@/lib/prisma") return { prisma: { fortbildung: { findFirst: async ({ where, select }) => {
    abfragen++;
    assert.deepEqual(where, { AND: [{ id: kennung }, fortbildungScope(user)] });
    assert.deepEqual(select.bezirk.select.users, {
      where: { role: "ADMIN", isActive: true }, select: { name: true, bdbUnterschrift: bilderLaden ? { select: { bildPng: true } } : false }, orderBy: [{ name: "asc" }, { id: "asc" }],
    }, "Nur aktive BdBs des Veranstaltungsbezirks auswählen, keine E-Mail-Adressen.");
    assert.deepEqual(select.referenten.where, { referent: oeffentlicherReferentWhere });
    assert.deepEqual(select.referenten.select, { referent: { select: oeffentlicherReferentSelect } });
    assert.deepEqual(select.veranstaltungsort.select, { name: true, ort: true, istOnline: true });
    return fortbildung;
  } } } };
  if (anfrage === "@/lib/teilnahmebescheinigungPdf") return {
    BescheinigungsFehler: echtePdf.BescheinigungsFehler,
    erstelleTeilnahmebescheinigung: async (daten, anzahl) => {
      if (pdfFehler) throw new echtePdf.BescheinigungsFehler("Layout zu lang.");
      ausgaben.push({ daten, anzahl });
      return Uint8Array.from(Buffer.from("%PDF-1.3\n")).buffer;
    },
  };
  return originalLoad.call(this, anfrage, eltern, hauptmodul);
};

echtePdf = require("../src/lib/teilnahmebescheinigungPdf");
const { GET } = require("../src/app/api/admin/export/teilnahmebescheinigung/route");
const kennung = "12345678-1234-4234-8234-123456789012";

function vorbereiten() {
  user = { id: "nutzer", role: "REFERENT", referentId: "zugeordnet", bezirkIds: ["bezirk"], mfaBestaetigt: true };
  fortbildung = {
    titel: "Digitale Lernräume gestalten mit der BayernCloud Schule",
    organisationsform: "SCHILF", status: "VEROEFFENTLICHT",
    beginn: new Date("2026-09-29T12:00:00Z"), ende: new Date("2026-09-29T14:00:00Z"),
    veranstaltungsort: { name: "Grundschule am Beispielplatz", ort: "Memmingen", istOnline: false },
    bezirk: { name: "Memmingen-Unterallgäu", users: [{ name: "Anna Musterfrau" }, { name: "Michael Beispielmann" }] },
    referenten: [{ referent: { vorname: "Katrin", nachname: "Müller" } }],
  };
  abfragen = 0;
  ausgaben = [];
  pdfFehler = false;
  bilderLaden = true;
}

function anfrage(parameter = `id=${kennung}&anzahl=3`) {
  return new NextRequest(`http://localhost/api/admin/export/teilnahmebescheinigung?${parameter}`);
}

(async () => {
  for (const rolle of ["REFERENT", "ADMIN", "RVS"]) {
    for (const status of ["VEROEFFENTLICHT", "ARCHIVIERT"]) {
      vorbereiten();
      user.role = rolle;
      fortbildung.status = status;
      const antwort = await GET(anfrage());
      assert.equal(antwort.status, 200);
      assert.equal(antwort.headers.get("content-type"), "application/pdf");
      assert.equal(antwort.headers.get("cache-control"), "private, no-store");
      assert.match(antwort.headers.get("content-disposition"), /attachment; filename="teilnahmebescheinigungen-.*-3.pdf"/);
      assert.equal(ausgaben[0].anzahl, 3);
      assert.deepEqual(ausgaben[0].daten.bdbs.map((bdb) => bdb.name), ["Anna Musterfrau", "Michael Beispielmann"]);
      assert.deepEqual(ausgaben[0].daten.referenten, ["Katrin Müller"]);
      assert.equal(ausgaben[0].daten.ort, "Grundschule am Beispielplatz, Memmingen");
    }
  }
  for (const rolle of [null, "UNBEKANNT"]) {
    vorbereiten();
    user = rolle ? { ...user, role: rolle } : null;
    assert.equal((await GET(anfrage())).status, 401);
    assert.equal(abfragen, 0);
  }
  vorbereiten();
  user.mfaBestaetigt = false;
  assert.equal((await GET(anfrage())).status, 401);
  assert.equal(abfragen, 0);

  for (const anzahl of ["0", "-1", "1.5", "101", "1000", "NaN", "Infinity", "1e2", "", " 2 "]) {
    vorbereiten();
    assert.equal(BescheinigungsAnfrageSchema.safeParse({ id: kennung, anzahl }).success, false);
    assert.equal((await GET(anfrage(`id=${kennung}&anzahl=${encodeURIComponent(anzahl)}`))).status, 400);
    assert.equal(abfragen, 0);
  }
  for (const parameter of [`id=${kennung}`, `id=${kennung}&anzahl=1&anzahl=2`, `id=${kennung}&id=${kennung}&anzahl=1`, "id=unbekannt&anzahl=1"]) {
    vorbereiten();
    assert.equal((await GET(anfrage(parameter))).status, 400);
    assert.equal(abfragen, 0);
  }
  for (const parameter of ["unterschriften=unbekannt", "unterschriften=ja&unterschriften=nein"]) {
    vorbereiten();
    assert.equal((await GET(anfrage(`id=${kennung}&anzahl=1&${parameter}`))).status, 400);
    assert.equal(abfragen, 0);
  }
  vorbereiten();
  fortbildung = null; // Der gescopte Datenbankabruf findet keinen zugänglichen Datensatz.
  assert.equal((await GET(anfrage())).status, 404);
  assert.equal(ausgaben.length, 0);
  for (const status of ["ENTWURF", "EINGEREICHT", "ABGESAGT"]) {
    vorbereiten(); fortbildung.status = status;
    assert.equal((await GET(anfrage())).status, 409);
    assert.equal(ausgaben.length, 0);
  }
  for (const form of ["REGIONAL", "ALP"]) {
    vorbereiten(); fortbildung.organisationsform = form;
    assert.equal((await GET(anfrage())).status, 409);
  }
  for (const namen of [[], [null], [" "], ["Anna Musterfrau", null]]) {
    vorbereiten(); fortbildung.bezirk.users = namen.map((name) => ({ name }));
    assert.equal((await GET(anfrage())).status, 409);
    assert.equal(ausgaben.length, 0);
  }
  vorbereiten();
  fortbildung.veranstaltungsort.istOnline = true;
  fortbildung.referenten = [];
  // Vorbereitung vor dem Termin ist bewusst möglich.
  fortbildung.beginn = new Date("2026-10-29T13:00:00Z");
  fortbildung.ende = new Date("2026-10-29T15:00:00Z");
  assert.equal((await GET(anfrage())).status, 200);
  assert.equal(ausgaben[0].daten.ort, "Online");
  assert.deepEqual(ausgaben[0].daten.referenten, []);
  vorbereiten(); pdfFehler = true;
  assert.equal((await GET(anfrage())).status, 422);

  // Die echte PDF-Erzeugung wird zusätzlich ohne Datenbank ausgeführt.
  vorbereiten(); await GET(anfrage());
  const muster = ausgaben[0].daten;
  // Deutlich erkennbares geometrisches Testbild, keine echte Unterschrift.
  const pixel = Buffer.alloc(600 * 180 * 4);
  for (let x = 15; x < 585; x++) {
    const y = Math.round(90 + 45 * Math.sin(x / 24));
    for (let d = -2; d <= 2; d++) {
      const index = ((y + d) * 600 + x) * 4;
      pixel[index] = 20; pixel[index + 1] = 40; pixel[index + 2] = 100; pixel[index + 3] = 255;
    }
  }
  const testbild = await sharp(pixel, { raw: { width: 600, height: 180, channels: 4 } }).png().toBuffer();
  vorbereiten();
  fortbildung.bezirk.users[1].bdbUnterschrift = { bildPng: testbild };
  assert.equal((await GET(anfrage())).status, 200);
  assert.equal(ausgaben[0].daten.bdbs[0].unterschrift, null);
  assert.deepEqual(ausgaben[0].daten.bdbs[1].unterschrift, testbild, "Bild muss dem richtigen BdB zugeordnet bleiben.");
  bilderLaden = false;
  assert.equal((await GET(anfrage(`id=${kennung}&anzahl=1&unterschriften=nein`))).status, 200);
  assert.ok(ausgaben.at(-1).daten.bdbs.every((bdb) => bdb.unterschrift === null), "Ohne Unterschriften weder laden noch einbetten.");
  const varianten = [
    { name: "standard", daten: muster, anzahl: 3 },
    { name: "hundert", daten: muster, anzahl: 100 },
    { name: "lang", daten: {
      ...muster,
      titel: "Individuelle Lernwege mit digitalen Medien gestalten: Unterricht gemeinsam weiterentwickeln, differenzierte Aufgaben erstellen und Lernfortschritte im Schulalltag sichtbar machen - Beispiele für die Praxis",
      ort: "Grund- und Mittelschule mit einem ausführlichen Schulnamen, Schulstraße 123, 87700 Memmingen",
      bdbs: ["Dr. Anna-Lena Müller-Lüdenscheidt", "Michael Beispielmann", "Prof. Dr. Christine Groß-Schönberger"].map((name) => ({ name })),
      referenten: ["Katrin Müller", "Łukasz Dvořák", "Zoë Groß"],
    }, anzahl: 1 },
    { name: "tageswechsel", daten: {
      ...muster, beginn: new Date("2026-10-24T22:30:00Z"), ende: new Date("2026-10-26T00:30:00Z"),
      referenten: [], bdbs: [{ name: "Anna Musterfrau" }], ort: "Online",
    }, anzahl: 1 },
  ];
  varianten.push(
    { name: "unterschrieben", daten: { ...muster, bdbs: muster.bdbs.map((bdb) => ({ ...bdb, unterschrift: testbild })) }, anzahl: 3 },
    { name: "teilweise-unterschrieben", daten: { ...muster, bdbs: muster.bdbs.map((bdb, index) => ({ ...bdb, unterschrift: index ? testbild : null })) }, anzahl: 1 },
    { name: "lang-unterschrieben", daten: { ...varianten[2].daten, bdbs: varianten[2].daten.bdbs.map((bdb) => ({ ...bdb, unterschrift: testbild })) }, anzahl: 1 },
  );
  let bilderOhneUnterschriften;
  for (const variante of varianten) {
    const puffer = Buffer.from(await echtePdf.erstelleTeilnahmebescheinigung(variante.daten, variante.anzahl));
    assert.equal(puffer.subarray(0, 5).toString(), "%PDF-");
    assert.equal((puffer.toString("latin1").match(/\/Type \/Page\b/g) ?? []).length, variante.anzahl);
    const bilder = (puffer.toString("latin1").match(/\/Subtype \/Image\b/g) ?? []).length;
    if (variante.name === "standard") bilderOhneUnterschriften = bilder;
    if (variante.name === "unterschrieben") assert.equal(bilder, bilderOhneUnterschriften + 4, "Zwei PNGs mit Transparenz nur einmal pro Dokument einbetten.");
    if (variante.name === "teilweise-unterschrieben") assert.equal(bilder, bilderOhneUnterschriften + 2);
    if (process.env.BESCHEINIGUNG_PRUEFORDNER) {
      await mkdir(process.env.BESCHEINIGUNG_PRUEFORDNER, { recursive: true });
      await writeFile(path.join(process.env.BESCHEINIGUNG_PRUEFORDNER, `${variante.name}.pdf`), puffer);
    }
  }
  for (const anzahl of [0, -1, 1.5, 101, NaN]) {
    await assert.rejects(echtePdf.erstelleTeilnahmebescheinigung(muster, anzahl), echtePdf.BescheinigungsFehler);
  }
  await assert.rejects(echtePdf.erstelleTeilnahmebescheinigung({ ...muster, bdbs: [] }, 1), echtePdf.BescheinigungsFehler);
  await assert.rejects(echtePdf.erstelleTeilnahmebescheinigung({ ...muster, ende: muster.beginn }, 1), echtePdf.BescheinigungsFehler);
  await assert.rejects(echtePdf.erstelleTeilnahmebescheinigung({ ...muster, bdbs: Array(100).fill({ name: "BdB Beispiel" }) }, 1), echtePdf.BescheinigungsFehler);
  console.log("Teilnahmebescheinigungen: Rollen, Scope, Eingaben, Status, BdB-Zuordnung, Namensfreigabe und echte PDF-Ausgabe (1/3/100 Exemplare) bestanden.");
})().catch((fehler) => { console.error(fehler); process.exitCode = 1; }).finally(() => mock.timers.reset());
