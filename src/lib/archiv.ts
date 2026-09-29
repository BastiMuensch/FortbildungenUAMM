import "server-only";

import { createHash } from "node:crypto";

import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { schuljahrWhere } from "@/lib/schuljahr";

export const ARCHIV_FORMAT_VERSION = 1;

/**
 * Datensparsamer Nachweis der Fortbildungstätigkeit. Freitexte, Kontakte,
 * interne Notizen und Sitzungsdaten gehören bewusst nicht in das Paket.
 */
export type ArchivEintrag = {
  id: string;
  titel: string;
  beginn: string;
  ende: string;
  organisationsform: string;
  format: string;
  veranstaltungsort: string;
  ort: string | null;
  schularten: string[];
  fach: string | null;
  niveaustufe: string | null;
  kompetenzen: string[];
  schlagworte: string[];
  teilnehmende: number | null;
  plaetzeGeplant: number;
  referenten: Array<{ id: string; vorname: string; nachname: string }>;
  status: string;
  fibsLehrgangsnummer: string | null;
  aufbewahrenBis: string;
};

export type ArchivInhalt = {
  formatVersion: number;
  bezirk: { id: string; name: string };
  schuljahr: number;
  fortbildungen: ArchivEintrag[];
};

const archivSelect = {
  id: true,
  titel: true,
  beginn: true,
  ende: true,
  organisationsform: true,
  format: true,
  schularten: true,
  fach: true,
  niveaustufe: true,
  tnTatsaechlich: true,
  maxTn: true,
  status: true,
  fibsLehrgangsnummer: true,
  aufbewahrenBis: true,
  veranstaltungsort: { select: { name: true, ort: true } },
  kompetenzen: { select: { kompetenzCode: true } },
  schlagworte: { select: { schlagwort: { select: { name: true } } } },
  referenten: { select: { referent: { select: { id: true, vorname: true, nachname: true } } } },
} satisfies Prisma.FortbildungSelect;

type Datenbank = Pick<PrismaClient, "bezirk" | "fortbildung">;

/** Liest stets in derselben Reihenfolge, damit der Hash reproduzierbar bleibt. */
export async function ladeArchivInhalt(
  bezirkId: string,
  schuljahr: number,
  db: Datenbank = prisma,
): Promise<ArchivInhalt | null> {
  const bezirk = await db.bezirk.findUnique({
    where: { id: bezirkId },
    select: { id: true, name: true },
  });
  if (!bezirk) return null;

  const fortbildungen = await db.fortbildung.findMany({
    where: { AND: [{ bezirkId }, schuljahrWhere(schuljahr)] },
    select: archivSelect,
    orderBy: [{ beginn: "asc" }, { id: "asc" }],
  });

  return {
    formatVersion: ARCHIV_FORMAT_VERSION,
    bezirk,
    schuljahr,
    fortbildungen: fortbildungen.map((fortbildung) => ({
      id: fortbildung.id,
      titel: fortbildung.titel,
      beginn: fortbildung.beginn.toISOString(),
      ende: fortbildung.ende.toISOString(),
      organisationsform: fortbildung.organisationsform,
      format: fortbildung.format,
      veranstaltungsort: fortbildung.veranstaltungsort.name,
      ort: fortbildung.veranstaltungsort.ort,
      schularten: [...fortbildung.schularten].sort(),
      fach: fortbildung.fach,
      niveaustufe: fortbildung.niveaustufe,
      kompetenzen: fortbildung.kompetenzen.map((k) => k.kompetenzCode).sort(),
      schlagworte: fortbildung.schlagworte.map((s) => s.schlagwort.name).sort(),
      teilnehmende: fortbildung.tnTatsaechlich,
      plaetzeGeplant: fortbildung.maxTn,
      referenten: fortbildung.referenten.map((r) => r.referent).sort((a, b) => a.id.localeCompare(b.id)),
      status: fortbildung.status,
      fibsLehrgangsnummer: fortbildung.fibsLehrgangsnummer,
      aufbewahrenBis: fortbildung.aufbewahrenBis.toISOString(),
    })),
  };
}

export function archivinhaltsHash(inhalt: ArchivInhalt): string {
  return createHash("sha256").update(archivinhaltsJson(inhalt)).digest("hex");
}

/** Genau diese Bytes werden als fortbildungen.json in das ZIP geschrieben. */
export function archivinhaltsJson(inhalt: ArchivInhalt): string { return `${JSON.stringify(inhalt)}\n`; }

export function paketkennung(bezirkId: string, schuljahr: number, hash: string): string {
  return `ARCHIV-${schuljahr}-${bezirkId.slice(0, 8)}-${hash.slice(0, 16)}`;
}

function csvZelle(wert: string | number | null): string {
  let text = wert === null ? "" : String(wert);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[;"\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function archivinhaltsCsv(inhalt: ArchivInhalt): string {
  const kopf = ["ID", "Titel", "Beginn UTC", "Ende UTC", "Form", "Format", "Veranstaltungsort", "Ort", "Schularten", "Fach", "Niveaustufe", "Kompetenzen", "Schlagworte", "Teilnehmende", "Plätze geplant", "Referenten", "Status", "FIBS-Nummer", "Operative Löschfrist UTC"];
  const zeilen = inhalt.fortbildungen.map((f) => [
    f.id, f.titel, f.beginn, f.ende, f.organisationsform, f.format, f.veranstaltungsort,
    f.ort, f.schularten.join(", "), f.fach, f.niveaustufe, f.kompetenzen.join(", "),
    f.schlagworte.join(", "), f.teilnehmende, f.plaetzeGeplant, f.referenten.map((r) => `${r.vorname} ${r.nachname}`).join(", "), f.status, f.fibsLehrgangsnummer, f.aufbewahrenBis,
  ].map(csvZelle).join(";"));
  return [kopf.map(csvZelle).join(";"), ...zeilen].join("\r\n");
}

export function manifest(inhalt: ArchivInhalt, hash: string, kennung: string) {
  return {
    formatVersion: ARCHIV_FORMAT_VERSION,
    paketkennung: kennung,
    inhaltsHashSha256: hash,
    bezirk: inhalt.bezirk,
    schuljahr: inhalt.schuljahr,
    anzahlFortbildungen: inhalt.fortbildungen.length,
    externeAufbewahrungsdauer: "noch festzulegen",
    zweck: "Tätigkeitsnachweis und Auswertung der Fortbildungsarbeit.",
    hinweis: "Enthält nur Fortbildungsstammdaten, Auslastung sowie Namen und IDs der Referierenden; keine Kontaktangaben, internen Notizen, pauschalen Freitexte oder Sitzungsdaten.",
    dateien: ["manifest.json", "fortbildungen.json", "fortbildungen.csv", "pruefsumme.sha256"],
  };
}
