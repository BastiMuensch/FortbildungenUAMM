import "server-only";

import { Prisma } from "@prisma/client";

import { archivinhaltsHash, ladeArchivInhalt } from "@/lib/archiv";
import { prisma } from "@/lib/prisma";
import { schuljahrWhere } from "@/lib/schuljahr";

/**
 * Löscht operative Fortbildungsdaten nur nach Ablauf der individuellen Frist
 * und nach bestätigter, unveränderter externer Archivübergabe. Der bisherige
 * Status ARCHIVIERT bleibt davon unabhängig und ist kein Archivnachweis.
 */
const PROTOKOLL_NACH_TAGEN = 365;

export interface AufraeumErgebnis {
  /** Aus Kompatibilitätsgründen vorhanden; Statusänderungen erfolgen nicht mehr. */
  archiviert: number;
  operativGeloescht: number;
  fehlendeArchivuebernahmen: number;
  referentenZuordnungenGeloescht: number;
  protokolleGeloescht: number;
  importLaeufeGeloescht: number;
  gelaufenAm: Date;
}

export async function runRetention(): Promise<AufraeumErgebnis> {
  const jetzt = new Date();
  const vorTagen = (tage: number) => new Date(jetzt.getTime() - tage * 86_400_000);
  // Nur abgelaufene Kohorten; die eigentliche Prüfung passiert noch einmal
  // seriell in der Transaktion, damit ein paralleler Edit nicht verloren geht.
  const kandidaten = await prisma.fortbildung.findMany({
    where: { aufbewahrenBis: { lte: jetzt } },
    distinct: ["bezirkId", "schuljahr"],
    select: { bezirkId: true, schuljahr: true },
  });

  let operativGeloescht = 0;
  let fehlendeArchivuebernahmen = 0;
  for (const kandidat of kandidaten) {
    try {
      const resultat = await prisma.$transaction(async (tx) => {
        const anzahl = await tx.fortbildung.count({
          where: { AND: [{ bezirkId: kandidat.bezirkId }, schuljahrWhere(kandidat.schuljahr), { aufbewahrenBis: { lte: jetzt } }] },
        });
        // Nicht alle Datensätze der Kohorte sind fällig: keine Teil-Löschung.
        const gesamteKohorte = await tx.fortbildung.count({
          where: { AND: [{ bezirkId: kandidat.bezirkId }, schuljahrWhere(kandidat.schuljahr)] },
        });
        if (!anzahl || anzahl !== gesamteKohorte) return { geloescht: 0, uebernahmeFehlt: false };

        const inhalt = await ladeArchivInhalt(kandidat.bezirkId, kandidat.schuljahr, tx);
        if (!inhalt) return { geloescht: 0, uebernahmeFehlt: true };
        const hash = archivinhaltsHash(inhalt);
        const paket = await tx.archivpaket.findUnique({
          where: { bezirkId_schuljahr: { bezirkId: kandidat.bezirkId, schuljahr: kandidat.schuljahr } },
          select: { id: true, inhaltsHash: true },
        });
        const uebernahme = paket && paket.inhaltsHash === hash
          ? await tx.archivuebernahme.findFirst({ where: { archivpaketId: paket.id, inhaltsHash: hash }, select: { id: true } })
          : null;
        if (!uebernahme) return { geloescht: 0, uebernahmeFehlt: true };

        const geloescht = await tx.fortbildung.deleteMany({
          where: { AND: [{ bezirkId: kandidat.bezirkId }, schuljahrWhere(kandidat.schuljahr), { aufbewahrenBis: { lte: jetzt } }] },
        });
        await tx.auditLog.create({
          data: { aktion: "DELETE", entitaet: "FortbildungArchiv", details: { bezirkId: kandidat.bezirkId, schuljahr: kandidat.schuljahr, anzahl: geloescht.count, archivpaketId: paket!.id, inhaltsHash: hash } },
        });
        return { geloescht: geloescht.count, uebernahmeFehlt: false };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30_000 });
      operativGeloescht += resultat.geloescht;
      if (resultat.uebernahmeFehlt) fehlendeArchivuebernahmen += 1;
    } catch (error) {
      // Ein Konkurrenzkonflikt lässt die Kohorte unverändert und wird im
      // nächsten Cron-Lauf erneut geprüft.
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034")) throw error;
    }
  }

  const [protokolle, importe] = await prisma.$transaction([
    prisma.auditLog.deleteMany({ where: { at: { lt: vorTagen(PROTOKOLL_NACH_TAGEN) } } }),
    prisma.fibsImportJob.deleteMany({ where: { startedAt: { lt: vorTagen(PROTOKOLL_NACH_TAGEN) } } }),
  ]);

  await prisma.systemSetting.upsert({
    where: { id: "lastRetentionRun" },
    update: { value: jetzt.toISOString() },
    create: { id: "lastRetentionRun", value: jetzt.toISOString() },
  });

  await prisma.systemSetting.upsert({
    where: { id: "lastRetentionResult" },
    update: { value: JSON.stringify({ gelaufenAm: jetzt.toISOString(), operativGeloescht, fehlendeArchivuebernahmen }) },
    create: { id: "lastRetentionResult", value: JSON.stringify({ gelaufenAm: jetzt.toISOString(), operativGeloescht, fehlendeArchivuebernahmen }) },
  });

  console.log(`[Löschlauf] operativ gelöscht: ${operativGeloescht}, fehlende Übergaben: ${fehlendeArchivuebernahmen}, Protokolle: ${protokolle.count}, Import-Läufe: ${importe.count}`);
  return { archiviert: 0, operativGeloescht, fehlendeArchivuebernahmen, referentenZuordnungenGeloescht: 0, protokolleGeloescht: protokolle.count, importLaeufeGeloescht: importe.count, gelaufenAm: jetzt };
}

export async function letzterLauf(): Promise<Date | null> {
  const eintrag = await prisma.systemSetting.findUnique({ where: { id: "lastRetentionRun" } });
  return eintrag ? new Date(eintrag.value) : null;
}
