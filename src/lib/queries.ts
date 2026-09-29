import type { Prisma } from "@prisma/client";
import { STATUS_OEFFENTLICH } from "@/constants/fortbildung";
import { berlinIsoDatum } from "@/lib/datetime";
import { operativeFortbildungWhere } from "@/lib/schuljahr";
import {
  oeffentlicherReferentSelect,
  oeffentlicherReferentWhere,
} from "@/lib/namensfreigabe";

/**
 * Filter für alles, was Lehrkräfte zu sehen bekommen.
 *
 * An genau einer Stelle definiert und in Liste, Kalender, Detailseite und
 * ICS-Feed wiederverwendet. Würde jede Ansicht ihre eigene Bedingung
 * mitbringen, wäre ein vergessener Status-Filter irgendwann unvermeidlich —
 * und damit ein Entwurf öffentlich.
 */
export function oeffentlicheFortbildungWhere(bezirkId?: string): Prisma.FortbildungWhereInput {
  return { AND: [operativeFortbildungWhere(), { status: { in: STATUS_OEFFENTLICH }, ...(bezirkId ? { bezirkId } : {}) }] };
}

/**
 * Auswahl für öffentliche Ansichten.
 *
 * Nur Vor- und Nachname von Referentinnen und Referenten mit gültiger
 * elektronischer Namensfreigabe werden geladen. Organisation, Rolle,
 * Kontaktdaten, interne Notizen und IDs verlassen den Redaktionsbereich nicht.
 */
export const oeffentlicheFortbildungSelect = {
  id: true,
  slug: true,
  titel: true,
  kurztitel: true,
  beschreibungHtml: true,
  organisationsform: true,
  maxTn: true,
  format: true,
  beginn: true,
  ende: true,
  schularten: true,
  fach: true,
  niveaustufe: true,
  fibsLehrgangsnummer: true,
  fibsUrl: true,
  inFibs: true,
  status: true,
  bezirk: { select: { id: true, name: true } },
  veranstaltungsort: {
    select: { id: true, name: true, ort: true, istOnline: true },
  },
  schlagworte: {
    select: { schlagwort: { select: { id: true, name: true } } },
  },
  kompetenzen: {
    select: {
      kompetenz: {
        select: { code: true, titel: true, parentCode: true },
      },
    },
  },
  referenten: {
    where: { referent: oeffentlicherReferentWhere },
    select: {
      referent: { select: oeffentlicherReferentSelect },
    },
  },
} satisfies Prisma.FortbildungSelect;

export type OeffentlicheFortbildung = Prisma.FortbildungGetPayload<{
  select: typeof oeffentlicheFortbildungSelect;
}>;

/** Kompakte Auswahl für Listen- und Kalenderkacheln. */
export const fortbildungKachelSelect = {
  id: true,
  slug: true,
  titel: true,
  kurztitel: true,
  organisationsform: true,
  format: true,
  beginn: true,
  ende: true,
  schularten: true,
  status: true,
  bezirk: { select: { id: true, name: true } },
  // Die Liste kommuniziert nicht nur, dass ein Angebot existiert, sondern auch,
  // ob die verbindliche Anmeldung bereits offen ist.
  inFibs: true,
  fibsUrl: true,
  veranstaltungsort: { select: { name: true, ort: true, istOnline: true } },
  schlagworte: { select: { schlagwort: { select: { id: true, name: true } } } },
} satisfies Prisma.FortbildungSelect;

export type FortbildungKachel = Prisma.FortbildungGetPayload<{
  select: typeof fortbildungKachelSelect;
}>;

/**
 * Slug aus Titel und Beginn. Enthält eine Kurz-ID, damit zwei gleichnamige
 * Termine am selben Tag kollisionsfrei bleiben.
 */
export function bildeSlug(titel: string, beginn: Date, id: string): string {
  const basis = titel
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  const datum = berlinIsoDatum(beginn);
  return `${basis || "fortbildung"}-${datum}-${id.slice(0, 6)}`;
}
