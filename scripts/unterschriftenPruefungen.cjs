/* eslint-disable @typescript-eslint/no-require-imports -- Ladehook isoliert Sitzung und Datenbank. */
const assert = require("node:assert/strict");
const Module = require("node:module");
const sharp = require("sharp");
require("tsx/cjs");

const eigeneId = "12345678-1234-4234-8234-123456789012";
const andereId = "22345678-1234-4234-8234-123456789012";
let person;
let konto;
let abfragen;
let geschrieben;
let geloescht;
let protokoll;
class AuthError extends Error {}

const originalLoad = Module._load;
Module._load = function (anfrage, eltern, hauptmodul) {
  if (anfrage === "server-only") return {};
  if (anfrage === "next/cache") return { revalidatePath: () => {} };
  if (anfrage === "@/lib/auth") return {
    AuthError,
    requireRole: async (...rollen) => {
      if (!person || !rollen.includes(person.role) || !person.mfaBestaetigt) throw new AuthError("Kein Zugriff.");
      return person;
    },
  };
  if (anfrage === "@/lib/audit") return { auditLog: async (eintrag) => { protokoll.push(eintrag); } };
  if (anfrage === "@/lib/prisma") return { prisma: {
    user: { findFirst: async ({ where, select }) => {
      abfragen.push(where);
      assert.deepEqual(select, { id: true });
      assert.equal(where.role, "ADMIN");
      return konto && konto.role === where.role && (where.isActive === undefined || konto.isActive) ? { id: where.id } : null;
    } },
    bdbUnterschrift: {
      upsert: async (daten) => { geschrieben.push(daten); },
      deleteMany: async (daten) => { geloescht.push(daten); },
    },
  } };
  return originalLoad.call(this, anfrage, eltern, hauptmodul);
};

const { speichereUnterschrift, entferneUnterschrift } = require("../src/actions/unterschriften");
const { normalisiereUnterschrift, UnterschriftsBildFehler } = require("../src/lib/unterschriftBild");
const { MAX_UNTERSCHRIFT_BYTES } = require("../src/lib/unterschrift");

function vorbereiten() {
  person = { id: eigeneId, role: "ADMIN", mfaBestaetigt: true };
  konto = { role: "ADMIN", isActive: true };
  abfragen = []; geschrieben = []; geloescht = []; protokoll = [];
}
function formular(bild, freigabe = true) {
  const daten = new FormData();
  daten.set("unterschrift", new File([bild], "unterschrift.png", { type: "image/png" }));
  if (freigabe) daten.set("freigabe", "on");
  return daten;
}

(async () => {
  const png = await sharp({ create: { width: 800, height: 200, channels: 4, background: { r: 20, g: 40, b: 80, alpha: 0.5 } } }).png().toBuffer();
  for (const sitzung of [null, { role: "REFERENT", mfaBestaetigt: true }, { role: "ADMIN", mfaBestaetigt: false }]) {
    vorbereiten(); person = sitzung;
    assert.ok((await speichereUnterschrift(eigeneId, {}, formular(png))).fehler);
    assert.ok((await entferneUnterschrift(eigeneId, {})).fehler);
    assert.equal(abfragen.length, 0);
    assert.equal(geschrieben.length + geloescht.length, 0);
  }
  for (const ziel of [andereId, "ungueltig"]) {
    vorbereiten();
    assert.ok((await speichereUnterschrift(ziel, {}, formular(png))).fehler);
    assert.ok((await entferneUnterschrift(ziel, {})).fehler);
    assert.equal(abfragen.length, 0, "Kein Zugriff auf fremde Unterschriften, auch im gleichen Bezirk.");
  }
  for (const zielkonto of [null, { role: "REFERENT", isActive: true }, { role: "RVS", isActive: true }, { role: "ADMIN", isActive: false }]) {
    vorbereiten(); konto = zielkonto; person.role = "RVS";
    assert.ok((await speichereUnterschrift(andereId, {}, formular(png))).fehler);
    assert.equal(geschrieben.length, 0);
  }
  vorbereiten();
  assert.ok((await speichereUnterschrift(eigeneId, {}, formular(png, false))).fehler);
  assert.equal(geschrieben.length, 0);
  assert.ok((await speichereUnterschrift(eigeneId, {}, new FormData())).fehler);
  const falsch = formular(png); falsch.set("unterschrift", "bild.png");
  assert.ok((await speichereUnterschrift(eigeneId, {}, falsch)).fehler);

  for (const rolle of ["ADMIN", "RVS"]) {
    vorbereiten(); person.role = rolle;
    const ziel = rolle === "RVS" ? andereId : eigeneId;
    assert.equal((await speichereUnterschrift(ziel, {}, formular(png))).erfolg, true);
    assert.deepEqual(geschrieben[0].where, { userId: ziel });
    assert.equal(geschrieben[0].create.userId, ziel);
    assert.deepEqual(geschrieben[0].create.bildPng, geschrieben[0].update.bildPng);
    assert.equal((await sharp(geschrieben[0].create.bildPng).metadata()).format, "png");
    assert.deepEqual(protokoll[0], { userId: eigeneId, aktion: "UPDATE", entitaet: "BdbUnterschrift", entitaetId: ziel }, "Keine Bilddaten im Protokoll.");
    // Ersetzen nutzt denselben Datensatz; Entfernen funktioniert auch mehrfach.
    assert.equal((await speichereUnterschrift(ziel, {}, formular(png))).erfolg, true);
    assert.equal((await entferneUnterschrift(ziel, {})).erfolg, true);
    assert.equal((await entferneUnterschrift(ziel, {})).erfolg, true);
    assert.deepEqual(geloescht[0], { where: { userId: ziel } });
  }
  vorbereiten(); person.role = "RVS"; konto.isActive = false;
  assert.equal((await entferneUnterschrift(andereId, {})).erfolg, true);

  for (const daten of [Buffer.alloc(0), Buffer.alloc(MAX_UNTERSCHRIFT_BYTES + 1), Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'), png.subarray(0, 40), Buffer.from("kein Bild")]) {
    vorbereiten();
    assert.ok((await speichereUnterschrift(eigeneId, {}, formular(daten))).fehler);
    assert.equal(geschrieben.length, 0, "Ungültige oder zu große Dateien nicht speichern.");
  }
  const zuGross = await sharp({ create: { width: 4000, height: 3001, channels: 3, background: "white" } }).png().toBuffer();
  await assert.rejects(normalisiereUnterschrift(new File([zuGross], "gross.png")), UnterschriftsBildFehler);
  const jpeg = await sharp(png).resize(2400, 600).withExif({ IFD0: { Artist: "Nicht speichern" } }).jpeg().toBuffer();
  const normalisiert = await normalisiereUnterschrift(new File([jpeg], "bild.jpg", { type: "image/jpeg" }));
  const metadaten = await sharp(normalisiert).metadata();
  assert.equal(metadaten.format, "png");
  assert.equal(metadaten.width, 1200); assert.equal(metadaten.height, 300);
  assert.equal(metadaten.exif, undefined); assert.equal(metadaten.xmp, undefined);
  const transparent = await normalisiereUnterschrift(new File([png], "bild.png"));
  assert.equal((await sharp(transparent).metadata()).hasAlpha, true);
  console.log("Unterschriften: Rollen, MFA, Eigentum, Freigabe, Ersetzen/Entfernen, Bildprüfung, Größenlimit, Transparenz und Metadaten bestanden.");
})().catch((fehler) => { console.error(fehler); process.exitCode = 1; });
