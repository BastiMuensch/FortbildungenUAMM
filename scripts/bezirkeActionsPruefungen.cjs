/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS-Ladehook isoliert ausschließlich Next.js Request-/Cache-Kontext. */
/* Datenbanktest, ausschließlich gegen die von Codex bereitgestellte Test-DB. */
const assert = require("node:assert/strict");
const Module = require("node:module");
if (!process.env.DATABASE_URL?.startsWith("postgresql://bezirketest@127.0.0.1:54329/")) {
  throw new Error("Dieser Test darf nur mit der isolierten bezirketest-Datenbank laufen.");
}
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-geheimnis-mit-mindestens-zweiunddreissig-zeichen";
const cookie = new Map();
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "server-only") return {};
  if (request === "next/headers") return {
    cookies: async () => ({ get: (k) => cookie.has(k) ? { value: cookie.get(k) } : undefined, set: (k, v) => cookie.set(k, v), delete: (k) => cookie.delete(k) }),
    headers: async () => new Headers({ "x-forwarded-for": "127.0.0.1" }),
  };
  if (request === "next/cache") return { revalidatePath() {} };
  if (request === "next/navigation") return { redirect: (url) => { const e = new Error(url); e.digest = "NEXT_REDIRECT"; throw e; } };
  return originalLoad.call(this, request, parent, isMain);
};
require("tsx/cjs");

const { prisma } = require("../src/lib/prisma");
const { signToken, setSessionCookie, clearSessionCookie } = require("../src/lib/auth");
const { generiereReferentenRegistrierungslink, registriereReferent, fuegeBezirkAusRegistrierungslinkHinzu } = require("../src/actions/referentenRegistrierung");
const { saveFortbildung, duplizieren, loeschen: loescheFortbildung } = require("../src/actions/fortbildung");
const { freigeben, zurueckweisen, fibsStatusSetzen } = require("../src/actions/freigabe");
const { meldeTeilnehmerzahl, setzeSchilfFibsNachtrag, setzeTeilnahmebestaetigungsVersand } = require("../src/actions/nachbereitung");
const { speichereReferent, entferneReferent } = require("../src/actions/stammdaten");
const { zugangEntziehen } = require("../src/actions/zugang");
const prefix = `bezirketest-${Date.now()}`;
const form = (o) => { const f = new FormData(); Object.entries(o).forEach(([k, v]) => f.set(k, String(v))); return f; };
const anmelden = async (u) => setSessionCookie(await signToken(u.id, u.sessionVersion));
const tokenAus = (link) => new URL(link).searchParams.get("token");
const redirectErwartet = async (p) => { try { await p; assert.fail("Redirect erwartet"); } catch (e) { assert.equal(e.digest, "NEXT_REDIRECT"); } };

(async () => {
  const loeschen = async () => {
    await prisma.referentenRegistrierungslink.deleteMany({ where: { erstelltVon: { email: { startsWith: prefix } } } });
    await prisma.fortbildung.deleteMany({ where: { titel: { startsWith: prefix } } });
    await prisma.veranstaltungsort.deleteMany({ where: { name: { startsWith: prefix } } });
    await prisma.referent.deleteMany({ where: { OR: [{ email: { startsWith: prefix } }, { user: { email: { startsWith: prefix } } }] } });
    await prisma.user.deleteMany({ where: { email: { startsWith: prefix } } });
    await prisma.bezirk.deleteMany({ where: { name: { startsWith: prefix } } });
  };
  await loeschen();
  try {
    const [a, b] = await Promise.all([prisma.bezirk.create({ data: { name: `${prefix}-A` } }), prisma.bezirk.create({ data: { name: `${prefix}-B` } })]);
    const rvs = await prisma.user.create({ data: { email: `${prefix}-rvs@test`, role: "RVS" } });
    const adminA = await prisma.user.create({ data: { email: `${prefix}-a@test`, role: "ADMIN", bezirke: { connect: { id: a.id } } } });
    const adminB = await prisma.user.create({ data: { email: `${prefix}-b@test`, role: "ADMIN", bezirke: { connect: { id: b.id } } } });
    const ref = await prisma.user.create({ data: { email: `${prefix}-ref@test`, role: "REFERENT", referent: { create: { vorname: "Ref", nachname: "A", bezirke: { connect: { id: a.id } } } } } });
    await anmelden(adminA);
    const fremd = await generiereReferentenRegistrierungslink({}, form({ bezirkId: b.id, maxNutzungen: 1 }));
    assert.ok(fremd.fehler?.bezirkId);
    const linkA = await generiereReferentenRegistrierungslink({}, form({ bezirkId: a.id, maxNutzungen: 2 }));
    assert.ok(linkA.link);
    await clearSessionCookie();
    const registrierung = registriereReferent({}, form({ vorname: "Neu", nachname: "Neu", email: `${prefix}-neu@example.test`, passwort: "sehr-sicheres-passwort", wiederholung: "sehr-sicheres-passwort", token: tokenAus(linkA.link), bezirkId: b.id }));
    try { await redirectErwartet(registrierung); } catch (error) { console.error(await registrierung); throw error; }
    const neu = await prisma.user.findUniqueOrThrow({ where: { email: `${prefix}-neu@example.test` }, include: { referent: { include: { bezirke: true } } } });
    assert.deepEqual(neu.referent.bezirke.map((x) => x.id), [a.id]);
    await anmelden(adminB);
    const linkB = await generiereReferentenRegistrierungslink({}, form({ bezirkId: b.id, maxNutzungen: 1 }));
    await anmelden(await prisma.user.findUniqueOrThrow({ where: { id: ref.id } }));
    assert.equal((await fuegeBezirkAusRegistrierungslinkHinzu({}, form({ token: tokenAus(linkB.link) }))).erfolg, true);
    assert.ok((await fuegeBezirkAusRegistrierungslinkHinzu({}, form({ token: tokenAus(linkB.link) }))).fehler?._);
    const used = await prisma.referentenRegistrierungslink.findFirstOrThrow({ where: { erstelltVonId: adminB.id } });
    assert.equal(used.nutzungen, 1);
    await anmelden(adminA);
    await assert.rejects(() => zugangEntziehen(ref.id));
    const ort = await prisma.veranstaltungsort.create({ data: { name: `${prefix}-Online`, istOnline: true } });
    const ausschreibung = (bezirkId, referentId) => form({
      bezirkId, titel: `${prefix}-Fortbildung`, beschreibungHtml: "<p>Testfortbildung</p>",
      organisationsform: "SCHILF", maxTn: 20, format: "ESESSION", beginn: "15.09.2026 10:00", ende: "15.09.2026 12:00",
      veranstaltungsortId: ort.id, schularten: "GRUNDSCHULE", status: "ENTWURF", referenten: referentId,
    });
    await anmelden(neu);
    assert.ok((await saveFortbildung(null, {}, ausschreibung(b.id, neu.referent.id))).fehler?.bezirkId);
    await redirectErwartet(saveFortbildung(null, {}, ausschreibung(a.id, neu.referent.id)));
    const eventA = await prisma.fortbildung.findFirstOrThrow({ where: { titel: `${prefix}-Fortbildung`, bezirkId: a.id } });
    const refB = await prisma.referent.create({ data: { vorname: "Fremd", nachname: "B", email: `${prefix}-fremd@test`, bezirke: { connect: { id: b.id } } } });
    assert.ok((await saveFortbildung(eventA.id, {}, ausschreibung(a.id, refB.id))).fehler?.referenten);
    await anmelden(adminB);
    assert.ok((await saveFortbildung(eventA.id, {}, ausschreibung(b.id, refB.id))).fehler?._);
    assert.equal(await duplizieren(eventA.id), undefined);
    await assert.rejects(() => loescheFortbildung(eventA.id));
    await prisma.fortbildung.update({ where: { id: eventA.id }, data: { status: "EINGEREICHT" } });
    await freigeben(eventA.id);
    assert.ok((await zurueckweisen(eventA.id, {}, form({notiz:"Fremder Zugriff"}))).fehler?._);
    assert.equal((await prisma.fortbildung.findUniqueOrThrow({ where: { id: eventA.id } })).status, "EINGEREICHT");
    await prisma.fortbildung.update({ where: { id: eventA.id }, data: { status: "VEROEFFENTLICHT" } });
    await fibsStatusSetzen(eventA.id, true);
    await setzeSchilfFibsNachtrag(eventA.id, true);
    await setzeTeilnahmebestaetigungsVersand(eventA.id, "REFERENTEN", true);
    assert.ok((await meldeTeilnehmerzahl(eventA.id, {}, form({tnTatsaechlich:10}))).fehler?._);
    const unveraendert = await prisma.fortbildung.findUniqueOrThrow({where:{id:eventA.id}});
    assert.equal(unveraendert.inFibs, false);
    assert.equal(unveraendert.tnTatsaechlich, null);
    assert.equal(unveraendert.teilnahmebestaetigungenReferentenVersandtAm, null);
    await anmelden(rvs);
    assert.equal((await meldeTeilnehmerzahl(eventA.id, {}, form({tnTatsaechlich:10}))).erfolg, true);
    await anmelden(adminA);
    await setzeSchilfFibsNachtrag(eventA.id, true);
    assert.equal((await prisma.fortbildung.findUniqueOrThrow({where:{id:eventA.id}})).inFibs, true);
    const geteilterRef = await prisma.referent.findUniqueOrThrow({where:{userId:ref.id}});
    const kontaktdaten = form({vorname:"Gemeinsam",nachname:"Referent",bezirkId:a.id});
    assert.equal((await speichereReferent(geteilterRef.id, {}, kontaktdaten)).erfolg, true);
    assert.deepEqual((await prisma.referent.findUniqueOrThrow({where:{id:geteilterRef.id},include:{bezirke:true}})).bezirke.map(x=>x.id).sort(), [a.id,b.id].sort());
    kontaktdaten.set("bezirkId",b.id);
    kontaktdaten.set("vorname","Verboten");
    assert.ok((await speichereReferent(geteilterRef.id, {}, kontaktdaten)).fehler?._);
    assert.equal((await prisma.referent.findUniqueOrThrow({where:{id:geteilterRef.id}})).vorname,"Gemeinsam");
    await entferneReferent(geteilterRef.id);
    assert.deepEqual((await prisma.referent.findUniqueOrThrow({where:{id:geteilterRef.id},include:{bezirke:true}})).bezirke.map(x=>x.id), [b.id]);
    await Promise.all([generiereReferentenRegistrierungslink({},form({bezirkId:a.id,maxNutzungen:2})),generiereReferentenRegistrierungslink({},form({bezirkId:a.id,maxNutzungen:2}))]);
    assert.equal(await prisma.referentenRegistrierungslink.count({where:{bezirkId:a.id,aktiv:true}}),1);
    await anmelden(adminB);
    const testLink = await generiereReferentenRegistrierungslink({},form({bezirkId:b.id,maxNutzungen:3}));
    await prisma.bezirk.update({where:{id:b.id},data:{aktiv:false}});
    await anmelden(neu);
    assert.ok((await fuegeBezirkAusRegistrierungslinkHinzu({},form({token:tokenAus(testLink.link)}))).fehler?._);
    await prisma.bezirk.update({where:{id:b.id},data:{aktiv:true}});
    await prisma.referentenRegistrierungslink.updateMany({where:{bezirkId:b.id,aktiv:true},data:{expiresAt:new Date(0)}});
    assert.ok((await fuegeBezirkAusRegistrierungslinkHinzu({},form({token:tokenAus(testLink.link)}))).fehler?._);
    console.log("Bezirks-Actions: Registrierung, Bezirksbindung, Fortbildungen, Freigabe und Nachbereitung bestanden.");
  } finally { await loeschen(); await prisma.$disconnect(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
