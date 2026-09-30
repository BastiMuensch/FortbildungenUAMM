/* eslint-disable @typescript-eslint/no-require-imports -- Ladehook isoliert Server-Kontext und Datenbank. */
const assert = require("node:assert/strict");
const Module = require("node:module");
require("tsx/cjs");

const { fortbildungScope } = require("../src/lib/berechtigungsScope");
const { formatDatumZeitEingabe } = require("../src/lib/datetime");
let user;
let fortbildung;
let schreibbar;
let aenderungen;
let protokoll;
let invalidierungen;
class AuthError extends Error {}

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "@/lib/auth") return {
    AuthError,
    fortbildungScope,
    requireRole: async (...rollen) => {
      if (!user || !rollen.includes(user.role)) throw new AuthError("Kein Zugriff");
      return user;
    },
  };
  if (request === "@/lib/prisma") return { prisma: { fortbildung: {
    findUnique: async ({ where }) => {
      assert.deepEqual(where.AND, [fortbildungScope(user)], "Lesen muss den echten Berechtigungsfilter verwenden");
      return fortbildung;
    },
    updateMany: async ({ where, data }) => {
      assert.deepEqual(where.AND, [fortbildungScope(user)], "Schreiben muss erneut den Bereich prüfen");
      assert.equal(where.updatedAt, fortbildung.updatedAt, "Gleichzeitige Änderungen müssen geschützt sein");
      assert.equal(where.status, fortbildung.status);
      assert.equal(where.beginn, fortbildung.beginn);
      assert.equal(where.ende, fortbildung.ende);
      if (!schreibbar) return { count: 0 };
      aenderungen.push(data);
      return { count: 1 };
    },
  } } };
  if (request === "@/lib/audit") return { auditLog: async (eintrag) => protokoll.push(eintrag) };
  if (request === "next/cache") return { revalidatePath: (...werte) => invalidierungen.push(werte) };
  return originalLoad.call(this, request, parent, isMain);
};
const { korrigiereDauer } = require("../src/actions/dauer");

function vorbereiten() {
  user = { id: "referent", role: "REFERENT", referentId: "zugeordnet", bezirkIds: ["bezirk"] };
  fortbildung = {
    beginn: new Date("2025-09-15T12:00:00Z"),
    ende: new Date("2025-09-15T14:00:00Z"),
    status: "VEROEFFENTLICHT",
    updatedAt: new Date("2025-09-16T10:00:00Z"),
  };
  schreibbar = true;
  aenderungen = [];
  protokoll = [];
  invalidierungen = [];
}

function formular(ende = "15.09.2025 17:30") {
  const daten = new FormData();
  daten.set("ende", ende);
  daten.set("bisherigesEnde", fortbildung?.ende.toISOString() ?? "");
  // Übermittelte Zusatzfelder dürfen die Ausschreibung niemals ändern.
  daten.set("beginn", "01.01.2000 00:00");
  daten.set("status", "ENTWURF");
  daten.set("titel", "Manipuliert");
  return daten;
}

async function abgelehnt(daten = formular()) {
  const ergebnis = await korrigiereDauer("fortbildung", {}, daten);
  assert.ok(ergebnis.fehler, "Eine Fehlermeldung wird erwartet");
  assert.equal(aenderungen.length, 0);
  assert.equal(protokoll.length, 0);
  assert.equal(invalidierungen.length, 0);
}

(async () => {
  for (const rolle of ["REFERENT", "ADMIN", "RVS"]) {
    for (const status of ["VEROEFFENTLICHT", "ARCHIVIERT"]) {
      vorbereiten();
      user.role = rolle;
      fortbildung.status = status;
      assert.equal((await korrigiereDauer("fortbildung", {}, formular())).erfolg, true);
      assert.equal(aenderungen.length, 1);
      assert.deepEqual(Object.keys(aenderungen[0]).sort(), ["dauerKorrigiertAm", "ende", "endeVorKorrektur"]);
      assert.equal(aenderungen[0].ende.toISOString(), "2025-09-15T15:30:00.000Z");
      assert.equal(aenderungen[0].endeVorKorrektur, fortbildung.ende);
      assert.ok(aenderungen[0].dauerKorrigiertAm instanceof Date);
      assert.equal(protokoll[0].userId, user.id);
      assert.equal(protokoll[0].details.dauerKorrigiert, true);
      assert.deepEqual(invalidierungen, [["/", "layout"]]);
    }
  }
  for (const rolle of ["REDAKTEUR", "UNBEKANNT", null]) {
    vorbereiten();
    if (rolle) user.role = rolle;
    else user = null;
    await abgelehnt();
  }
  for (const status of ["ENTWURF", "EINGEREICHT", "ABGESAGT"]) {
    vorbereiten();
    fortbildung.status = status;
    await abgelehnt();
  }
  vorbereiten();
  fortbildung = null; // Fremde, abgelaufene oder gelöschte Termine liefern keinen Treffer.
  await abgelehnt();
  vorbereiten();
  fortbildung.ende = new Date(Date.now() + 86_400_000);
  await abgelehnt();
  vorbereiten();
  fortbildung.beginn = new Date(Date.now() - 7_200_000);
  fortbildung.ende = new Date(Date.now() - 3_600_000);
  await abgelehnt(formular(formatDatumZeitEingabe(new Date(Date.now() + 3_600_000))));
  for (const ende of ["", "31.02.2025 17:30", "15.09.2025 14:00", "15.09.2025 13:59", "16.10.2025 17:30", "01.01.2099 17:30"]) {
    vorbereiten();
    await abgelehnt(formular(ende));
  }
  vorbereiten();
  fortbildung.beginn = new Date("2025-03-29T12:00:00Z");
  fortbildung.ende = new Date("2025-03-29T14:00:00Z");
  await abgelehnt(formular("30.03.2025 02:30"));
  vorbereiten();
  const veraltet = formular();
  veraltet.set("bisherigesEnde", "2025-09-15T13:00:00.000Z");
  await abgelehnt(veraltet);
  vorbereiten();
  schreibbar = false;
  await abgelehnt();
  vorbereiten();
  assert.equal((await korrigiereDauer("fortbildung", {}, formular("15.09.2025 16:00"))).erfolg, true);
  assert.equal(aenderungen.length, 0, "Unverändertes Speichern erzeugt keine Änderungsmarkierung");
  assert.equal(protokoll.length, 0);
  vorbereiten();
  assert.equal((await korrigiereDauer("fortbildung", {}, formular("15.9.2025 15:00"))).erfolg, true, "Auch Verkürzungen sind möglich");
  assert.equal(aenderungen[0].ende.toISOString(), "2025-09-15T13:00:00.000Z");
  vorbereiten();
  fortbildung.beginn = new Date("2025-01-15T21:00:00Z");
  fortbildung.ende = new Date("2025-01-15T22:00:00Z");
  assert.equal((await korrigiereDauer("fortbildung", {}, formular("16.01.2025 00:30"))).erfolg, true);
  assert.equal(aenderungen[0].ende.toISOString(), "2025-01-15T23:30:00.000Z", "Winterzeit und Tageswechsel bleiben korrekt");
  console.log("Dauerkorrektur: Rollen, Bereichsfilter, Status, Zeitgrenzen, Zeitumstellung, Konflikte und erlaubte Felder bestanden.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
