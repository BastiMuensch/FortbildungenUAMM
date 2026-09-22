/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS-Ladehook isoliert ausschließlich Next.js Request-Kontext. */
/* Echte Exportprüfung, ausschließlich gegen die von Codex bereitgestellte Test-DB. */
const assert = require("node:assert/strict");
const { writeFile } = require("node:fs/promises");
const Module = require("node:module");
const { execFileSync } = require("node:child_process");
const ExcelJS = require("exceljs");

if (!process.env.DATABASE_URL?.startsWith("postgresql://bezirketest@127.0.0.1:54329/")) {
  throw new Error("Dieser Test darf nur mit der isolierten bezirketest-Datenbank laufen.");
}
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-geheimnis-mit-mindestens-zweiunddreissig-zeichen";

const cookie = new Map();
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "server-only") return {};
  if (request === "next/headers") return {
    cookies: async () => ({ get: (key) => cookie.has(key) ? { value: cookie.get(key) } : undefined, set: (key, value) => cookie.set(key, value), delete: (key) => cookie.delete(key) }),
    headers: async () => new Headers({ "x-forwarded-for": "127.0.0.1" }),
  };
  if (request === "next/cache") return { revalidatePath() {} };
  if (request === "next/navigation") return { redirect: (url) => { const error = new Error(url); error.digest = "NEXT_REDIRECT"; throw error; } };
  return originalLoad.call(this, request, parent, isMain);
};
require("tsx/cjs");

const { NextRequest } = require("next/server");
const { prisma } = require("../src/lib/prisma");
const { signToken, setSessionCookie, clearSessionCookie } = require("../src/lib/auth");
const allgemeinXlsx = require("../src/app/api/admin/export/route");
const allgemeinPdf = require("../src/app/api/admin/export/pdf/route");
const katalogXlsx = require("../src/app/api/admin/katalog/export/route");
const katalogPdf = require("../src/app/api/admin/katalog/export/pdf/route");
const aushangPdf = require("../src/app/api/admin/fortbildungen/[id]/aushang/route");
const auswertungXlsx = require("../src/app/api/admin/export/auswertung/route");

const prefix = `et-${Date.now().toString(36)}`;
const titelA = `${prefix}-A-TITEL`;
const titelB = `${prefix}-B-TITEL`;
const schulamtA = `${prefix}-A`;
const schulamtB = `${prefix}-B`;
let rvs;
let adminA;
let bezirkA;
let bezirkB;

const anfrage = (pfad) => new NextRequest(`http://localhost${pfad}`);
const anmelden = async (user) => setSessionCookie(await signToken(user.id, user.sessionVersion));
const puffer = async (antwort) => Buffer.from(await antwort.arrayBuffer());

async function xlsxWerte(antwort, blattName) {
  assert.equal(antwort.status, 200);
  const mappe = new ExcelJS.Workbook();
  await mappe.xlsx.load(await puffer(antwort));
  const blatt = mappe.getWorksheet(blattName);
  assert.ok(blatt, `Arbeitsblatt ${blattName} fehlt.`);
  return [mappe.creator, ...mappe.worksheets.flatMap((seite) => seite.getSheetValues().flat())].filter((wert) => typeof wert === "string");
}

function pdfText(daten) {
  // pdfplumber liest auch komprimierte Aushänge; PDF_PYTHON kann auf die Testumgebung zeigen.
  return execFileSync(process.env.PDF_PYTHON || "python3", ["-c", "import sys,io,pdfplumber; doc=pdfplumber.open(io.BytesIO(sys.stdin.buffer.read())); print('\\n'.join(p.extract_text() or '' for p in doc.pages))"], { input: daten, encoding: "utf8", timeout: 15000 }).replace(/\s+/g, "");
}
async function pdfWerte(route, url) {
  console.log(`PDF-Prüfung: ${route === allgemeinPdf ? "Bericht" : "Katalog"} ${url}`);
  const antwort = await route.GET(anfrage(url));
  assert.equal(antwort.status, 200);
  return [pdfText(await puffer(antwort))];
}

function enthaelt(wert, gesucht) {
  return wert.includes(gesucht);
}

function pruefeNurA(werte) {
  assert.ok(werte.some((wert) => enthaelt(wert, titelA)));
  assert.ok(werte.some((wert) => enthaelt(wert, schulamtA)));
  assert.equal(werte.some((wert) => enthaelt(wert, titelB) || enthaelt(wert, schulamtB)), false);
}

function pruefeBeide(werte) {
  for (const wert of [titelA, titelB, schulamtA, schulamtB]) assert.ok(werte.some((eintrag) => enthaelt(eintrag, wert)), `${wert} fehlt.`);
}

async function aufraeumen() {
  const users = [rvs?.id, adminA?.id].filter(Boolean);
  if (users.length) await prisma.auditLog.deleteMany({ where: { userId: { in: users } } });
  await prisma.fortbildung.deleteMany({ where: { titel: { startsWith: prefix } } });
  await prisma.veranstaltungsort.deleteMany({ where: { name: { startsWith: prefix } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: prefix } } });
  await prisma.bezirk.deleteMany({ where: { name: { startsWith: prefix } } });
}

(async () => {
  await aufraeumen();
  try {
    [bezirkA, bezirkB] = await Promise.all([
      prisma.bezirk.create({ data: { name: schulamtA } }),
      prisma.bezirk.create({ data: { name: schulamtB } }),
    ]);
    rvs = await prisma.user.create({ data: { email: `${prefix}-rvs@example.invalid`, role: "RVS" } });
    adminA = await prisma.user.create({ data: { email: `${prefix}-admin-a@example.invalid`, role: "ADMIN", bezirke: { connect: { id: bezirkA.id } } } });
    const ort = await prisma.veranstaltungsort.create({ data: { name: `${prefix}-Online`, istOnline: true } });
    await prisma.fortbildung.createMany({ data: [
      {
        slug: `${prefix}-a`, titel: titelA, beschreibungHtml: "<p>Exportprüfung A</p>", beschreibungText: "Exportprüfung A",
        organisationsform: "SCHILF", maxTn: 12, format: "ESESSION", beginn: new Date("2025-03-11T09:00:00Z"), ende: new Date("2025-03-11T11:00:00Z"),
        veranstaltungsortId: ort.id, schularten: ["GRUNDSCHULE"], status: "VEROEFFENTLICHT", bezirkId: bezirkA.id, createdById: adminA.id, tnTatsaechlich: 10,
      },
      {
        slug: `${prefix}-b`, titel: titelB, beschreibungHtml: "<p>Exportprüfung B</p>", beschreibungText: "Exportprüfung B",
        organisationsform: "REGIONAL", maxTn: 18, format: "ESESSION", beginn: new Date("2025-04-14T09:00:00Z"), ende: new Date("2025-04-14T11:00:00Z"),
        veranstaltungsortId: ort.id, schularten: ["MITTELSCHULE"], status: "VEROEFFENTLICHT", bezirkId: bezirkB.id, createdById: rvs.id, tnTatsaechlich: 15,
      },
    ] });

    await clearSessionCookie();
    for (const route of [allgemeinXlsx, allgemeinPdf, katalogXlsx, katalogPdf, auswertungXlsx]) {
      assert.equal((await route.GET(anfrage("/api/admin/export"))).status, 401);
    }

    await anmelden(adminA);
    pruefeNurA(await xlsxWerte(await allgemeinXlsx.GET(anfrage("/api/admin/export")), "Fortbildungen"));
    pruefeNurA(await xlsxWerte(await katalogXlsx.GET(anfrage("/api/admin/katalog/export")), "Fortbildungskatalog"));
    pruefeNurA(await xlsxWerte(await auswertungXlsx.GET(anfrage("/api/admin/export/auswertung?schuljahr=alle")), "Veranstaltungen"));
    for (const route of [allgemeinXlsx, katalogXlsx, auswertungXlsx]) {
      const antwort = await route.GET(anfrage(route === katalogXlsx ? `/api/admin/katalog/export?bezirk=${bezirkB.id}` : `/api/admin/export${route === auswertungXlsx ? "/auswertung?schuljahr=alle&" : "?"}bezirk=${bezirkB.id}`));
      const blatt = route === katalogXlsx ? "Fortbildungskatalog" : route === auswertungXlsx ? "Veranstaltungen" : "Fortbildungen";
      const werte = await xlsxWerte(antwort, blatt);
      assert.equal(werte.some((wert) => enthaelt(wert, titelA) || enthaelt(wert, titelB) || enthaelt(wert, schulamtA) || enthaelt(wert, schulamtB)), false);
    }


    for (const route of [allgemeinPdf, katalogPdf]) {
      pruefeNurA(await pdfWerte(route, "/api/admin/export/pdf"));
      const leer = await pdfWerte(route, `/api/admin/export/pdf?bezirk=${bezirkB.id}`);
      for (const wert of [titelA, titelB, schulamtA, schulamtB]) assert.equal(leer[0].includes(wert), false);
    }
    const eventA = await prisma.fortbildung.findUniqueOrThrow({ where: { slug: `${prefix}-a` } });
    const eventB = await prisma.fortbildung.findUniqueOrThrow({ where: { slug: `${prefix}-b` } });
    console.log("PDF-Prüfung: Aushang BdB");
    const aushangA = await aushangPdf.GET(anfrage("/api/admin/fortbildungen/a/aushang"), { params: Promise.resolve({ id: eventA.id }) });
    assert.equal(aushangA.status, 200);
    pruefeNurA([pdfText(await puffer(aushangA))]);
    assert.equal((await aushangPdf.GET(anfrage("/api/admin/fortbildungen/b/aushang"), { params: Promise.resolve({ id: eventB.id }) })).status, 404);
    await anmelden(rvs);
    pruefeBeide(await xlsxWerte(await allgemeinXlsx.GET(anfrage("/api/admin/export")), "Fortbildungen"));
    pruefeBeide(await xlsxWerte(await katalogXlsx.GET(anfrage("/api/admin/katalog/export")), "Fortbildungskatalog"));
    pruefeBeide(await xlsxWerte(await auswertungXlsx.GET(anfrage("/api/admin/export/auswertung?schuljahr=alle")), "Veranstaltungen"));
    pruefeNurA(await xlsxWerte(await allgemeinXlsx.GET(anfrage(`/api/admin/export?bezirk=${bezirkA.id}`)), "Fortbildungen"));
    pruefeNurA(await xlsxWerte(await katalogXlsx.GET(anfrage(`/api/admin/katalog/export?bezirk=${bezirkA.id}`)), "Fortbildungskatalog"));
    pruefeNurA(await xlsxWerte(await auswertungXlsx.GET(anfrage(`/api/admin/export/auswertung?schuljahr=alle&bezirk=${bezirkA.id}`)), "Veranstaltungen"));

    const exportPdf = await puffer(await allgemeinPdf.GET(anfrage("/api/admin/export/pdf")));
    const katalogPdfPuffer = await puffer(await katalogPdf.GET(anfrage("/api/admin/katalog/export/pdf")));
    await writeFile("/private/tmp/bezirke-export-pruefung.pdf", exportPdf);
    await writeFile("/private/tmp/bezirke-katalog-pruefung.pdf", katalogPdfPuffer);
    for (const wert of [titelA, titelB, schulamtA, schulamtB]) {
      assert.ok(pdfText(exportPdf).includes(wert), `Bericht: ${wert} fehlt.`);
      assert.ok(pdfText(katalogPdfPuffer).includes(wert), `Katalog: ${wert} fehlt.`);
    }
    for (const route of [allgemeinPdf, katalogPdf]) pruefeNurA(await pdfWerte(route, `/api/admin/export/pdf?bezirk=${bezirkA.id}`));
    const aushangB = await aushangPdf.GET(anfrage("/api/admin/fortbildungen/b/aushang"), { params: Promise.resolve({ id: eventB.id }) });
    assert.equal(aushangB.status, 200);
    const aushangPuffer = await puffer(aushangB);
    assert.ok(pdfText(aushangPuffer).includes(schulamtB));
    await writeFile("/private/tmp/bezirke-aushang-pruefung.pdf", aushangPuffer);
    await writeFile("/private/tmp/bezirke-export-pruefung.pdf", exportPdf);
    await writeFile("/private/tmp/bezirke-katalog-pruefung.pdf", katalogPdfPuffer);
    console.log("Bezirks-Exporte: Scopes, Schulamtsfelder, Filter und anonyme Zugriffe bestanden.");
  } finally {
    await clearSessionCookie();
    await aufraeumen();
    await prisma.$disconnect();
  }
})().catch((fehler) => { console.error(fehler); process.exitCode = 1; });
