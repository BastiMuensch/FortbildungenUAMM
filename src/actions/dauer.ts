"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuthError, fortbildungScope, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { formatZeit } from "@/lib/datetime";
import { FortbildungSchema, zuFeldFehlern, type FormularState } from "@/lib/validation/fortbildung";

/** Korrigiert ausschließlich das Ende einer bereits beendeten Fortbildung. */
export async function korrigiereDauer(
  id: string,
  _bisher: FormularState,
  formData: FormData,
): Promise<FormularState> {
  let user;
  try {
    user = await requireRole("RVS", "ADMIN", "REFERENT");
  } catch (error) {
    if (error instanceof AuthError) return { fehler: { _: error.message } };
    throw error;
  }

  const fortbildung = await prisma.fortbildung.findUnique({
    where: { id, AND: [fortbildungScope(user)] },
    select: { beginn: true, ende: true, status: true, updatedAt: true },
  });
  if (!fortbildung) return { fehler: { _: "Kein Zugriff auf diese Fortbildung." } };

  const jetzt = new Date();
  if (!["VEROEFFENTLICHT", "ARCHIVIERT"].includes(fortbildung.status) || fortbildung.ende > jetzt) {
    return { fehler: { _: "Die Dauer lässt sich erst nach Ende einer veröffentlichten oder archivierten Fortbildung korrigieren." } };
  }

  // Die bestehende Terminprüfung gilt auch für nachträgliche Korrekturen.
  const geparst = z.object({ ende: FortbildungSchema.shape.ende }).safeParse({
    ende: formData.get("ende"),
  });
  if (!geparst.success) return { fehler: zuFeldFehlern(geparst.error) };
  const ende = geparst.data.ende;
  const uhrzeit = /(\d{1,2})[:.](\d{2})$/.exec(String(formData.get("ende")).trim());
  if (!uhrzeit || formatZeit(ende) !== `${uhrzeit[1].padStart(2, "0")}:${uhrzeit[2]}`) {
    return { fehler: { ende: "Diese Uhrzeit existiert wegen der Zeitumstellung nicht. Bitte wählen Sie eine andere." } };
  }
  if (ende <= fortbildung.beginn) return { fehler: { ende: "Das Ende muss nach dem Beginn liegen." } };
  if (ende.getTime() - fortbildung.beginn.getTime() > 30 * 24 * 60 * 60 * 1000) {
    return { fehler: { ende: "Ein Lehrgang über mehr als 30 Tage ist vermutlich ein Tippfehler." } };
  }
  if (ende > jetzt) return { fehler: { ende: "Das tatsächliche Ende darf nicht in der Zukunft liegen." } };

  if (formData.get("bisherigesEnde") !== fortbildung.ende.toISOString()) {
    return { fehler: { _: "Die Endzeit wurde inzwischen geändert. Bitte laden Sie die Seite neu." } };
  }
  if (ende.getTime() === fortbildung.ende.getTime()) {
    return { erfolg: true, meldung: "Die Endzeit ist bereits so gespeichert." };
  }

  const aktualisiert = await prisma.fortbildung.updateMany({
    where: {
      id,
      AND: [fortbildungScope(user)],
      updatedAt: fortbildung.updatedAt,
      status: fortbildung.status,
      beginn: fortbildung.beginn,
      ende: fortbildung.ende,
    },
    data: { ende, endeVorKorrektur: fortbildung.ende, dauerKorrigiertAm: jetzt },
  });
  if (aktualisiert.count === 0) return { fehler: { _: "Die Fortbildung wurde inzwischen geändert. Bitte laden Sie die Seite neu." } };

  await auditLog({
    userId: user.id,
    aktion: "UPDATE",
    entitaet: "Fortbildung",
    entitaetId: id,
    details: { dauerKorrigiert: true, felder: ["ende"] },
  });

  // Die Endzeit wird auch in Kalendern, öffentlichen Ansichten und Exporten genutzt.
  revalidatePath("/", "layout");
  return { erfolg: true, meldung: "Die tatsächliche Endzeit wurde gespeichert." };
}
