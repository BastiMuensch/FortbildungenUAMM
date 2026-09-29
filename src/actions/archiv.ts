"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole, bezirkScope } from "@/lib/auth";
import { archivinhaltsHash, ladeArchivInhalt, paketkennung } from "@/lib/archiv";
import { prisma } from "@/lib/prisma";
import { parseSchuljahr } from "@/lib/schuljahr";

export type ArchivState = { erfolg?: true; meldung?: string; fehler?: string };

const UebernahmeSchema = z.object({
  bezirkId: z.string().uuid(),
  schuljahr: z.string().trim(),
  paketkennung: z.string().trim().min(12).max(160),
  inhaltsHash: z.string().regex(/^[a-f0-9]{64}$/),
  externeAblage: z.string().trim().min(5, "Bitte die getrennte externe Ablage benennen.").max(500),
  lesbarkeitBestaetigt: z.literal("on"),
});
const NachfristSchema = z.object({ bezirkId: z.string().uuid(), schuljahr: z.string(), begruendung: z.string().trim().min(10).max(1000) });

async function nachfristGueltig(bezirkId: string, schuljahr: number, jetzt = new Date()) {
  return prisma.archivnachfristFreigabe.findFirst({ where: { bezirkId, schuljahr, gueltigBis: { gt: jetzt } }, select: { id: true } });
}

async function berechtigterBezirk(bezirkId: string) {
  const user = await requireRole("RVS", "ADMIN");
  const bezirk = await prisma.bezirk.findFirst({
    where: { AND: [{ id: bezirkId }, bezirkScope(user)] },
    select: { id: true },
  });
  if (!bezirk) throw new Error("Für diesen Bezirk fehlt die Berechtigung.");
  return user;
}

/** Erstellt bzw. aktualisiert die Paketmetadaten. Die Bytes entstehen erst beim Download. */
export async function bereiteArchivpaketVor(
  _bisher: ArchivState,
  bezirkId: string,
  schuljahrText: string,
): Promise<ArchivState> {
  const schuljahr = parseSchuljahr(schuljahrText);
  if (schuljahr === null) return { fehler: "Bitte ein gültiges Schuljahr auswählen." };
  let user;
  try { user = await berechtigterBezirk(bezirkId); } catch (error) {
    return { fehler: error instanceof Error ? error.message : "Nicht berechtigt." };
  }

  const inhalt = await ladeArchivInhalt(bezirkId, schuljahr);
  if (!inhalt) return { fehler: "Der Bezirk existiert nicht mehr." };
  if (inhalt.fortbildungen.some((f) => new Date(f.aufbewahrenBis) <= new Date()) && !await nachfristGueltig(bezirkId, schuljahr)) {
    return { fehler: "Nach Fristablauf ist zuerst eine begründete, zeitlich begrenzte RvS-Freigabe erforderlich." };
  }
  const inhaltsHash = archivinhaltsHash(inhalt);
  const kennung = paketkennung(bezirkId, schuljahr, inhaltsHash);

  await prisma.archivpaket.upsert({
    where: { bezirkId_schuljahr: { bezirkId, schuljahr } },
    create: { bezirkId, schuljahr, paketkennung: kennung, inhaltsHash, anzahl: inhalt.fortbildungen.length, erstelltVonId: user.id },
    update: { paketkennung: kennung, inhaltsHash, anzahl: inhalt.fortbildungen.length, erstelltVonId: user.id, erstelltAm: new Date() },
  });
  revalidatePath("/admin/archiv");
  return { erfolg: true, meldung: "Paket ist vorbereitet und kann heruntergeladen werden." };
}

/** RvS erlaubt einen verspäteten Paketdownload für genau eine Kohorte für sieben Tage. */
export async function erteileArchivnachfrist(_bisher: ArchivState, formData: FormData): Promise<ArchivState> {
  const eingabe = NachfristSchema.safeParse({ bezirkId: formData.get("bezirkId"), schuljahr: formData.get("schuljahr"), begruendung: formData.get("begruendung") });
  if (!eingabe.success) return { fehler: eingabe.error.issues[0]?.message ?? "Ungültige Nachfrist." };
  const schuljahr = parseSchuljahr(eingabe.data.schuljahr); if (schuljahr === null) return { fehler: "Ungültiges Schuljahr." };
  let user; try { user = await requireRole("RVS"); } catch { return { fehler: "Nur die RvS kann eine Nachfrist erteilen." }; }
  const bezirk = await prisma.bezirk.findUnique({ where: { id: eingabe.data.bezirkId }, select: { id: true } }); if (!bezirk) return { fehler: "Bezirk nicht gefunden." };
  const gueltigBis = new Date(Date.now() + 7 * 86_400_000);
  await prisma.$transaction([
    prisma.archivnachfristFreigabe.upsert({ where: { bezirkId_schuljahr: { bezirkId: bezirk.id, schuljahr } }, create: { bezirkId: bezirk.id, schuljahr, begruendung: eingabe.data.begruendung, gueltigBis, erteiltVonId: user.id }, update: { begruendung: eingabe.data.begruendung, gueltigBis, erteiltAm: new Date(), erteiltVonId: user.id } }),
    prisma.auditLog.create({ data: { userId: user.id, aktion: "CREATE", entitaet: "Archivnachfrist", details: { bezirkId: bezirk.id, schuljahr, gueltigBis: gueltigBis.toISOString(), begruendung: eingabe.data.begruendung } } }),
  ]);
  revalidatePath("/admin/archiv"); return { erfolg: true, meldung: "Nachfrist für sieben Tage erteilt." };
}

/**
 * Protokolliert eine eigenständige, manuell bestätigte externe Übernahme.
 * Hash und Paketkennung werden vor der Speicherung erneut gegen die aktuelle
 * Datenbasis geprüft; damit lässt sich kein alter Download bestätigen.
 */
export async function bestaetigeArchivuebernahme(
  _bisher: ArchivState,
  formData: FormData,
): Promise<ArchivState> {
  const eingabe = UebernahmeSchema.safeParse({
    bezirkId: formData.get("bezirkId"), schuljahr: formData.get("schuljahr"),
    paketkennung: formData.get("paketkennung"), inhaltsHash: formData.get("inhaltsHash"),
    externeAblage: formData.get("externeAblage"), lesbarkeitBestaetigt: formData.get("lesbarkeitBestaetigt"),
  });
  if (!eingabe.success) return { fehler: eingabe.error.issues[0]?.message ?? "Ungültige Archivübergabe." };
  const schuljahr = parseSchuljahr(eingabe.data.schuljahr);
  if (schuljahr === null) return { fehler: "Ungültiges Schuljahr." };

  let user;
  try { user = await berechtigterBezirk(eingabe.data.bezirkId); } catch (error) {
    return { fehler: error instanceof Error ? error.message : "Nicht berechtigt." };
  }

  try {
    const ergebnis = await prisma.$transaction(async (tx) => {
      const inhalt = await ladeArchivInhalt(eingabe.data.bezirkId, schuljahr, tx);
      if (!inhalt) return { fehler: "Der Bezirk existiert nicht mehr." };
      const aktuell = archivinhaltsHash(inhalt);
      const erwarteteKennung = paketkennung(eingabe.data.bezirkId, schuljahr, aktuell);
      if (aktuell !== eingabe.data.inhaltsHash || erwarteteKennung !== eingabe.data.paketkennung) {
        return { fehler: "Die Daten haben sich seit dem Download geändert. Bitte ein neues Paket herunterladen." };
      }
      const paket = await tx.archivpaket.upsert({
        where: { bezirkId_schuljahr: { bezirkId: eingabe.data.bezirkId, schuljahr } },
        create: { bezirkId: eingabe.data.bezirkId, schuljahr, paketkennung: erwarteteKennung, inhaltsHash: aktuell, anzahl: inhalt.fortbildungen.length, erstelltVonId: user.id },
        update: { paketkennung: erwarteteKennung, inhaltsHash: aktuell, anzahl: inhalt.fortbildungen.length },
      });
      const vorhanden = await tx.archivuebernahme.findFirst({
        where: { archivpaketId: paket.id, inhaltsHash: aktuell }, select: { id: true },
      });
      if (vorhanden) return { erfolg: true as const, meldung: "Diese Paketversion wurde bereits bestätigt." };
      await tx.archivuebernahme.create({
        data: { archivpaketId: paket.id, externeAblage: eingabe.data.externeAblage, bestaetigtVonId: user.id, inhaltsHash: aktuell },
      });
      await tx.auditLog.create({ data: { userId: user.id, aktion: "CREATE", entitaet: "Archivuebernahme", entitaetId: paket.id, details: { bezirkId: eingabe.data.bezirkId, schuljahr, paketkennung: erwarteteKennung, inhaltsHash: aktuell } } });
      return { erfolg: true as const, meldung: "Externe Ablage und Lesbarkeit sind protokolliert." };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30_000 });
    revalidatePath("/admin/archiv");
    return ergebnis;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return { fehler: "Die Archivübergabe lief gleichzeitig in einem anderen Vorgang. Bitte erneut prüfen." };
    }
    throw error;
  }
}
