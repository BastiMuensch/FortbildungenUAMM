/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS-Ladehook isoliert server-only. */
/* Kryptografische MFA-Helfer ohne Datenbank oder Next-Request-Kontext prüfen. */
const assert = require("node:assert/strict");
const Module = require("node:module");
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "server-only") return {};
  return originalLoad.call(this, request, parent, isMain);
};
require("tsx/cjs");
process.env.MFA_ENCRYPTION_KEY = "test-schluessel-mit-mindestens-zweiunddreissig-zeichen";
const { entschluesseleMfaGeheimnis, erstelleTotpGeheimnis, erstelleWiederherstellungscodes, findeTotpZaehler, hasheWiederherstellungscode, istPrivilegierteRolle, verschluesseleMfaGeheimnis } = require("../src/lib/mfa");

const geheimnis = erstelleTotpGeheimnis();
assert.match(geheimnis, /^[A-Z2-7]+$/);
const verschluesselt = verschluesseleMfaGeheimnis(geheimnis);
assert.notEqual(verschluesselt, geheimnis);
assert.equal(entschluesseleMfaGeheimnis(verschluesselt), geheimnis);
assert.equal(entschluesseleMfaGeheimnis(`${verschluesselt}manipuliert`), null);
// RFC 6238, SHA-1, Zeitstempel 59: 94287082, mit sechs Stellen 287082.
assert.equal(findeTotpZaehler("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ", "287082", 59_000), 1);
assert.equal(findeTotpZaehler("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ", "287083", 59_000), null);
const codes = erstelleWiederherstellungscodes();
assert.equal(codes.length, 10);
assert.equal(new Set(codes).size, 10);
assert.equal(hasheWiederherstellungscode(codes[0]), hasheWiederherstellungscode(codes[0].replace("-", "")));
assert.equal(istPrivilegierteRolle("ADMIN"), true);
assert.equal(istPrivilegierteRolle("REFERENT"), false);
console.log("MFA-Prüfungen erfolgreich.");
