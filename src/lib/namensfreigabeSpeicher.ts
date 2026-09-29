import "server-only";

import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { NAMENSFREIGABE_ENTSCHEIDUNGEN, NAMENSFREIGABE_TEXT, NAMENSFREIGABE_VERSION } from "@/constants/fortbildung";

/** Alle Änderungen derselben Entscheidung werden auch über mehrere Tabs serialisiert. */
export async function sperreNamensfreigabe(tx: Prisma.TransactionClient, referentId: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`namensfreigabe:${referentId}`}))`;
}

/** Nur innerhalb einer autorisierten Transaktion nach sperreNamensfreigabe verwenden. */
export async function schreibeNamensfreigabe(
  tx: Prisma.TransactionClient,
  referentId: string,
  handelnderUserId: string,
  entscheidung: (typeof NAMENSFREIGABE_ENTSCHEIDUNGEN)[number],
) {
  const art = z.enum(NAMENSFREIGABE_ENTSCHEIDUNGEN).parse(entscheidung);
  const zustimmung = art === "ERTEILT";
  const jetzt = new Date();
  const referent = await tx.referent.update({
    where: { id: referentId },
    data: {
      oeffentlichSichtbar: zustimmung,
      oeffentlicheEinwilligungVersion: zustimmung ? NAMENSFREIGABE_VERSION : null,
      oeffentlicheEinwilligungAm: zustimmung ? jetzt : null,
      namensfreigabeStand: { increment: 1 },
      namensfreigaben: { create: {
        handelnderUserId,
        entscheidung: art,
        version: NAMENSFREIGABE_VERSION,
        erklaerung: NAMENSFREIGABE_TEXT,
        zeitpunkt: jetzt,
      } },
    },
    select: { namensfreigabeStand: true, oeffentlichSichtbar: true },
  });
  // Kalender-Abonnements erkennen die geänderte Namensanzeige am Datenstand.
  await tx.fortbildung.updateMany({
    where: { referenten: { some: { referentId } } },
    data: { updatedAt: jetzt },
  });
  return { stand: referent.namensfreigabeStand, sichtbar: referent.oeffentlichSichtbar };
}
