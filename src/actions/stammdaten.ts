"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { AuthError, requireRole } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { zuFeldFehlern, type FormularState } from "@/lib/validation/fortbildung";

/**
 * Stammdaten: Referenten, Schlagworte, Veranstaltungsorte.
 *
 * Alle Aktionen prüfen die Rolle selbst — Server Actions sind eigene
 * Endpunkte, der Guard im Layout schützt sie nicht.
 */

async function rolle() {
  return requireRole("ADMIN", "REDAKTEUR");
}

function alsFehler(error: unknown): FormularState | null {
  return error instanceof AuthError ? { fehler: { _: error.message } } : null;
}

// ---------------------------------------------------------------------------
// Referenten
// ---------------------------------------------------------------------------

const ReferentSchema = z.object({
  vorname: z.string().trim().min(1, "Bitte den Vornamen angeben.").max(80),
  nachname: z.string().trim().min(1, "Bitte den Nachnamen angeben.").max(80),
  organisation: z.string().trim().max(120).optional().transform((w) => w || null),
  email: z
    .string()
    .trim()
    .optional()
    .transform((w) => w || null)
    .refine(
      (w) => w === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(w),
      "Bitte eine gültige E-Mail-Adresse eingeben.",
    ),
  telefon: z.string().trim().max(40).optional().transform((w) => w || null),
  notiz: z.string().trim().max(1000).optional().transform((w) => w || null),
  oeffentlichSichtbar: z.coerce.boolean().default(false),
});

export async function speichereReferent(
  id: string | null,
  _bisher: FormularState,
  formData: FormData,
): Promise<FormularState> {
  let user;
  try {
    user = await rolle();
  } catch (error) {
    const fehler = alsFehler(error);
    if (fehler) return fehler;
    throw error;
  }

  const geparst = ReferentSchema.safeParse({
    vorname: formData.get("vorname") ?? "",
    nachname: formData.get("nachname") ?? "",
    organisation: formData.get("organisation") ?? "",
    email: formData.get("email") ?? "",
    telefon: formData.get("telefon") ?? "",
    notiz: formData.get("notiz") ?? "",
    oeffentlichSichtbar: formData.get("oeffentlichSichtbar") === "on",
  });

  if (!geparst.success) return { fehler: zuFeldFehlern(geparst.error) };

  if (id) {
    await prisma.referent.update({ where: { id }, data: geparst.data });
  } else {
    const neu = await prisma.referent.create({ data: geparst.data });
    id = neu.id;
  }

  await auditLog({
    userId: user.id,
    aktion: id ? "UPDATE" : "CREATE",
    entitaet: "Referent",
    entitaetId: id,
  });

  revalidatePath("/admin/referenten");
  return { erfolg: true, meldung: "Gespeichert." };
}

/**
 * Referenten werden deaktiviert statt gelöscht, solange sie an Fortbildungen
 * hängen — sonst verlöre die Historie ihre Referentenangabe. Ohne
 * Zuordnungen wird wirklich gelöscht (Art. 17 DSGVO, Recht auf Löschung).
 */
export async function entferneReferent(id: string): Promise<void> {
  const user = await requireRole("ADMIN");

  const anzahl = await prisma.fortbildungReferent.count({ where: { referentId: id } });

  if (anzahl > 0) {
    await prisma.referent.update({ where: { id }, data: { aktiv: false } });
    await auditLog({
      userId: user.id,
      aktion: "UPDATE",
      entitaet: "Referent",
      entitaetId: id,
      details: { deaktiviert: true, zuordnungen: anzahl },
    });
  } else {
    await prisma.referent.delete({ where: { id } });
    await auditLog({
      userId: user.id,
      aktion: "DELETE",
      entitaet: "Referent",
      entitaetId: id,
    });
  }

  revalidatePath("/admin/referenten");
}

// ---------------------------------------------------------------------------
// Schlagworte
// ---------------------------------------------------------------------------

export async function speichereSchlagwort(
  _bisher: FormularState,
  formData: FormData,
): Promise<FormularState> {
  try {
    await rolle();
  } catch (error) {
    const fehler = alsFehler(error);
    if (fehler) return fehler;
    throw error;
  }

  const name = (formData.get("name") ?? "").toString().trim();
  if (name.length < 2) {
    return { fehler: { name: "Ein Schlagwort braucht mindestens 2 Zeichen." } };
  }

  const vorhanden = await prisma.schlagwort.findUnique({ where: { name } });
  if (vorhanden) return { fehler: { name: "Dieses Schlagwort gibt es bereits." } };

  await prisma.schlagwort.create({ data: { name } });
  revalidatePath("/admin/schlagworte");
  return { erfolg: true, meldung: `„${name}" wurde angelegt.` };
}

/** Steuert, mit welchen Begriffen der FIBS-Import sucht. */
export async function setzeFibsSuche(id: string, aktiv: boolean): Promise<void> {
  await rolle();
  await prisma.schlagwort.update({ where: { id }, data: { fuerFibsImport: aktiv } });
  revalidatePath("/admin/schlagworte");
}

export async function entferneSchlagwort(id: string): Promise<void> {
  const user = await requireRole("ADMIN");

  const schlagwort = await prisma.schlagwort.findUnique({ where: { id } });
  // Pflicht-Schlagworte sind Teil der fachlichen Festlegung des Schulamts und
  // werden von der Server Action ohnehin immer wieder angehängt.
  if (!schlagwort || schlagwort.istPflicht) return;

  await prisma.schlagwort.delete({ where: { id } });
  await auditLog({
    userId: user.id,
    aktion: "DELETE",
    entitaet: "Schlagwort",
    entitaetId: id,
    details: { name: schlagwort.name },
  });

  revalidatePath("/admin/schlagworte");
}

// ---------------------------------------------------------------------------
// Veranstaltungsorte
// ---------------------------------------------------------------------------

const OrtSchema = z.object({
  name: z.string().trim().min(2, "Bitte den Namen des Ortes angeben.").max(150),
  ort: z.string().trim().max(100).optional().transform((w) => w || null),
  strasse: z.string().trim().max(150).optional().transform((w) => w || null),
  schulnummer: z.string().trim().max(20).optional().transform((w) => w || null),
});

export async function speichereOrt(
  _bisher: FormularState,
  formData: FormData,
): Promise<FormularState> {
  try {
    await rolle();
  } catch (error) {
    const fehler = alsFehler(error);
    if (fehler) return fehler;
    throw error;
  }

  const geparst = OrtSchema.safeParse({
    name: formData.get("name") ?? "",
    ort: formData.get("ort") ?? "",
    strasse: formData.get("strasse") ?? "",
    schulnummer: formData.get("schulnummer") ?? "",
  });

  if (!geparst.success) return { fehler: zuFeldFehlern(geparst.error) };

  const vorhanden = await prisma.veranstaltungsort.findFirst({
    where: { name: geparst.data.name, ort: geparst.data.ort },
  });
  if (vorhanden) return { fehler: { name: "Diesen Ort gibt es bereits." } };

  await prisma.veranstaltungsort.create({ data: geparst.data });
  revalidatePath("/admin/orte");
  return { erfolg: true, meldung: `„${geparst.data.name}" wurde angelegt.` };
}

/**
 * Orte werden nur stillgelegt, nie gelöscht: An ihnen hängen vergangene
 * Fortbildungen, deren Ortsangabe erhalten bleiben muss.
 */
export async function setzeOrtAktiv(id: string, aktiv: boolean): Promise<void> {
  await rolle();
  await prisma.veranstaltungsort.update({ where: { id }, data: { aktiv } });
  revalidatePath("/admin/orte");
}
