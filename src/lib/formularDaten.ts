import "server-only";

import { ladeSchulamt } from "@/lib/schulamt";
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
export async function ladeFormularDaten(): Promise<{
  orte: OrtOption[];
  kompetenzBereiche: KompetenzBereichOption[];
  referenten: ReferentOption[];
  schlagwortVorschlaege: string[];
  pflichtSchlagworte: string[];
}> {
  const [orte, bereiche, referenten, schlagworte, schulamt] = await Promise.all([
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
      where: { aktiv: true },
      orderBy: [{ nachname: "asc" }, { vorname: "asc" }],
      select: { id: true, vorname: true, nachname: true, organisation: true },
    }),

    prisma.schlagwort.findMany({
      where: { istPflicht: false },
      orderBy: { name: "asc" },
      select: { name: true },
    }),
    ladeSchulamt(),
  ]);

  return {
    orte,
    kompetenzBereiche: bereiche,
    referenten,
    schlagwortVorschlaege: schlagworte.map((s) => s.name),
    pflichtSchlagworte: schulamt.pflichtSchlagworte,
  };
}
