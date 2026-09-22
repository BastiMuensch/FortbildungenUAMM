/* eslint-disable @typescript-eslint/no-require-imports -- Ladehook isoliert nur den Next.js-Request-Kontext. */
const assert = require("node:assert/strict");
const Module = require("node:module");
if (!process.env.DATABASE_URL?.startsWith("postgresql://bezirketest@127.0.0.1:54329/")) {
  throw new Error("Dieser Test darf nur mit der isolierten bezirketest-Datenbank laufen.");
}
process.env.JWT_SECRET = "test-geheimnis-mit-mindestens-zweiunddreissig-zeichen";
const cookies = new Map();
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "server-only") return {};
  if (request === "next/headers") return {
    cookies: async () => ({ get: (k) => cookies.has(k) ? { value: cookies.get(k) } : undefined, set: (k, v) => cookies.set(k, v), delete: (k) => cookies.delete(k) }),
    headers: async () => new Headers({ "x-forwarded-for": "127.0.0.1" }),
  };
  if (request === "next/cache") return { revalidatePath() {} };
  return originalLoad.call(this, request, parent, isMain);
};
require("tsx/cjs");
const { prisma } = require("../src/lib/prisma");
const { signToken, setSessionCookie } = require("../src/lib/auth");
const { speichereBdb, erzeugeBdbZugangslink } = require("../src/actions/bezirke");
const { ladeBdbsMitEinladung } = require("../src/lib/bdbVerwaltung");
const { erzeugeZugangstoken, pruefeZugangstoken, verbraucheTokenUndSetzePasswort } = require("../src/lib/zugang");
const { entschluesseleZugangslinkToken } = require("../src/lib/zugangslinkSpeicher");
const prefix = `bdbtest-${Date.now()}`;
const anmelden = async (u) => setSessionCookie(await signToken(u.id, u.sessionVersion));
const einladung = async (u) => (await ladeBdbsMitEinladung()).find((bdb) => bdb.id === u.id).einladung;
const tokenAus = (link) => new URL(link).searchParams.get("token");
const form = (daten) => { const f = new FormData(); Object.entries(daten).forEach(([k, v]) => f.set(k, v)); return f; };

(async () => {
  try {
    const bezirk = await prisma.bezirk.create({ data: { name: prefix } });
    const rvs = await prisma.user.create({ data: { email: `${prefix}-rvs@example.test`, role: "RVS" } });
    await anmelden(rvs);
    const daten = form({ name: "Test BdB", email: `${prefix}-bdb@example.test`, aktiv: "on", bezirkIds: bezirk.id });
    const ergebnis = await speichereBdb(null, {}, daten);
    assert.equal(ergebnis.erfolg, true);
    assert.equal(ergebnis.link, undefined);
    const bdb = await prisma.user.findUniqueOrThrow({ where: { email: daten.get("email") } });
    const erste = await einladung(bdb);
    assert.equal(erste.status, "OFFEN");
    assert.deepEqual(await einladung(bdb), erste, "Link bleibt beim erneuten Laden identisch");
    const token = tokenAus(erste.link);
    const gespeichert = await prisma.zugangstoken.findFirstOrThrow({ where: { userId: bdb.id } });
    assert.notEqual(gespeichert.tokenHash, token);
    assert.ok(gespeichert.tokenVerschluesselt && !gespeichert.tokenVerschluesselt.includes(token));
    assert.equal((await pruefeZugangstoken(token)).userId, bdb.id);
    assert.equal(entschluesseleZugangslinkToken(gespeichert.tokenVerschluesselt, rvs.id), null);
    assert.equal(entschluesseleZugangslinkToken(`${gespeichert.tokenVerschluesselt}.kaputt`, bdb.id), null);
    const geheimnis = process.env.JWT_SECRET;
    process.env.JWT_SECRET = `${geheimnis}-neu`;
    assert.equal(entschluesseleZugangslinkToken(gespeichert.tokenVerschluesselt, bdb.id), null);
    process.env.JWT_SECRET = geheimnis;
    assert.ok(await pruefeZugangstoken(token), "Schlüsselwechsel verändert die Token-Prüfung nicht");

    for (const rolle of ["ADMIN", "REDAKTEUR", "REFERENT"]) {
      const fremd = await prisma.user.create({ data: { email: `${prefix}-${rolle}@example.test`, role: rolle } });
      await anmelden(fremd);
      await assert.rejects(ladeBdbsMitEinladung);
      assert.ok((await erzeugeBdbZugangslink(bdb.id)).fehler?._);
      assert.ok((await speichereBdb(null, {}, daten)).fehler?._);
    }
    cookies.clear();
    await assert.rejects(ladeBdbsMitEinladung);
    assert.ok((await erzeugeBdbZugangslink(bdb.id)).fehler?._);
    await anmelden(rvs);
    assert.equal((await einladung(bdb)).link, erste.link, "Abgewiesene Zugriffe ändern den Link nicht");

    const zweiter = await prisma.user.create({ data: { email: `${prefix}-zweiter@example.test`, role: "ADMIN" } });
    const alt = await erzeugeZugangstoken(zweiter.id, "EINLADUNG");
    assert.equal((await einladung(zweiter)).status, "NICHT_ANZEIGBAR");
    assert.ok(await pruefeZugangstoken(alt.token), "Alte Hash-only-Links bleiben gültig");
    assert.equal((await prisma.zugangstoken.findFirstOrThrow({ where: { userId: zweiter.id } })).tokenVerschluesselt, null);
    assert.equal((await erzeugeBdbZugangslink(zweiter.id)).erfolg, true);
    assert.equal(await pruefeZugangstoken(alt.token), null);
    assert.notEqual((await einladung(zweiter)).link, erste.link);
    assert.equal((await einladung(bdb)).link, erste.link, "Links gehören genau zu einem Konto");

    assert.equal((await erzeugeBdbZugangslink(bdb.id)).erfolg, true);
    const neu = await einladung(bdb);
    assert.notEqual(neu.link, erste.link);
    assert.equal(neu.zweck, "EINLADUNG");
    assert.equal(await pruefeZugangstoken(token), null);
    assert.ok(await verbraucheTokenUndSetzePasswort(tokenAus(neu.link), "test-passwort-hash"));
    assert.equal(await verbraucheTokenUndSetzePasswort(tokenAus(neu.link), "zweiter-hash"), null);
    assert.equal((await einladung(bdb)).status, "VERWENDET");
    assert.equal((await einladung(bdb)).link, null);
    assert.equal((await prisma.zugangstoken.findFirstOrThrow({ where: { userId: bdb.id, usedAt: { not: null } } })).tokenVerschluesselt, null);
    await erzeugeBdbZugangslink(bdb.id);
    assert.equal((await einladung(bdb)).zweck, "PASSWORT_RESET");
    const reset = await einladung(bdb);
    await prisma.zugangstoken.updateMany({ where: { userId: bdb.id, usedAt: null }, data: { expiresAt: new Date(0) } });
    assert.equal((await einladung(bdb)).status, "ABGELAUFEN");
    assert.equal((await einladung(bdb)).link, null);
    assert.equal(await pruefeZugangstoken(tokenAus(reset.link)), null);
    await erzeugeBdbZugangslink(bdb.id);
    await prisma.user.update({ where: { id: bdb.id }, data: { isActive: false } });
    assert.equal((await einladung(bdb)).status, "DEAKTIVIERT");
    assert.equal((await einladung(bdb)).link, null);
    assert.ok((await erzeugeBdbZugangslink(bdb.id)).fehler?._);

    const parallel = await Promise.all([erzeugeZugangstoken(zweiter.id, "EINLADUNG", { wiederAnzeigen: true }), erzeugeZugangstoken(zweiter.id, "EINLADUNG", { wiederAnzeigen: true })]);
    assert.equal(await prisma.zugangstoken.count({ where: { userId: zweiter.id, usedAt: null } }), 1);
    assert.equal((await Promise.all(parallel.map((x) => pruefeZugangstoken(x.token)))).filter(Boolean).length, 1);
    const dto = (await ladeBdbsMitEinladung()).find((x) => x.id === zweiter.id);
    assert.equal(dto.zugangstoken, undefined);
    assert.equal(dto.tokenVerschluesselt, undefined);
    console.log("BdB-Einladungen: dauerhafte Anzeige, Kontobindung, Rollen, Altlinks, Ersetzen, Einlösen, Ablauf und parallele Erzeugung bestanden.");
  } finally {
    await prisma.auditLog.deleteMany({ where: { user: { email: { startsWith: prefix } } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: prefix } } });
    await prisma.bezirk.deleteMany({ where: { name: prefix } });
    await prisma.$disconnect();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
