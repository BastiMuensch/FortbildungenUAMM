import "server-only";

import type { Prisma } from "@prisma/client";

import { fortbildungScope, type SessionUser } from "@/lib/auth";
import { filterZuWhere, type FortbildungFilter } from "@/lib/filter";
import { prisma } from "@/lib/prisma";

/**
 * Alle tatsächlich vergangenen Fortbildungen, die in den internen Katalog
 * gehören. Abgesagte Termine sind bewusst kein Katalogeintrag.
 */
export function katalogWhere(
  user: SessionUser,
  filter: FortbildungFilter,
  jetzt: Date = new Date(),
): Prisma.FortbildungWhereInput {
  return {
    AND: [
      fortbildungScope(user),
      filterZuWhere(filter),
      { ende: { lt: jetzt } },
      // Ein vergangener Entwurf ist noch keine gehaltene Fortbildung. In den
      // Katalog kommen nur tatsächlich veröffentlichte bzw. archivierte Termine.
      { status: { in: ["VEROEFFENTLICHT", "ARCHIVIERT"] } },
    ],
  };
}

/**
 * Schlanke, für Liste und Exporte gemeinsame Datenauswahl. Kontaktangaben
 * der Referierenden werden absichtlich nicht mitgeladen.
 */
export const katalogAuswahl = {
  id: true,
  titel: true,
  kurztitel: true,
  beschreibungText: true,
  organisationsform: true,
  format: true,
  beginn: true,
  ende: true,
  schularten: true,
  fach: true,
  niveaustufe: true,
  status: true,
  tnTatsaechlich: true,
  veranstaltungsort: { select: { name: true, ort: true, istOnline: true } },
  schlagworte: {
    select: { schlagwort: { select: { name: true } } },
  },
  kompetenzen: {
    select: { kompetenz: { select: { code: true, titel: true } } },
  },
  referenten: {
    select: { referent: { select: { vorname: true, nachname: true } } },
  },
} satisfies Prisma.FortbildungSelect;

export type KatalogEintrag = Prisma.FortbildungGetPayload<{
  select: typeof katalogAuswahl;
}>;

export async function ladeKatalog(
  user: SessionUser,
  filter: FortbildungFilter,
): Promise<KatalogEintrag[]> {
  return prisma.fortbildung.findMany({
    where: katalogWhere(user, filter),
    orderBy: [{ beginn: "desc" }, { titel: "asc" }],
    select: katalogAuswahl,
  });
}

/** Beschreibungen bleiben in Liste und Export gut lesbar, auch bei Alttexten. */
export function katalogKurzbeschreibung(text: string, maximum = 340): string {
  const bereinigt = text.replace(/\s+/g, " ").trim();
  if (bereinigt.length <= maximum) return bereinigt;
  return `${bereinigt.slice(0, maximum).trimEnd()}...`;
}
