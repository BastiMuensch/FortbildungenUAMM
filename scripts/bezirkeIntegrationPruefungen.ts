/**
 * Echte Datenbankprüfung der Bezirks-Sichtbarkeit.
 *
 * Ausschließlich gegen den von der Testumgebung bereitgestellten lokalen
 * PostgreSQL-Cluster ausführen, zum Beispiel:
 *   DATABASE_URL='postgresql://…@localhost:54329/postgres' npx tsx scripts/bezirkeIntegrationPruefungen.ts
 */
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

import {
  bezirkScope,
  fortbildungScope,
  referentScope,
  type BereichsUser,
} from "../src/lib/berechtigungsScope";

const url = new URL(process.env.DATABASE_URL ?? "postgresql://ungueltig");
assert.equal(["localhost", "127.0.0.1"].includes(url.hostname) && url.port === "54329" && (url.pathname === "/postgres" || /test/i.test(url.pathname)), true, "Diese Prüfung darf nur gegen localhost:54329/postgres oder eine Testdatenbank laufen.");

const prisma = new PrismaClient();
const prefix = "99999999-0000-4000-8000-";
const ids = {
  bezirkA: `${prefix}000000000001`, bezirkB: `${prefix}000000000002`,
  adminA: `${prefix}000000000011`, adminB: `${prefix}000000000012`, adminAB: `${prefix}000000000013`, rvs: `${prefix}000000000014`,
  refAUser: `${prefix}000000000021`, refABUser: `${prefix}000000000022`, refA: `${prefix}000000000031`, refAB: `${prefix}000000000032`,
  ort: `${prefix}000000000041`, eventA: `${prefix}000000000051`, eventB: `${prefix}000000000052`,
};

function sitzung(id: string, role: string, bezirkIds: string[], referentId: string | null = null): BereichsUser {
  return { id, role, bezirkIds, referentId };
}

async function aufraeumen() {
  await prisma.fortbildung.deleteMany({ where: { id: { in: [ids.eventA, ids.eventB] } } });
  await prisma.referent.deleteMany({ where: { id: { in: [ids.refA, ids.refAB] } } });
  await prisma.user.deleteMany({ where: { id: { in: [ids.adminA, ids.adminB, ids.adminAB, ids.rvs, ids.refAUser, ids.refABUser] } } });
  await prisma.veranstaltungsort.deleteMany({ where: { id: ids.ort } });
  await prisma.bezirk.deleteMany({ where: { id: { in: [ids.bezirkA, ids.bezirkB] } } });
}

async function main() {
  await aufraeumen();
  try {
    await prisma.$transaction(async (tx) => {
      await tx.bezirk.createMany({ data: [
        { id: ids.bezirkA, name: "Integration Bezirk A" },
        { id: ids.bezirkB, name: "Integration Bezirk B" },
      ] });
      await tx.user.createMany({ data: [
        { id: ids.adminA, email: "integration-admin-a@example.invalid", role: "ADMIN" },
        { id: ids.adminB, email: "integration-admin-b@example.invalid", role: "ADMIN" },
        { id: ids.adminAB, email: "integration-admin-ab@example.invalid", role: "ADMIN" },
        { id: ids.rvs, email: "integration-rvs@example.invalid", role: "RVS" },
        { id: ids.refAUser, email: "integration-ref-a@example.invalid", role: "REFERENT" },
        { id: ids.refABUser, email: "integration-ref-ab@example.invalid", role: "REFERENT" },
      ] });
      await tx.user.update({ where: { id: ids.adminA }, data: { bezirke: { connect: { id: ids.bezirkA } } } });
      await tx.user.update({ where: { id: ids.adminB }, data: { bezirke: { connect: { id: ids.bezirkB } } } });
      await tx.user.update({ where: { id: ids.adminAB }, data: { bezirke: { connect: [{ id: ids.bezirkA }, { id: ids.bezirkB }] } } });
      await tx.referent.create({ data: { id: ids.refA, vorname: "Integration", nachname: "Referent A", userId: ids.refAUser, bezirke: { connect: { id: ids.bezirkA } } } });
      await tx.referent.create({ data: { id: ids.refAB, vorname: "Integration", nachname: "Referent AB", userId: ids.refABUser, bezirke: { connect: [{ id: ids.bezirkA }, { id: ids.bezirkB }] } } });
      await tx.veranstaltungsort.create({ data: { id: ids.ort, name: "Integration Online", istOnline: true } });
      for (const [id, slug, bezirkId, createdById] of [
        [ids.eventA, "integration-bezirk-a", ids.bezirkA, ids.refAUser],
        [ids.eventB, "integration-bezirk-b", ids.bezirkB, ids.refABUser],
      ] as const) {
        await tx.fortbildung.create({ data: {
          id, slug, bezirkId, createdById, titel: slug, beschreibungHtml: "<p>Integration</p>", beschreibungText: "Integration",
          organisationsform: "REGIONAL", maxTn: 10, format: "ESESSION", beginn: new Date("2027-01-10T09:00:00Z"), ende: new Date("2027-01-10T10:00:00Z"),
          veranstaltungsortId: ids.ort, schularten: ["GRUNDSCHULE"],
          referenten: { create: [{ referentId: ids.refA }, { referentId: ids.refAB }] },
        } });
      }
    });

    const sichtbareEvents = async (user: BereichsUser) => (await prisma.fortbildung.findMany({ where: { AND: [{ id: { in: [ids.eventA, ids.eventB] } }, fortbildungScope(user)] }, select: { id: true }, orderBy: { id: "asc" } })).map((event) => event.id);
    assert.deepEqual(await sichtbareEvents(sitzung(ids.adminA, "ADMIN", [ids.bezirkA])), [ids.eventA]);
    assert.deepEqual(await sichtbareEvents(sitzung(ids.adminAB, "ADMIN", [ids.bezirkA, ids.bezirkB])), [ids.eventA, ids.eventB]);
    // Referent A ist an Event B beteiligt, verliert es aber wegen Bezirk B.
    assert.deepEqual(await sichtbareEvents(sitzung(ids.refAUser, "REFERENT", [ids.bezirkA], ids.refA)), [ids.eventA]);
    assert.deepEqual(await sichtbareEvents(sitzung(ids.refABUser, "REFERENT", [ids.bezirkA, ids.bezirkB], ids.refAB)), [ids.eventA, ids.eventB]);
    assert.deepEqual(await sichtbareEvents(sitzung(ids.rvs, "RVS", [])), [ids.eventA, ids.eventB]);

    const referentenA = await prisma.referent.findMany({ where: referentScope(sitzung(ids.adminA, "ADMIN", [ids.bezirkA])), select: { id: true }, orderBy: { id: "asc" } });
    assert.deepEqual(referentenA.map((referent) => referent.id), [ids.refA, ids.refAB]);
    const bezirkeB = await prisma.bezirk.findMany({ where: bezirkScope(sitzung(ids.adminB, "ADMIN", [ids.bezirkB])), select: { id: true } });
    assert.deepEqual(bezirkeB.map((bezirk) => bezirk.id), [ids.bezirkB]);

    await prisma.referent.update({ where: { id: ids.refA }, data: { bezirke: { disconnect: { id: ids.bezirkA } } } });
    assert.deepEqual(await sichtbareEvents(sitzung(ids.refAUser, "REFERENT", [], ids.refA)), []);
    console.log("Bezirke-Integration: Scopes, Mehrfachzuordnung, Bezirksentzug und RvS-Zugriff bestanden.");
  } finally {
    await aufraeumen();
    await prisma.$disconnect();
  }
}

main().catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exitCode = 1; });
