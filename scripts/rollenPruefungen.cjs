/* eslint-disable @typescript-eslint/no-require-imports -- Isolierter Next-Kontext für den Rollenwechsel mit echter Testdatenbank. */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
if (!process.env.DATABASE_URL?.startsWith("postgresql://bezirketest@127.0.0.1:54329/fortbildungen_test")) {
  throw new Error("Nur die isolierte Rollen-Testdatenbank ist zulässig.");
}
process.env.JWT_SECRET ||= "rollen-test-geheimnis-mit-mindestens-zweiunddreissig-zeichen";
const cookies = new Map();
const original = Module._load;
Module._load = function (name, ...args) {
  if (name === "server-only") return {};
  if (name === "next/headers") return {
    cookies: async () => ({ get: (k) => cookies.has(k) ? { value: cookies.get(k) } : undefined, set: (k, v) => cookies.set(k, v), delete: (k) => cookies.delete(k) }),
    headers: async () => new Headers(),
  };
  if (name === "next/cache") return { revalidatePath() {} };
  return original.call(this, name, ...args);
};
require("tsx/cjs");
const { prisma } = require("../src/lib/prisma");
const { getSessionUser, setSessionCookie, signToken, requireRole } = require("../src/lib/auth");
const { fortbildungBezirksScope, bezirkScope, referentScope } = require("../src/lib/berechtigungsScope");
const { istPrivilegierteRolle } = require("../src/lib/mfa");
const { RolleSchema } = require("../src/lib/validation/rolle");
const { ROLLEN } = require("../src/constants/fortbildung");
const { ladeBdbsMitEinladung } = require("../src/lib/bdbVerwaltung");
const { speichereBdb } = require("../src/actions/bezirke");
const migration = readFileSync(path.join(__dirname, "../prisma/migrations/20260930160000_redaktion_zu_bdb/migration.sql"), "utf8");
const prefix = `rollen-test-${Date.now()}`;
const userIds = [];
const bezirkIds = [];
const anmelden = async (konto, mfa = true) => setSessionCookie(await signToken(konto.id, konto.sessionVersion, mfa));
const laden = (id) => prisma.user.findUniqueOrThrow({ where: { id }, include: { bezirke: { orderBy: { id: "asc" } } } });

(async () => {
  try {
    assert.deepEqual(ROLLEN.map((r) => r.value), ["RVS", "ADMIN", "REFERENT"]);
    for (const rolle of ["RVS", "ADMIN", "REFERENT"]) assert.ok(RolleSchema.safeParse(rolle).success);
    assert.equal(RolleSchema.safeParse("REDAKTEUR").success, false);
    assert.equal(RolleSchema.safeParse("UNBEKANNT").success, false);
    for (const name of ["A", "B"]) {
      bezirkIds.push((await prisma.bezirk.create({ data: { name: `${prefix}-${name}` } })).id);
    }
    const erstellen = async (name, role, extra = {}) => {
      const konto = await prisma.user.create({ data: {
        email: `${prefix}-${name}@test.invalid`, name, role, sessionVersion: 7,
        mfaAktiviertAm: new Date("2026-09-01T12:00:00Z"),
        mfaSecretVerschluesselt: "verschluesselter-testwert",
        mfaWiederherstellungscodeHashes: ["testhash"],
        bezirke: { connect: bezirkIds.map((id) => ({ id })) }, ...extra,
      } });
      userIds.push(konto.id);
      return laden(konto.id);
    };
    const alt = await erstellen("redaktion", "REDAKTEUR");
    const inaktiv = await erstellen("inaktiv", "REDAKTEUR", { isActive: false });
    const ohneMfa = await erstellen("ohne-mfa", "REDAKTEUR", { mfaAktiviertAm: null, mfaSecretVerschluesselt: null });
    const rvs = await erstellen("regierung", "RVS");
    const admin = await erstellen("bdb", "ADMIN");
    const referent = await erstellen("referent", "REFERENT", { mfaAktiviertAm: null, mfaSecretVerschluesselt: null });
    await prisma.referent.create({ data: { vorname: "Test", nachname: "Referent", userId: referent.id, bezirke: { connect: [{ id: bezirkIds[0] }] } } });

    await anmelden(alt);
    assert.equal(await getSessionUser(), null, "Die entfernte Rolle erhält keine Sitzung ohne MFA-Prüfung");
    const ungueltig = { id: alt.id, role: "REDAKTEUR", bezirkIds, referentId: null };
    for (const scope of [fortbildungBezirksScope, bezirkScope, referentScope]) {
      assert.deepEqual(scope(ungueltig), { id: { in: [] } });
    }

    await prisma.$executeRawUnsafe(migration);
    assert.equal(await getSessionUser(), null, "Die Migration entwertet die alte Sitzung");
    for (const vorher of [alt, inaktiv, ohneMfa]) {
      const nachher = await laden(vorher.id);
      assert.deepEqual({ ...nachher, role: vorher.role, sessionVersion: vorher.sessionVersion, updatedAt: vorher.updatedAt }, vorher,
        "Alle Kontodaten einschließlich Bezirken, Kontostatus und MFA bleiben erhalten");
      assert.equal(nachher.role, "ADMIN");
      assert.equal(nachher.sessionVersion, vorher.sessionVersion + 1);
    }
    for (const konto of [rvs, admin, referent]) assert.deepEqual(await laden(konto.id), konto, "Bestehende Rollen bleiben unverändert");
    await prisma.$executeRawUnsafe(migration);
    assert.equal((await laden(alt.id)).sessionVersion, 8, "Die Migration ist wiederholbar");

    const bdb = await laden(alt.id);
    await anmelden(bdb, false);
    assert.equal(await getSessionUser(), null, "Umgestellte BdBs brauchen weiterhin MFA");
    await anmelden(bdb);
    const sitzung = await requireRole("ADMIN");
    assert.deepEqual([...sitzung.bezirkIds].sort(), [...bezirkIds].sort());
    assert.deepEqual(fortbildungBezirksScope(sitzung), { bezirkId: { in: sitzung.bezirkIds } });
    await assert.rejects(requireRole("RVS"), "Die Umstellung verleiht keine Regierungsrechte");
    await anmelden(await laden(inaktiv.id));
    assert.equal(await getSessionUser(), null, "Deaktivierte Konten bleiben gesperrt");
    await anmelden(await laden(ohneMfa.id), false);
    assert.equal(await getSessionUser(), null);
    assert.equal((await getSessionUser({ mfaEinrichtungErlauben: true })).mfaEinrichtungErforderlich, true);

    await anmelden(referent, false);
    assert.equal((await getSessionUser()).role, "REFERENT", "Referenten bleiben ohne MFA zugänglich");
    assert.equal(istPrivilegierteRolle("REFERENT"), false);
    assert.equal(istPrivilegierteRolle("ADMIN"), true);
    assert.equal(istPrivilegierteRolle("RVS"), true);
    await assert.rejects(requireRole("ADMIN"));

    await anmelden(rvs);
    assert.ok((await ladeBdbsMitEinladung()).some((konto) => konto.id === alt.id));
    const formular = new FormData();
    formular.set("email", referent.email); formular.set("name", "Referent unverändert"); formular.set("aktiv", "on"); formular.append("bezirkIds", bezirkIds[0]);
    assert.ok((await speichereBdb(referent.id, {}, formular)).fehler?._);
    assert.deepEqual(await laden(referent.id), referent, "BdB-Verwaltung verändert keine Referentenkonten");
    console.log("Rollen: Migration, Bezirke, MFA, Sitzungswiderruf, deaktivierte Konten und unveränderte Referenten geprüft.");
  } finally {
    await prisma.auditLog.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.referent.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.bezirk.deleteMany({ where: { id: { in: bezirkIds } } });
    await prisma.$disconnect();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
