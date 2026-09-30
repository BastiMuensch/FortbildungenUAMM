/* eslint-disable @typescript-eslint/no-require-imports -- Isolierter Next-Kontext für echte Datenbanktests. */
const assert = require('node:assert/strict');
const Module = require('node:module');
if (!process.env.DATABASE_URL?.startsWith('postgresql://bezirketest@127.0.0.1:54329/fortbildungen_test')) throw new Error('Nur isolierte Testdatenbank erlaubt.');
process.env.JWT_SECRET = 'datenschutz-test-geheimnis-mindestens-zweiunddreissig-zeichen';
const cookies = new Map();
const original = Module._load;
Module._load = function (name, ...args) {
  if (name === 'server-only') return {};
  if (name === 'next/headers') return { cookies: async () => ({ get: k => cookies.has(k) ? { value: cookies.get(k) } : undefined, set: (k,v) => cookies.set(k,v), delete: k => cookies.delete(k) }), headers: async () => new Headers() };
  if (name === 'next/cache') return { revalidatePath() {} };
  return original.call(this, name, ...args);
};
require('tsx/cjs');
const { prisma } = require('../src/lib/prisma');
const { schuljahrFuerDatum, schuljahrFristende, operativeFortbildungWhere } = require('../src/lib/schuljahr');
const { getSessionUser, requireRole, signToken, setSessionCookie, fortbildungScope } = require('../src/lib/auth');
const { oeffentlicheFortbildungWhere } = require('../src/lib/queries');
const { ladeTerminumfeld } = require('../src/actions/terminumfeld');
const { ladeAuswertung } = require('../src/lib/auswertungDaten');
const { NextRequest } = require('next/server');
const exportRoute = require('../src/app/api/admin/export/route');
const ExcelJS = require('exceljs');
const prefix = `datenschutz-${Date.now()}`;
const login = async (user, mf = true) => setSessionCookie(await signToken(user.id, user.sessionVersion, mf));
(async () => {
 const bezirke = []; const users = []; let ort;
 try {
  for (const name of ['A','B']) bezirke.push(await prisma.bezirk.create({ data: { name: `${prefix}-${name}` } }));
  ort = await prisma.veranstaltungsort.create({ data: { name: `${prefix}-Online`, istOnline: true } });
  for (const role of ['ADMIN','RVS']) users.push(await prisma.user.create({ data: { email: `${prefix}-${role}@test.invalid`, role, mfaAktiviertAm: new Date(), bezirke: { connect: { id: bezirke[0].id } } } }));
  const erstellen = (name, beginn, bezirk = bezirke[0], extra = {}) => prisma.fortbildung.create({ data: { titel: `${prefix}-${name}`, slug: `${prefix}-${name}`, beschreibungHtml: '<p>Planung</p>', beschreibungText: 'Planung', organisationsform:'SCHILF', format:'ESESSION', maxTn:20, tnTatsaechlich:7, beginn:new Date(beginn), ende:new Date(new Date(beginn).getTime()+3600000), veranstaltungsortId:ort.id, bezirkId:bezirk.id, status:'VEROEFFENTLICHT', schularten:['GRUNDSCHULE'], ...extra } });
  // Die DB muss dieselben Berliner Grenzen berechnen wie die Anwendung,
  // insbesondere kurz vor/nach Mitternacht am Schuljahreswechsel.
  for (const datum of ['2026-07-31T21:59:59.999Z','2026-07-31T22:00:00.000Z','2027-07-31T22:00:00Z','2028-02-29T23:00:00Z']) {
   const f = await erstellen(`grenze-${datum.replaceAll(':','')}`, datum);
   assert.equal(f.schuljahr, schuljahrFuerDatum(f.beginn));
   assert.equal(f.aufbewahrenBis.toISOString(), schuljahrFristende(f.schuljahr).toISOString());
   assert.equal(await prisma.fortbildung.count({where:{AND:[{id:f.id},operativeFortbildungWhere(new Date(f.aufbewahrenBis.getTime()-1))]}}),1);
   assert.equal(await prisma.fortbildung.count({where:{AND:[{id:f.id},operativeFortbildungWhere(f.aufbewahrenBis)]}}),0);
   await prisma.fortbildung.delete({where:{id:f.id}});
  }
  assert.equal(schuljahrFristende(2026).toISOString(),'2028-09-03T22:00:00.000Z');
  const eigen = await erstellen('eigen','2099-09-10T10:00:00Z');
  const fremd = await erstellen('fremd','2099-09-11T10:00:00Z',bezirke[1],{status:'ENTWURF',freigabeNotiz:'VERTRAULICHE NACHBEREITUNG'});
  const alt = await erstellen('abgelaufen','2020-09-10T10:00:00Z');
  const manipuliert = await prisma.fortbildung.update({where:{id:alt.id},data:{aufbewahrenBis:new Date('2199-01-01Z'),schuljahr:2198}});
  assert.equal(manipuliert.aufbewahrenBis.toISOString(),alt.aufbewahrenBis.toISOString());
  await assert.rejects(prisma.fortbildung.update({where:{id:alt.id},data:{beginn:new Date('2099-09-10T10:00:00Z')}}));
  assert.equal(await prisma.fortbildung.count({where:{AND:[{id:alt.id},oeffentlicheFortbildungWhere()]}}),0);
  await login(users[0]); const admin = await getSessionUser(); assert.ok(admin);
  const ids = (await prisma.fortbildung.findMany({where:fortbildungScope(admin),select:{id:true}})).map(f=>f.id);
  assert.ok(ids.includes(eigen.id)); assert.ok(!ids.includes(fremd.id)); assert.ok(!ids.includes(alt.id));
  const auswertung = await ladeAuswertung(admin,{});
  assert.ok(auswertung.termine.some(f=>f.id===eigen.id)); assert.ok(!auswertung.termine.some(f=>f.id===fremd.id||f.id===alt.id));
  const kalender = await ladeTerminumfeld({beginn:'2099-09-10T10:00:00Z',ende:'2099-09-10T12:00:00Z',ortId:null,referentIds:[],ausserId:null});
  assert.ok(kalender.termine.some(f=>f.id===fremd.id));
  assert.ok(!JSON.stringify(kalender).includes('VERTRAULICHE NACHBEREITUNG'));
  const alterKalender = await ladeTerminumfeld({beginn:'2020-09-10T10:00:00Z',ende:null,ortId:null,referentIds:[],ausserId:null});
  assert.ok(!alterKalender.termine.some(f=>f.id===alt.id));
  const exportAntwort = await exportRoute.GET(new NextRequest('http://localhost/api/admin/export?schuljahr=alle'));
  assert.equal(exportAntwort.status,200);
  const wb = new ExcelJS.Workbook(); await wb.xlsx.load(Buffer.from(await exportAntwort.arrayBuffer()));
  const exportText = JSON.stringify(wb.worksheets.map(b=>b.getSheetValues()));
  assert.ok(exportText.includes(eigen.titel)); assert.ok(!exportText.includes(fremd.titel)); assert.ok(!exportText.includes(alt.titel));
  await login(users[1]); const rvs = await getSessionUser();
  assert.equal(await prisma.fortbildung.count({where:{AND:[{id:fremd.id},fortbildungScope(rvs)]}}),1);
  assert.equal(await prisma.fortbildung.count({where:{AND:[{id:alt.id},fortbildungScope(rvs)]}}),0);
  // Auch direkte Downloads dürfen eine nur per Passwort bestätigte Sitzung nicht akzeptieren.
  await login(users[0],false); assert.equal(await getSessionUser(),null);
  assert.equal((await exportRoute.GET(new NextRequest('http://localhost/api/admin/export'))).status,401);
  await assert.rejects(requireRole('ADMIN'));
  await prisma.user.update({where:{id:users[0].id},data:{mfaAktiviertAm:null}});
  await login(users[0],false); assert.equal(await getSessionUser(),null);
  assert.ok((await getSessionUser({mfaEinrichtungErlauben:true})).mfaEinrichtungErforderlich);
  await login(users[1]); assert.ok(await getSessionUser());
  await prisma.user.update({where:{id:users[1].id},data:{sessionVersion:{increment:1}}});
  assert.equal(await getSessionUser(),null);
  console.log('Datenschutz: Berliner DB-Grenzen, unveränderliche Fristen, Bezirkszugriff, RvS, Kalenderausnahme, Auswertung, Excel und MFA-Downloads bestanden.');
 } finally {
  await prisma.auditLog.deleteMany({where:{userId:{in:users.map(u=>u.id)}}});
  await prisma.fortbildung.deleteMany({where:{titel:{startsWith:prefix}}});
  await prisma.user.deleteMany({where:{id:{in:users.map(u=>u.id)}}});
  if(ort) await prisma.veranstaltungsort.delete({where:{id:ort.id}});
  await prisma.bezirk.deleteMany({where:{id:{in:bezirke.map(b=>b.id)}}});
  await prisma.$disconnect();
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
