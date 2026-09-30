import assert from "node:assert/strict";

import { katalogWhere, leseKatalogFilter } from "../src/lib/katalog";
import type { SessionUser } from "../src/lib/auth";

const user: SessionUser = {
  id: "referent-1",
  email: "referent@example.invalid",
  name: "Referent",
  role: "REFERENT",
  referentId: "referent-1",
  bezirkIds: ["bezirk-a"],
  bezirke: [{ id: "bezirk-a", name: "Schulamt A" }],
  mfaBestaetigt: true,
  mfaEinrichtungErforderlich: false,
};

const jetzt = new Date("2026-09-21T12:00:00Z");

const standard = leseKatalogFilter({}, jetzt);
assert.equal(standard.schuljahr, "2026/2027", "Der Katalog startet im laufenden Berliner Schuljahr.");

const alle = leseKatalogFilter({ schuljahr: "alle" }, jetzt);
assert.equal(alle.schuljahr, undefined, "Die bewusste Auswahl aller Schuljahre bleibt erhalten.");

const historisch = leseKatalogFilter({ schuljahr: "2024/2025", bezirk: "bezirk-a" }, jetzt);
assert.equal(historisch.schuljahr, "2024/2025", "Frühere Schuljahre bleiben im Katalog recherchierbar.");
assert.equal(historisch.bezirk, "bezirk-a");

const wiederholt = leseKatalogFilter({ schuljahr: ["2025/2026", "2026/2027"] }, jetzt);
assert.equal(wiederholt.schuljahr, "2025/2026", "Liste und Export werten wiederholte Parameter gleich aus.");

const gefiltert = leseKatalogFilter({ schuljahr: "2025/2026", bezirk: "bezirk-a", von: "2026-03-29", bis: "2026-03-29" }, jetzt);
const where = katalogWhere(user, gefiltert, jetzt);
const bedingungen = where.AND as Array<Record<string, unknown>>;
assert.equal(bedingungen.length, 4);
assert.equal(JSON.stringify(bedingungen[0]).includes('"referentId":"referent-1"'), true, "Der Katalog behält den Referenten-Scope bei.");
assert.equal(JSON.stringify(bedingungen[1]).includes('"schuljahr":2025'), true, "Der Katalog filtert das Schuljahr über das gespeicherte Schuljahr.");
assert.equal(JSON.stringify(bedingungen[1]).includes('"bezirkId":"bezirk-a"'), true, "Der Katalog filtert den Bezirk gemeinsam für Anzeige und Exporte.");
assert.equal(JSON.stringify(bedingungen[1]).includes('2026-03-28T23:00:00.000Z'), true, "Der Zeitraum beginnt an der Berliner Tagesgrenze.");
assert.equal(JSON.stringify(bedingungen[1]).includes('2026-03-29T21:59:59.999Z'), true, "Der Zeitraum endet an der Berliner Tagesgrenze.");
assert.deepEqual(bedingungen[2], { ende: { lt: jetzt } });
assert.deepEqual(bedingungen[3], { status: { in: ["VEROEFFENTLICHT", "ARCHIVIERT"] } });

console.log("Katalog: Schuljahrvorgabe, historische Recherche, Scope und Berliner Zeitraumfilter bestanden.");
