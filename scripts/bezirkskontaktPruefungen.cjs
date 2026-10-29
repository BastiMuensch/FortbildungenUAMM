/* eslint-disable @typescript-eslint/no-require-imports -- Ladehook isoliert nur Next.js Request-/Cache-Kontext. */
const assert = require("node:assert/strict");
const Module = require("node:module");
if (!process.env.DATABASE_URL?.startsWith("postgresql://bezirketest@127.0.0.1:54329/")) {
  throw new Error("Dieser Test darf nur mit der isolierten bezirketest-Datenbank laufen.");
}
process.env.JWT_SECRET ||= "kontakt-test-geheimnis-mit-mindestens-zweiunddreissig-zeichen";
const cookies = new Map();
const invalidiert = [];
const originalLoad = Module._load;
Module._load = function (anfrage, eltern, hauptmodul) {
  if (anfrage === "server-only") return {};
  if (anfrage === "next/headers") return {
    cookies: async () => ({ get: (name) => cookies.has(name) ? { value: cookies.get(name) } : undefined, set: (name, wert) => cookies.set(name, wert), delete: (name) => cookies.delete(name) }),
  };
  if (anfrage === "next/cache") return { revalidatePath: (...argumente) => invalidiert.push(argumente) };
  if (anfrage === "next/navigation") return { notFound: () => { throw new Error("NICHT_GEFUNDEN"); } };
  return originalLoad.call(this, anfrage, eltern, hauptmodul);
};
require("tsx/cjs");

const { prisma } = require("../src/lib/prisma");
const { signToken, setSessionCookie, clearSessionCookie } = require("../src/lib/auth");
const { speichereBezirkskontakt } = require("../src/actions/bezirkskontakt");
const { ladeOeffentlichenBezirk } = require("../src/lib/schulamtStartseite");
const { bezirksKontaktLink } = require("../src/lib/bezirkskontakt");
const prefix = `kontakt-test-${Date.now()}`;
const formular = (email) => { const daten = new FormData(); daten.set("kontaktEmail", email); return daten; };
const anmelden = async (person, mfa = true) => setSessionCookie(await signToken(person.id, person.sessionVersion, mfa));

(async () => {
  try {
    const a = await prisma.bezirk.create({ data: { name: `${prefix}-A`, kuerzel: `${prefix}-a` } });
    const b = await prisma.bezirk.create({ data: { name: `${prefix}-B`, kuerzel: `${prefix}-b` } });
    const bdb = await prisma.user.create({ data: { email: `${prefix}-intern@example.test`, role: "ADMIN", mfaAktiviertAm: new Date(), bezirke: { connect: { id: a.id } } } });
    const rvs = await prisma.user.create({ data: { email: `${prefix}-rvs@example.test`, role: "RVS", mfaAktiviertAm: new Date() } });
    const referent = await prisma.user.create({ data: { email: `${prefix}-referent@example.test`, role: "REFERENT", referent: { create: { vorname: "Test", nachname: "Referent", bezirke: { connect: { id: a.id } } } } } });
    const speichern = (id = a.id, email = "bdb+anfragen@example.test") => speichereBezirkskontakt(id, {}, formular(email));

    await clearSessionCookie();
    assert.ok((await speichern()).fehler?._, "Ohne Anmeldung kein Schreibzugriff.");
    await anmelden(referent);
    assert.ok((await speichern()).fehler?._, "Referierende dürfen Kontaktadressen nicht verwalten.");
    await anmelden(bdb, false);
    assert.ok((await speichern()).fehler?._, "MFA muss bestätigt sein.");
    await anmelden(bdb);
    assert.ok((await speichern(b.id)).fehler?._, "Fremde Bezirke bleiben geschützt.");
    assert.equal((await prisma.bezirk.findUniqueOrThrow({ where: { id: b.id } })).kontaktEmail, null);
    for (const email of ["ungueltig", "a@example.test,b@example.test", "a@example.test\r\nBcc: b@example.test", "a@example.test?bcc=b@example.test", "a".repeat(255) + "@example.test"]) {
      assert.ok((await speichern(a.id, email)).fehler?.kontaktEmail, `Ungültige Adresse abweisen: ${email}`);
    }
    assert.ok((await speichern("ungueltige-id")).fehler?.bezirkId);
    assert.equal((await speichern(a.id, "  bdb+anfragen@example.test  ")).erfolg, true);
    const oeffentlich = await ladeOeffentlichenBezirk(a.kuerzel);
    assert.deepEqual(oeffentlich, { id: a.id, name: a.name, kuerzel: a.kuerzel, kontaktEmail: "bdb+anfragen@example.test" }, "Nur explizite öffentliche Adresse, keine Kontodaten.");
    assert.ok(invalidiert.some(([pfad, typ]) => pfad === "/(schulamt)/[schulamt]" && typ === "layout"));

    const link = new URL(bezirksKontaktLink("bdb+anfragen@example.test", "Günzburg & Umgebung?", true));
    assert.equal(link.protocol, "mailto:");
    assert.equal(decodeURIComponent(link.pathname), "bdb+anfragen@example.test");
    assert.equal(link.searchParams.get("subject"), "Fortbildungsanfrage – Schulamtsbezirk Günzburg & Umgebung?");
    assert.deepEqual([...link.searchParams.keys()], ["subject", "body"]);
    for (const feld of ["Thema", "Schule", "Zielgruppe", "Zeitraum", "Format", "Rückkontakt"]) assert.ok(link.searchParams.get("body").includes(feld));
    assert.match(new URL(bezirksKontaktLink("bdb@example.test", "A")).searchParams.get("subject"), /^Kontakt/);

    await anmelden(rvs);
    assert.equal((await speichern(b.id)).erfolg, true, "RvS darf alle aktiven Bezirke verwalten.");
    await anmelden(bdb);
    assert.equal((await speichern(a.id, "  ")).erfolg, true);
    assert.equal((await ladeOeffentlichenBezirk(a.kuerzel)).kontaktEmail, null, "Entfernen veröffentlicht keine Ersatzadresse.");
    await prisma.bezirk.update({ where: { id: a.id }, data: { aktiv: false } });
    await anmelden(rvs);
    assert.ok((await speichern()).fehler?._, "Auch RvS bearbeitet hier nur aktive Bezirke.");
    await assert.rejects(() => ladeOeffentlichenBezirk(a.kuerzel), /NICHT_GEFUNDEN/);
    await assert.rejects(() => ladeOeffentlichenBezirk(`${prefix}-unbekannt`), /NICHT_GEFUNDEN/);
    console.log("Bezirkskontakt: Rollen, MFA, Bezirksscope, Validierung, Veröffentlichung, Entfernen, inaktive Bezirke und E-Mail-Vorlagen bestanden.");
  } finally {
    await prisma.auditLog.deleteMany({ where: { user: { email: { startsWith: prefix } } } });
    await prisma.referent.deleteMany({ where: { user: { email: { startsWith: prefix } } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: prefix } } });
    await prisma.bezirk.deleteMany({ where: { name: { startsWith: prefix } } });
    await prisma.$disconnect();
  }
})().catch((fehler) => { console.error(fehler); process.exitCode = 1; });
