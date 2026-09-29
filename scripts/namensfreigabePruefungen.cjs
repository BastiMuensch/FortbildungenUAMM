/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS-Ladehook isoliert ausschließlich Next.js Request-/Cache-Kontext. */
/* Datenbanktest, ausschließlich gegen die von Codex bereitgestellte Test-DB. */
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
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
const { NextRequest } = require("next/server");
const { clearSessionCookie, setSessionCookie, signToken } = require("../src/lib/auth");
const { speichereReferent } = require("../src/actions/stammdaten");
const { generiereReferentenRegistrierungslink, registriereReferent } = require("../src/actions/referentenRegistrierung");
const { speichereNamensfreigabe, stoppeNamensfreigabe } = require("../src/actions/namensfreigabe");
const { NAMENSFREIGABE_TEXT, NAMENSFREIGABE_VERSION } = require("../src/constants/fortbildung");
const { oeffentlicherReferentSelect, oeffentlicherReferentWhere } = require("../src/lib/namensfreigabe");
const { organisationsKennzeichnungen } = require("../src/lib/namensfreigabe");
const { oeffentlicheFortbildungSelect, oeffentlicheFortbildungWhere } = require("../src/lib/queries");
const ics = require("../src/app/api/ics/route");
const aushang = require("../src/app/api/admin/fortbildungen/[id]/aushang/route");

const prefix = `namensfreigabe-test-${Date.now()}`;
const form = (werte) => {
  const daten = new FormData();
  Object.entries(werte).forEach(([schluessel, wert]) => daten.set(schluessel, String(wert)));
  return daten;
};
const zustimmung = (stand, zusaetzlich = {}) => form({
  namensfreigabe: "on",
  namensfreigabeVersion: NAMENSFREIGABE_VERSION,
  namensfreigabeStand: stand,
  ...zusaetzlich,
});
const widerruf = (stand) => form({ namensfreigabeStand: stand });
const anmelden = async (user) => setSessionCookie(await signToken(user.id, user.sessionVersion));
const fehlgeschlagen = (ergebnis) => assert.ok(ergebnis?.fehler?._ || ergebnis?.fehler?.namensfreigabe);
const tokenAus = (link) => new URL(link).searchParams.get("token");
const redirectErwartet = async (versprechen) => {
  let ergebnis;
  let fehler;
  try {
    ergebnis = await versprechen;
  } catch (gefangen) {
    fehler = gefangen;
  }
  assert.ok(fehler, `Redirect erwartet; Aktion gab zurück: ${JSON.stringify(ergebnis)}`);
  assert.equal(fehler.digest, "NEXT_REDIRECT");
};
const registrierungsformular = (email, token, mitZustimmung) => form({
  vorname: "Registriert",
  nachname: mitZustimmung ? "Mit" : "Ohne",
  email,
  passwort: "ein-sicheres-test-passwort",
  wiederholung: "ein-sicheres-test-passwort",
  token,
  ...(mitZustimmung ? { namensfreigabe: "on", namensfreigabeVersion: NAMENSFREIGABE_VERSION } : {}),
});
const anfrage = (pfad) => new NextRequest(`http://localhost${pfad}`);
const puffer = async (antwort) => Buffer.from(await antwort.arrayBuffer());
const pdfText = (daten) => execFileSync(process.env.PDF_PYTHON || "python3", ["-c", "import sys,io,pdfplumber; doc=pdfplumber.open(io.BytesIO(sys.stdin.buffer.read())); print('\\n'.join(p.extract_text() or '' for p in doc.pages))"], { input: daten, encoding: "utf8", timeout: 15000 }).replace(/\s+/g, " ");

(async () => {
  const loeschen = async () => {
    await prisma.auditLog.deleteMany({ where: { user: { email: { startsWith: prefix } } } });
    await prisma.referentenRegistrierungslink.deleteMany({
      where: { OR: [{ erstelltVon: { email: { startsWith: prefix } } }, { bezirk: { name: { startsWith: prefix } } }] },
    });
    await prisma.fortbildung.deleteMany({ where: { titel: { startsWith: prefix } } });
    await prisma.veranstaltungsort.deleteMany({ where: { name: { startsWith: prefix } } });
    await prisma.namensfreigabeNachweis.deleteMany({
      where: { referent: { OR: [{ email: { startsWith: prefix } }, { user: { email: { startsWith: prefix } } }] } },
    });
    await prisma.referent.deleteMany({
      where: { OR: [{ email: { startsWith: prefix } }, { user: { email: { startsWith: prefix } } }] },
    });
    await prisma.user.deleteMany({ where: { email: { startsWith: prefix } } });
    await prisma.bezirk.deleteMany({ where: { name: { startsWith: prefix } } });
  };

  await loeschen();
  try {
    const [bezirkA, bezirkB] = await Promise.all([
      prisma.bezirk.create({ data: { name: `${prefix}-A` } }),
      prisma.bezirk.create({ data: { name: `${prefix}-B` } }),
    ]);
    const adminA = await prisma.user.create({
      data: { email: `${prefix}-admin-a@test`, role: "ADMIN", mfaAktiviertAm: new Date(), bezirke: { connect: { id: bezirkA.id } } },
    });
    const referentAUser = await prisma.user.create({
      data: {
        email: `${prefix}-referent-a@test`, role: "REFERENT",
        referent: { create: { vorname: "Eigen", nachname: "A", organisation: "Interne Organisation A", email: `${prefix}-intern-a@example.test`, notiz: "Interne Organisationsnotiz A", bezirke: { connect: { id: bezirkA.id } } } },
      },
      include: { referent: true },
    });
    const referentBUser = await prisma.user.create({
      data: {
        email: `${prefix}-referent-b@test`, role: "REFERENT",
        referent: { create: { vorname: "Fremd", nachname: "B", email: `${prefix}-intern-b@test`, bezirke: { connect: { id: bezirkB.id } } } },
      },
      include: { referent: true },
    });
    const kontoOhneReferent = await prisma.user.create({ data: { email: `${prefix}-ohne-referent@test`, role: "REFERENT" } });
    const inaktiverReferent = await prisma.user.create({
      data: {
        email: `${prefix}-inaktiv@test`, role: "REFERENT",
        referent: { create: { vorname: "Inaktiv", nachname: "Test", aktiv: false, bezirke: { connect: { id: bezirkA.id } } } },
      },
    });
    const nurIntern = await prisma.referent.create({
      data: { vorname: "Nur", nachname: "Intern", email: `${prefix}-nur-intern@example.test`, bezirke: { connect: { id: bezirkA.id } } },
    });
    const ort = await prisma.veranstaltungsort.create({ data: { name: `${prefix}-Online`, istOnline: true } });
    const fortbildung = await prisma.fortbildung.create({
      data: {
        slug: `${prefix}-oeffentlich`, titel: `${prefix}-Öffentliche Ausgabe`,
        beschreibungHtml: "<p>Öffentliche Testveranstaltung</p>", beschreibungText: "Öffentliche Testveranstaltung",
        organisationsform: "SCHILF", maxTn: 20, format: "ESESSION",
        beginn: new Date("2099-09-15T08:00:00Z"), ende: new Date("2099-09-15T10:00:00Z"),
        veranstaltungsortId: ort.id, schularten: ["GRUNDSCHULE"], status: "VEROEFFENTLICHT", bezirkId: bezirkA.id,
        referenten: { create: { referentId: referentAUser.referent.id } },
      },
    });
    const kennzeichnungen = organisationsKennzeichnungen(bezirkA.name);
    const oeffentlicheAusgabe = async () => prisma.fortbildung.findFirstOrThrow({
      where: { AND: [{ id: fortbildung.id }, oeffentlicheFortbildungWhere()] }, select: oeffentlicheFortbildungSelect,
    });
    const icsText = async () => {
      const antwort = await ics.GET(anfrage(`/api/ics?slug=${encodeURIComponent(fortbildung.slug)}`));
      assert.equal(antwort.status, 200);
      return await antwort.text();
    };
    const aushangText = async () => {
      await anmelden(adminA);
      const antwort = await aushang.GET(anfrage(`/api/admin/fortbildungen/${fortbildung.id}/aushang`), { params: Promise.resolve({ id: fortbildung.id }) });
      assert.equal(antwort.status, 200);
      return pdfText(await puffer(antwort));
    };
    const entfalteterText = (text) => text.replace(/\r?\n[ \t]/g, "");
    const pruefeKennzeichnungen = (text) => kennzeichnungen.forEach((kennzeichnung) => assert.ok(entfalteterText(text).includes(kennzeichnung), `${kennzeichnung} fehlt.`));
    const pruefeOhneKontaktdaten = (text) => {
      for (const geheimnis of ["Interne Organisation A", `${prefix}-intern-a@example.test`, "Interne Organisationsnotiz A"]) assert.equal(entfalteterText(text).includes(geheimnis), false, `${geheimnis} wurde öffentlich ausgegeben.`);
    };

    await anmelden(adminA);
    const registrierungslink = await generiereReferentenRegistrierungslink({}, form({ bezirkId: bezirkA.id, maxNutzungen: 2 }));
    assert.ok(registrierungslink.link);
    const registrierungsToken = tokenAus(registrierungslink.link);
    assert.ok(registrierungsToken);
    await clearSessionCookie();
    await redirectErwartet(registriereReferent({}, registrierungsformular(`${prefix}-registriert-ohne@example.test`, registrierungsToken, false)));
    const registriertOhne = await prisma.user.findUniqueOrThrow({
      where: { email: `${prefix}-registriert-ohne@example.test` }, include: { referent: true },
    });
    assert.equal(registriertOhne.referent.oeffentlichSichtbar, false);
    assert.equal(registriertOhne.referent.oeffentlicheEinwilligungVersion, null);
    assert.equal(registriertOhne.referent.oeffentlicheEinwilligungAm, null);
    assert.equal(registriertOhne.referent.namensfreigabeStand, 0);
    assert.equal(await prisma.namensfreigabeNachweis.count({ where: { referentId: registriertOhne.referent.id } }), 0);
    await redirectErwartet(registriereReferent({}, registrierungsformular(`${prefix}-registriert-mit@example.test`, registrierungsToken, true)));
    const registriertMit = await prisma.user.findUniqueOrThrow({
      where: { email: `${prefix}-registriert-mit@example.test` }, include: { referent: true },
    });
    assert.equal(registriertMit.referent.oeffentlichSichtbar, true);
    assert.equal(registriertMit.referent.oeffentlicheEinwilligungVersion, NAMENSFREIGABE_VERSION);
    assert.ok(registriertMit.referent.oeffentlicheEinwilligungAm instanceof Date);
    assert.equal(registriertMit.referent.namensfreigabeStand, 1);
    const registrierungsNachweis = await prisma.namensfreigabeNachweis.findFirstOrThrow({ where: { referentId: registriertMit.referent.id } });
    assert.equal(registrierungsNachweis.entscheidung, "ERTEILT");
    assert.equal(registrierungsNachweis.handelnderUserId, registriertMit.id);
    assert.equal(registrierungsNachweis.version, NAMENSFREIGABE_VERSION);
    assert.equal(registrierungsNachweis.erklaerung, NAMENSFREIGABE_TEXT);

    await clearSessionCookie();
    fehlgeschlagen(await speichereNamensfreigabe({}, zustimmung(0)));

    await anmelden(kontoOhneReferent);
    fehlgeschlagen(await speichereNamensfreigabe({}, zustimmung(0)));
    await anmelden(inaktiverReferent);
    fehlgeschlagen(await speichereNamensfreigabe({}, zustimmung(0)));

    const vorZustimmung = await oeffentlicheAusgabe();
    assert.deepEqual(vorZustimmung.referenten, []);
    const icsVorZustimmung = await icsText();
    const aushangVorZustimmung = await aushangText();
    for (const text of [icsVorZustimmung, aushangVorZustimmung]) {
      assert.equal(text.includes("Eigen A"), false);
      pruefeKennzeichnungen(text);
      pruefeOhneKontaktdaten(text);
    }

    await anmelden(referentAUser);
    const erteilt = await speichereNamensfreigabe({}, zustimmung(0, { referentId: referentBUser.referent.id }));
    assert.equal(erteilt.erfolg, true);
    const eigeneFreigabe = await prisma.referent.findUniqueOrThrow({ where: { id: referentAUser.referent.id } });
    const fremdeFreigabe = await prisma.referent.findUniqueOrThrow({ where: { id: referentBUser.referent.id } });
    assert.equal(eigeneFreigabe.oeffentlichSichtbar, true);
    assert.equal(eigeneFreigabe.oeffentlicheEinwilligungVersion, NAMENSFREIGABE_VERSION);
    assert.ok(eigeneFreigabe.oeffentlicheEinwilligungAm instanceof Date);
    assert.equal(eigeneFreigabe.namensfreigabeStand, 1);
    assert.equal(fremdeFreigabe.oeffentlichSichtbar, false);
    const nachweis = await prisma.namensfreigabeNachweis.findFirstOrThrow({ where: { referentId: eigeneFreigabe.id }, orderBy: { zeitpunkt: "desc" } });
    assert.equal(nachweis.handelnderUserId, referentAUser.id);
    assert.equal(nachweis.entscheidung, "ERTEILT");
    assert.equal(nachweis.version, NAMENSFREIGABE_VERSION);
    assert.equal(nachweis.erklaerung, NAMENSFREIGABE_TEXT);
    const mitZustimmung = await oeffentlicheAusgabe();
    assert.deepEqual(mitZustimmung.referenten, [{ referent: { vorname: "Eigen", nachname: "A" } }]);
    assert.equal(Object.hasOwn(mitZustimmung.referenten[0].referent, "organisation"), false);
    assert.equal(Object.hasOwn(mitZustimmung.referenten[0].referent, "email"), false);
    assert.equal(Object.hasOwn(mitZustimmung.referenten[0].referent, "notiz"), false);
    const icsMitZustimmung = await icsText();
    const aushangMitZustimmung = await aushangText();
    for (const text of [icsMitZustimmung, aushangMitZustimmung]) {
      assert.ok(text.includes("Eigen A"));
      pruefeKennzeichnungen(text);
      pruefeOhneKontaktdaten(text);
    }
    await anmelden(referentAUser);

    const veralteteVersion = await speichereNamensfreigabe({}, form({ namensfreigabe: "on", namensfreigabeVersion: "veraltet", namensfreigabeStand: 1 }));
    fehlgeschlagen(veralteteVersion);
    assert.equal((await prisma.referent.findUniqueOrThrow({ where: { id: eigeneFreigabe.id } })).namensfreigabeStand, 1);

    // Ein Widerruf darf auch von einer alten, noch geöffneten Seite wirksam werden.
    const widerrufen = await speichereNamensfreigabe({}, widerruf(0));
    assert.equal(widerrufen.erfolg, true);
    const nachWiderruf = await prisma.referent.findUniqueOrThrow({ where: { id: eigeneFreigabe.id } });
    assert.equal(nachWiderruf.oeffentlichSichtbar, false);
    assert.equal(nachWiderruf.namensfreigabeStand, 2);
    const nachWiderrufOeffentlich = await oeffentlicheAusgabe();
    assert.deepEqual(nachWiderrufOeffentlich.referenten, []);
    const icsNachWiderruf = await icsText();
    const aushangNachWiderruf = await aushangText();
    for (const text of [icsNachWiderruf, aushangNachWiderruf]) {
      assert.equal(text.includes("Eigen A"), false);
      pruefeKennzeichnungen(text);
      pruefeOhneKontaktdaten(text);
    }
    await anmelden(referentAUser);
    fehlgeschlagen(await speichereNamensfreigabe({}, zustimmung(1)));
    const nachStaleGrant = await prisma.referent.findUniqueOrThrow({ where: { id: eigeneFreigabe.id } });
    assert.equal(nachStaleGrant.oeffentlichSichtbar, false);
    assert.equal(nachStaleGrant.namensfreigabeStand, 2);

    await anmelden(adminA);
    const gefaelschteStammdaten = form({
      vorname: nurIntern.vorname, nachname: nurIntern.nachname, email: nurIntern.email,
      // Ein altes Formular darf das entfernte Feld nicht erneut speichern.
      telefon: "veraltetes-telefonfeld", bezirkId: bezirkA.id, oeffentlichSichtbar: "on",
    });
    const stammdatenErgebnis = await speichereReferent(nurIntern.id, {}, gefaelschteStammdaten);
    assert.equal(stammdatenErgebnis.erfolg, true);
    const nachStammdaten = await prisma.referent.findUniqueOrThrow({ where: { id: nurIntern.id } });
    assert.equal(nachStammdaten.oeffentlichSichtbar, false);
    assert.equal(nachStammdaten.oeffentlicheEinwilligungVersion, null);
    assert.equal(Object.hasOwn(nachStammdaten, "telefon"), false);
    assert.equal(nachStammdaten.notiz, null);

    await anmelden(referentAUser);
    assert.equal((await speichereNamensfreigabe({}, zustimmung(2))).erfolg, true);
    await anmelden(adminA);
    const namensAenderung = await speichereReferent(referentAUser.referent.id, {}, form({
      vorname: "EigenNeu", nachname: "A", email: `${prefix}-intern-a@example.test`, bezirkId: bezirkA.id,
    }));
    assert.equal(namensAenderung.erfolg, true);
    const nachNamensaenderung = await prisma.referent.findUniqueOrThrow({ where: { id: referentAUser.referent.id } });
    assert.equal(nachNamensaenderung.vorname, "EigenNeu");
    assert.equal(nachNamensaenderung.oeffentlichSichtbar, false);
    assert.equal(nachNamensaenderung.oeffentlicheEinwilligungVersion, null);
    assert.equal(nachNamensaenderung.oeffentlicheEinwilligungAm, null);
    assert.equal(nachNamensaenderung.namensfreigabeStand, 4);
    const stoppNachNamensaenderung = await prisma.namensfreigabeNachweis.findFirstOrThrow({
      where: { referentId: nachNamensaenderung.id, entscheidung: "GESTOPPT" }, orderBy: { zeitpunkt: "desc" },
    });
    assert.equal(stoppNachNamensaenderung.handelnderUserId, adminA.id);
    await anmelden(referentAUser);
    assert.equal((await speichereNamensfreigabe({}, zustimmung(4))).erfolg, true);
    await anmelden(referentBUser);
    assert.equal((await speichereNamensfreigabe({}, zustimmung(0))).erfolg, true);
    await anmelden(adminA);
    fehlgeschlagen(await stoppeNamensfreigabe(referentBUser.referent.id, {}, widerruf(1)));
    assert.equal((await prisma.referent.findUniqueOrThrow({ where: { id: referentBUser.referent.id } })).oeffentlichSichtbar, true);
    const gestoppt = await stoppeNamensfreigabe(referentAUser.referent.id, {}, widerruf(5));
    assert.equal(gestoppt.erfolg, true);
    const nachStopp = await prisma.referent.findUniqueOrThrow({ where: { id: referentAUser.referent.id } });
    assert.equal(nachStopp.oeffentlichSichtbar, false);
    assert.equal((await prisma.namensfreigabeNachweis.findFirstOrThrow({ where: { referentId: nachStopp.id, entscheidung: "GESTOPPT" } })).handelnderUserId, adminA.id);

    const oeffentlich = await prisma.referent.findMany({
      where: oeffentlicherReferentWhere,
      select: oeffentlicherReferentSelect,
    });
    assert.deepEqual(oeffentlich.sort((a, b) => a.nachname.localeCompare(b.nachname)), [
      { vorname: "Fremd", nachname: "B" },
      { vorname: "Registriert", nachname: "Mit" },
    ]);
    assert.ok(oeffentlich.every((referent) => !Object.hasOwn(referent, "email") && !Object.hasOwn(referent, "notiz")));

    await prisma.user.update({ where: { id: referentBUser.id }, data: { isActive: false } });
    assert.deepEqual(await prisma.referent.findMany({ where: oeffentlicherReferentWhere, select: oeffentlicherReferentSelect }), [{ vorname: "Registriert", nachname: "Mit" }]);
    console.log("Namensfreigabe: Registrierung, Einwilligung, Widerruf, Bereichsschutz und öffentliche Auswahl bestanden.");
  } finally {
    await clearSessionCookie();
    await loeschen();
    await prisma.$disconnect();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
