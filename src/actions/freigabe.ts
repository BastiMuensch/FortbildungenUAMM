"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { AuthError, requireRole } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { pruefeVeroeffentlichung } from "@/lib/validation/fortbildung";
import type { FormularState } from "@/lib/validation/fortbildung";

/**
 * Freigabe von Fortbildungen.
 *
 * Referentinnen und Referenten reichen ein (Status EINGEREICHT), die
 * Administration gibt frei oder weist mit Begründung zurück. Alle Aktionen
 * hier sind ausschließlich ADMINs vorbehalten — die Prüfung steht in jeder
 * Funktion, weil Server Actions eigene Endpunkte sind.
 */

function alleFrischMachen() {
  revalidatePath("/admin");
  revalidatePath("/admin/freigaben");
  revalidatePath("/fortbildungen");
  revalidatePath("/kalender");
}

export async function freigeben(id: string): Promise<void> {
  const user = await requireRole("ADMIN");

  const fortbildung = await prisma.fortbildung.findUnique({
    where: { id },
    select: {
      titel: true,
      status: true,
      niveaustufe: true,
      kompetenzen: { select: { kompetenzCode: true } },
      referenten: { select: { referentId: true } },
    },
  });
  // Die Aktion ist ein echter Statusübergang, keine allgemeine
  // Veröffentlichungs-API: nur eingereichte Fortbildungen dürfen diesen Weg
  // durchlaufen. Das schützt auch gegen direkt aufgerufene Server Actions.
  if (!fortbildung || fortbildung.status !== "EINGEREICHT") return;

  // Dieselben Vollständigkeitsregeln wie beim direkten Veröffentlichen —
  // sonst käme über die Freigabe eine lückenhafte Ausschreibung ins Frontend.
  const luecken = pruefeVeroeffentlichung({
    status: "VEROEFFENTLICHT",
    niveaustufe: fortbildung.niveaustufe,
    kompetenzen: fortbildung.kompetenzen.map((k) => k.kompetenzCode),
    referenten: fortbildung.referenten.map((r) => r.referentId),
  });

  if (luecken) {
    // Kein stiller Abbruch: Die Notiz erklärt der einreichenden Person, was
    // fehlt, und der Status fällt zurück auf Entwurf.
    await prisma.fortbildung.updateMany({
      where: { id, status: "EINGEREICHT" },
      data: {
        status: "ENTWURF",
        freigabeNotiz: `Freigabe nicht möglich: ${Object.values(luecken).join(" ")}`,
      },
    });
    alleFrischMachen();
    return;
  }

  const veroeffentlicht = await prisma.fortbildung.updateMany({
    where: { id, status: "EINGEREICHT" },
    data: {
      status: "VEROEFFENTLICHT",
      freigegebenAm: new Date(),
      freigegebenVonId: user.id,
      freigabeNotiz: null,
    },
  });

  if (veroeffentlicht.count === 0) return;

  await auditLog({
    userId: user.id,
    aktion: "UPDATE",
    entitaet: "Fortbildung",
    entitaetId: id,
    details: { freigegeben: true, titel: fortbildung.titel },
  });

  alleFrischMachen();
}

const ZurueckweisenSchema = z
  .string()
  .trim()
  .min(5, "Bitte kurz begründen, was noch fehlt.")
  .max(1000, "Die Begründung ist zu lang.");

export async function zurueckweisen(
  id: string,
  _bisher: FormularState,
  formData: FormData,
): Promise<FormularState> {
  let user;
  try {
    user = await requireRole("ADMIN");
  } catch (error) {
    if (error instanceof AuthError) return { fehler: { _: error.message } };
    throw error;
  }

  const notiz = ZurueckweisenSchema.safeParse(formData.get("notiz") ?? "");
  if (!notiz.success) {
    return { fehler: { notiz: notiz.error.issues[0]!.message } };
  }

  const zurueckgewiesen = await prisma.fortbildung.updateMany({
    where: { id, status: "EINGEREICHT" },
    data: {
      status: "ENTWURF",
      freigabeNotiz: notiz.data,
      eingereichtAm: null,
    },
  });

  if (zurueckgewiesen.count === 0) {
    return { fehler: { _: "Diese Fortbildung wartet nicht mehr auf Freigabe." } };
  }

  await auditLog({
    userId: user.id,
    aktion: "UPDATE",
    entitaet: "Fortbildung",
    entitaetId: id,
    details: { zurueckgewiesen: true },
  });

  alleFrischMachen();
  return { erfolg: true, meldung: "Zurück an die einreichende Person." };
}

/**
 * Markiert, ob die Fortbildung tatsächlich in FIBS ausgeschrieben ist.
 *
 * Bewusst ein eigener Schritt und nicht aus der Lehrgangsnummer abgeleitet:
 * Eine Nummer kann vorgemerkt sein, lange bevor der Eintrag in FIBS steht.
 */
export async function fibsStatusSetzen(id: string, inFibs: boolean): Promise<void> {
  const user = await requireRole("ADMIN");

  const aktualisiert = await prisma.fortbildung.updateMany({
    where: { id, status: "VEROEFFENTLICHT" },
    data: {
      inFibs,
      fibsEingetragenAm: inFibs ? new Date() : null,
      fibsEingetragenVonId: inFibs ? user.id : null,
    },
  });

  if (aktualisiert.count === 0) return;

  await auditLog({
    userId: user.id,
    aktion: "UPDATE",
    entitaet: "Fortbildung",
    entitaetId: id,
    details: { inFibs },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/fortbildungen/${id}`);
}
