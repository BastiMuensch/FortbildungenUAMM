/* eslint-disable @typescript-eslint/no-require-imports -- Isolierte Prüfung echter Migrationen und Server Actions. */
const assert = require("node:assert/strict");
const { readFileSync, readdirSync } = require("node:fs");
const { execFileSync } = require("node:child_process");
const Module = require("node:module");

const testUrl = "postgresql://schulimporttest@localhost:54339/schulimport_test?host=/tmp/schulimport-pruefung";
if (process.env.DATABASE_URL !== testUrl) throw new Error("Nur die leere, isolierte Schulimport-Testdatenbank ist zulässig.");
const sqlDatei = (datei) => execFileSync("psql", ["-h", "/tmp/schulimport-pruefung", "-p", "54339", "-U", "schulimporttest", "-d", "schulimport_test", "-v", "ON_ERROR_STOP=1", "-f", datei], { stdio: "pipe" });

let sitzung;
const original = Module._load;
Module._load = function (name, ...args) {
  if (name === "server-only") return {};
  if (name === "next/cache") return { revalidatePath() {} };
  if (name === "next/headers") return { cookies: async () => ({ get() {} }), headers: async () => new Headers() };
  const ergebnis = original.call(this, name, ...args);
  if (name === "@/lib/auth") return {
    ...ergebnis,
    requireRole: async (...rollen) => {
      if (!sitzung || !rollen.includes(sitzung.role)) throw new ergebnis.AuthError("Nicht berechtigt.");
      return sitzung;
    },
  };
  return ergebnis;
};
require("tsx/cjs");
const { prisma } = require("../src/lib/prisma");
const { ORTE_SEED } = require("../prisma/seed-data/orte");
const { pruefeSchulimport, uebernehmeSchulimport } = require("../src/actions/schulimport");
const { speichereOrt } = require("../src/actions/stammdaten");
const form = (werte) => { const daten = new FormData(); for (const [k, v] of Object.entries(werte)) daten.set(k, v); return daten; };

(async () => {
  try {
    // Auf einer leeren Testdatenbank zuerst den tatsächlichen früheren Stand herstellen.
    for (const name of readdirSync("prisma/migrations").sort()) {
      if (name < "20261109" && name !== "migration_lock.toml") sqlDatei(`prisma/migrations/${name}/migration.sql`);
    }
    const uamm = await prisma.bezirk.findUniqueOrThrow({ where: { name: "Memmingen-Unterallgäu" } });
    const fremd = await prisma.bezirk.create({ data: { name: "Anderer Bezirk", kuerzel: "anderer-bezirk" } });
    const konto = await prisma.user.create({ data: { email: "schulimport@example.invalid", name: "Importprüfung", role: "RVS" } });
    sitzung = { id: konto.id, role: "RVS", bezirkIds: [], referentId: null };
    for (const ort of ORTE_SEED) {
      const { schulnummer: _schulnummer, ...fruehererOrt } = ort;
      await prisma.veranstaltungsort.create({ data: { ...fruehererOrt, aktiv: ort.name !== "Grundschule Buxheim" }, select: { id: true } });
    }
    const altorte = await prisma.$queryRawUnsafe('SELECT * FROM "Veranstaltungsort" ORDER BY "id"');
    const termine = [];
    for (const ort of altorte) {
      termine.push(await prisma.fortbildung.create({ data: {
        slug: `bestand-${ort.id}`, titel: "Bestehende Fortbildung", beschreibungHtml: "<p>Bestand</p>", beschreibungText: "Bestand",
        organisationsform: "SCHILF", maxTn: 12, format: ort.istOnline ? "ESESSION" : "PRAESENZ",
        beginn: new Date("2026-10-01T09:00:00Z"), ende: new Date("2026-10-01T11:00:00Z"),
        veranstaltungsortId: ort.id, schularten: ["GRUNDSCHULE"], bezirkId: fremd.id,
      } }));
    }
    sqlDatei("prisma/migrations/20261109120000_schulen_schulamt/migration.sql");
    sqlDatei("prisma/migrations/20261109121000_schulen_altbestand/migration.sql");
    const zugeordnet = await prisma.veranstaltungsort.findMany({ orderBy: { id: "asc" } });
    assert.equal(zugeordnet.filter(o => o.schulamtId === uamm.id).length, 52);
    assert.equal(zugeordnet.filter(o => o.schulnummer).length, 51);
    for (const vorher of altorte) {
      const { schulamtId, schulnummer, ...nachher } = zugeordnet.find(o => o.id === vorher.id);
      assert.deepEqual(nachher, (({ schulnummer: _schulnummer, ...rest }) => rest)(vorher), "Die Migration erhält Orts-IDs, Namen, Adressen und Aktivstatus.");
      if (vorher.istOnline) assert.equal(schulamtId, null);
      if (vorher.name === "Grund- und Mittelschule Memmingerberg") assert.equal(schulnummer, null);
    }
    sqlDatei("prisma/migrations/20261109121000_schulen_altbestand/migration.sql");
    assert.deepEqual(await prisma.veranstaltungsort.findMany({ orderBy: { id: "asc" } }), zugeordnet, "Die Bestandsergänzung ist wiederholbar.");
    const augsburg = await prisma.bezirk.findUniqueOrThrow({ where: { name: "Augsburg-Land" } });
    const csv = readFileSync("outputs/schulimport-memmingen-unterallgaeu/schulen-memmingen-unterallgaeu.csv", "utf8");
    const pruefen = (schulamtId = uamm.id) => pruefeSchulimport({}, form({ schulamtId, datei: new File([csv], "schulen.csv", { type: "text/csv" }) }));
    const uebernehmen = (vorschau, schulamtId = uamm.id) => uebernehmeSchulimport({}, form({ csv: vorschau.csv, pruefsumme: vorschau.pruefsumme, schulamtId }));
    const vorschau = await pruefen();
    assert.deepEqual(vorschau.plan.fehler, []);
    assert.equal(vorschau.plan.zeilen.filter(z => z.aktion === "neu").length, 2, "Nur die getrennten Schulen Memmingerberg sind neu; alte Namensvarianten werden erkannt.");
    assert.ok((await uebernehmen(vorschau, augsburg.id)).fehler, "Ein anderes Schulamt kann nicht nachträglich untergeschoben werden.");
    assert.ok((await uebernehmen(vorschau)).meldung);
    assert.ok((await uebernehmen(vorschau)).fehler, "Eine durch die erste Übernahme veraltete Vorschau wird abgewiesen.");
    assert.equal((await pruefen()).plan.zeilen.filter(z => z.aktion === "unveraendert").length, 53);
    assert.equal((await prisma.veranstaltungsort.findFirstOrThrow({ where: { name: "Grundschule Buxheim" } })).aktiv, false);
    assert.ok((await pruefen(augsburg.id)).plan.fehler.length, "Vorhandene Schulen werden nicht umgeordnet.");
    for (const vorher of termine) assert.deepEqual(await prisma.fortbildung.findUniqueOrThrow({ where: { id: vorher.id } }), vorher, "Sämtliche Fortbildungsfelder einschließlich beider Zuordnungen bleiben unverändert.");

    const alCsv = readFileSync("outputs/schulimport-augsburg-land/schulen-augsburg-land.csv", "utf8");
    const alVorschau = await pruefeSchulimport({}, form({ schulamtId: augsburg.id, datei: new File([alCsv], "augsburg.csv") }));
    assert.deepEqual(alVorschau.plan.fehler, []);
    assert.equal(alVorschau.plan.zeilen.filter(z => z.aktion === "neu").length, 64);
    assert.ok((await uebernehmen(alVorschau, uamm.id)).fehler, "Auch bei ausschließlich neuen Schulen schützt die Prüfsumme die Schulamtsauswahl.");
    assert.ok((await uebernehmen(alVorschau, augsburg.id)).meldung);
    assert.equal(await prisma.veranstaltungsort.count({ where: { schulamtId: augsburg.id } }), 64);

    sitzung = { ...sitzung, role: "ADMIN", bezirkIds: [augsburg.id] };
    assert.ok((await pruefen()).fehler, "BdB darf kein fremdes Schulamt importieren.");
    assert.ok((await uebernehmen(vorschau)).fehler, "Auch die Übernahme prüft die Berechtigung selbst.");
    assert.ok((await speichereOrt({}, form({ name: "Fremde Schule", ort: "Ort", schulamtId: uamm.id }))).fehler);
    assert.ok((await speichereOrt({}, form({ name: "Schule ohne Schulamt", ort: "Ort", schulnummer: "1234" }))).fehler);
    assert.ok((await speichereOrt({}, form({ name: "Eigene Schule", ort: "Ort", schulamtId: augsburg.id }))).erfolg);
    await prisma.bezirk.update({ where: { id: augsburg.id }, data: { aktiv: false } });
    assert.ok((await pruefen(augsburg.id)).fehler, "Inaktive Schulämter sind gesperrt.");
    sitzung = { ...sitzung, role: "REFERENT" };
    await assert.rejects(pruefen());
    await assert.rejects(uebernehmen(vorschau));
    console.log("Schulimport: echte Migrationen, 52 Bestandsorte, 53 UAMM-Schulen, 64 Augsburg-Land-Schulen, unveränderte Fortbildungen, Prüfsummen und Rollenprüfung bestanden.");
  } finally { await prisma.$disconnect(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
