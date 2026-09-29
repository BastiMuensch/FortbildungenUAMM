/* eslint-disable @typescript-eslint/no-require-imports -- isolierter server-only-Ladehook. */
const assert = require("node:assert/strict");
const Module = require("node:module");
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "server-only") return {};
  return originalLoad.call(this, request, parent, isMain);
};
require("tsx/cjs");

const { darfImportSchreiben } = require("../src/lib/fibs/importer");
const jetzt = new Date("2026-09-24T12:00:00.000Z");
// Schuljahr 2023/24 endete am 31.07.2024, die 400-Tage-Frist ist abgelaufen.
assert.equal(darfImportSchreiben(new Date("2024-06-20T10:00:00.000Z"), null, jetzt), false);
// Ein neuer Termin ist zulässig, aber niemals als Aktualisierung eines
// bereits abgelaufenen Datensatzes: Das verhindert dessen Wiederbelebung.
assert.equal(darfImportSchreiben(new Date("2026-10-20T10:00:00.000Z"), new Date("2026-09-24T12:00:00.000Z"), jetzt), false);
assert.equal(darfImportSchreiben(new Date("2026-10-20T10:00:00.000Z"), new Date("2027-10-01T00:00:00.000Z"), jetzt), true);
console.log("Import-Frist-Prüfungen erfolgreich.");
