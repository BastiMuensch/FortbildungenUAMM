/* eslint-disable @typescript-eslint/no-require-imports -- Server Action ohne laufende Datenbank prüfen. */
const assert = require("node:assert/strict");
const Module = require("node:module");

let rolle = "RVS";
const texte = new Map([["datenschutz", "Bisher veröffentlichter Text"]]);
const aenderungen = [];
const protokoll = [];
const erneuert = [];
const original = Module._load;
Module._load = function (name, ...argumente) {
  if (name === "@/lib/auth") return { requireRole: async (...rollen) => {
    if (!rollen.includes(rolle)) throw new Error("Zugriff verweigert");
    return { id: "rvs-test" };
  } };
  if (name === "@/lib/prisma") return { prisma: { systemSetting: { upsert: async (eingabe) => {
    aenderungen.push(eingabe);
    texte.set(eingabe.where.id, eingabe.update.value);
  } } } };
  if (name === "@/lib/audit") return { auditLog: async (eintrag) => protokoll.push(eintrag) };
  if (name === "next/cache") return { revalidatePath: (pfad) => erneuert.push(pfad) };
  return original.call(this, name, ...argumente);
};
require("tsx/cjs");
const { speichereSystemtext } = require("../src/actions/systemtext");
const { DATENSCHUTZERKLAERUNG_ENTWURF } = require("../src/constants/datenschutz");

function formulardaten(text) {
  const daten = new FormData();
  daten.set("wert", text);
  return daten;
}

(async () => {
  // Auch ein direkter Aufruf ohne Formular darf den Entwurf nicht publizieren.
  const unvollstaendig = [
    DATENSCHUTZERKLAERUNG_ENTWURF,
    "Ein ausreichend langer Rechtstext mit [ offen: einer fehlenden Frist ].",
    "Platzhalter — dieser alte Beispieltext muss erst vervollständigt werden.",
    " ",
    "x".repeat(100_001),
  ];
  for (const id of ["datenschutz", "impressum"]) {
    for (const text of unvollstaendig) {
      const ergebnis = await speichereSystemtext(id, {}, formulardaten(text));
      assert.ok(ergebnis.fehler?._);
      assert.equal(ergebnis.erfolg, undefined);
    }
  }
  assert.equal(aenderungen.length, 0);
  assert.equal(texte.get("datenschutz"), "Bisher veröffentlichter Text");
  assert.equal(protokoll.length, 0);

  // Prüfung der tatsächlichen Server Action, nicht nur der sichtbaren Knöpfe.
  const vollstaendig = "Ein redaktionell vervollständigter Rechtstext für diese isolierte Funktionsprüfung.";
  for (const unberechtigt of ["ADMIN", "REFERENT", ""]) {
    rolle = unberechtigt;
    await assert.rejects(speichereSystemtext("datenschutz", {}, formulardaten(vollstaendig)), /Zugriff verweigert/);
  }
  rolle = "RVS";
  assert.ok((await speichereSystemtext("lastRetentionRun", {}, formulardaten(vollstaendig))).fehler?._);
  assert.equal(aenderungen.length, 0);

  const ergebnis = await speichereSystemtext("datenschutz", {}, formulardaten(`  ${vollstaendig}\n`));
  assert.equal(ergebnis.erfolg, true);
  assert.equal(texte.get("datenschutz"), vollstaendig);
  assert.equal(aenderungen.length, 1);
  assert.equal(protokoll[0].userId, "rvs-test");
  assert.equal(protokoll[0].entitaetId, "datenschutz");
  assert.deepEqual(erneuert, ["/datenschutz", "/admin/texte", "/admin/einrichtung"]);
  console.log("Rechtstexte: offene Angaben, Bestandsschutz, Rollenprüfung, erlaubte Schlüssel und Veröffentlichung bestanden.");
})().catch((fehler) => { console.error(fehler); process.exitCode = 1; });
