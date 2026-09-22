import "server-only";

import { ERFASSER, requireRole, type SessionUser } from "@/lib/auth";
import { ladeBezirke } from "@/lib/bezirke";
import { prisma } from "@/lib/prisma";
import type {
  KompetenzBereichOption,
  OrtOption,
  ReferentOption,
} from "@/components/admin/FortbildungForm/types";

/**
 * Auswahllisten für das Fortbildungs-Formular.
 * In einem Rutsch geladen, damit die Seite nicht an vier hintereinander
 * laufenden Abfragen hängt.
 */
export async function ladeFormularDaten(user: SessionUser): Promise<{
  bezirke: { id: string; name: string; pflichtSchlagworte: string[] }[];
  orte: OrtOption[];
  kompetenzBereiche: KompetenzBereichOption[];
  referenten: ReferentOption[];
  schlagwortVorschlaege: string[];
}> {
  await requireRole(...ERFASSER);
  const bezirke = await ladeBezirke(user);
  const [orte, bereiche, referenten, schlagworte] = await Promise.all([
    prisma.veranstaltungsort.findMany({
      where: { aktiv: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, ort: true, istOnline: true },
    }),

    prisma.digCompKompetenz.findMany({
      where: { parentCode: null, aktiv: true },
      orderBy: { sortOrder: "asc" },
      select: {
        code: true,
        titel: true,
        beschreibung: true,
        children: {
          where: { aktiv: true },
          orderBy: { sortOrder: "asc" },
          select: { code: true, titel: true, istPlatzhalter: true },
        },
      },
    }),

    prisma.referent.findMany({
      where: { aktiv: true, bezirke: { some: { id: { in: bezirke.map((b) => b.id) } } } },
      orderBy: [{ nachname: "asc" }, { vorname: "asc" }],
      select: { id: true, vorname: true, nachname: true, organisation: true, bezirke: { where: { id: { in: bezirke.map((b) => b.id) } }, select: { id: true } } },
    }),

    prisma.schlagwort.findMany({
      where: { istPflicht: false },
      orderBy: { name: "asc" },
      select: { name: true },
    }),
  ]);

  return {
    bezirke,
    orte,
    kompetenzBereiche: bereiche,
    referenten: referenten.map((r) => ({ ...r, bezirkIds: r.bezirke.map((b) => b.id) })),
    schlagwortVorschlaege: schlagworte.map((s) => s.name),
  };
}
