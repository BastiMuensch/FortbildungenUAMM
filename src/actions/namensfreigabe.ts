"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuthError, ERFASSER, referentScope, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { leseNamensentscheidung } from "@/lib/namensfreigabe";
import { sperreNamensfreigabe, schreibeNamensfreigabe } from "@/lib/namensfreigabeSpeicher";
import type { FormularState } from "@/lib/validation/fortbildung";

export interface NamensfreigabeState extends FormularState {
  stand?: number;
  sichtbar?: boolean;
}

export async function speichereNamensfreigabe(
  _bisher: NamensfreigabeState,
  formData: FormData,
): Promise<NamensfreigabeState> {
  let user;
  try {
    user = await requireRole(...ERFASSER);
  } catch (fehler) {
    if (fehler instanceof AuthError) return { fehler: { _: fehler.message } };
    throw fehler;
  }
  if (!user.referentId) return { fehler: { _: "Diesem Konto ist kein Referenteneintrag zugeordnet." } };
  const entscheidung = leseNamensentscheidung(formData);
  if (!entscheidung.success) return { fehler: { namensfreigabe: entscheidung.error.issues[0]!.message } };
  const stand = z.coerce.number().int().nonnegative().safeParse(formData.get("namensfreigabeStand"));
  if (!stand.success) return { fehler: { _: "Bitte die Seite neu laden und erneut entscheiden." } };

  const ergebnis = await prisma.$transaction(async (tx): Promise<NamensfreigabeState> => {
    await sperreNamensfreigabe(tx, user.referentId!);
    const referent = await tx.referent.findFirst({
      // Niemals eine Referenten-ID aus dem Formular als Identität verwenden.
      where: { id: user.referentId!, userId: user.id, aktiv: true, user: { isActive: true } },
      select: { namensfreigabeStand: true },
    });
    if (!referent) return { fehler: { _: "Für diesen Referenteneintrag fehlt die Berechtigung." } };
    if (entscheidung.data.zustimmung && referent.namensfreigabeStand !== stand.data) {
      return { fehler: { _: "Ihre Einstellung wurde zwischenzeitlich geändert. Bitte die Seite neu laden, bevor Sie erneut zustimmen." } };
    }
    return {
      erfolg: true,
      meldung: entscheidung.data.zustimmung
        ? "Die öffentliche Namensanzeige ist freigegeben."
        : "Ihr Name wird künftig nicht mehr öffentlich ausgegeben. Bereits heruntergeladene oder gedruckte Kopien bleiben davon unberührt.",
      ...await schreibeNamensfreigabe(tx, user.referentId!, user.id, entscheidung.data.zustimmung ? "ERTEILT" : "WIDERRUFEN"),
    };
  });
  if (ergebnis.erfolg) revalidatePath("/", "layout");
  return ergebnis;
}

/** Die Verwaltung darf die Anzeige stoppen, aber niemals stellvertretend zustimmen. */
export async function stoppeNamensfreigabe(
  referentId: string,
  _bisher: FormularState,
  _formData: FormData,
): Promise<FormularState> {
  let user;
  try {
    user = await requireRole("RVS", "ADMIN");
  } catch (fehler) {
    if (fehler instanceof AuthError) return { fehler: { _: fehler.message } };
    throw fehler;
  }
  const ergebnis = await prisma.$transaction(async (tx): Promise<FormularState> => {
    await sperreNamensfreigabe(tx, referentId);
    const referent = await tx.referent.findFirst({
      where: { AND: [{ id: referentId }, referentScope(user)] },
      select: { id: true },
    });
    if (!referent) return { fehler: { _: "Für diese Person fehlt die Berechtigung." } };
    await schreibeNamensfreigabe(tx, referent.id, user.id, "GESTOPPT");
    return { erfolg: true, meldung: "Die Namensanzeige wurde portalweit gestoppt. Nur die Person selbst kann erneut zustimmen." };
  });
  if (ergebnis.erfolg) revalidatePath("/", "layout");
  return ergebnis;
}
