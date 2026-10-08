"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuthError, requireRole } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { normalisiereUnterschrift, UnterschriftsBildFehler } from "@/lib/unterschriftBild";
import type { FormularState } from "@/lib/validation/fortbildung";

/** BdBs verwalten nur ihre eigene Unterschrift; die RvS darf alle verwalten. */
export async function speichereUnterschrift(
  userId: string,
  _bisher: FormularState,
  formulardaten: FormData,
): Promise<FormularState> {
  let person;
  try { person = await requireRole("RVS", "ADMIN"); } catch (fehler) {
    if (fehler instanceof AuthError) return { fehler: { _: fehler.message } };
    throw fehler;
  }
  if (!z.string().uuid().safeParse(userId).success || (person.role !== "RVS" && person.id !== userId)) {
    return { fehler: { _: "Sie dürfen diese Unterschrift nicht verwalten." } };
  }
  const konto = await prisma.user.findFirst({ where: { id: userId, role: "ADMIN", isActive: true }, select: { id: true } });
  if (!konto) return { fehler: { _: "Das aktive BdB-Konto wurde nicht gefunden." } };
  if (formulardaten.get("freigabe") !== "on") {
    return { fehler: { _: "Bitte die Verwendung der Unterschrift für Teilnahmebescheinigungen bestätigen." } };
  }
  const datei = formulardaten.get("unterschrift");
  if (!(datei instanceof File)) return { fehler: { _: "Bitte eine PNG- oder JPEG-Datei auswählen." } };
  let bildPng;
  try { bildPng = await normalisiereUnterschrift(datei); } catch (fehler) {
    if (fehler instanceof UnterschriftsBildFehler) return { fehler: { _: fehler.message } };
    throw fehler;
  }
  await prisma.bdbUnterschrift.upsert({ where: { userId }, create: { userId, bildPng }, update: { bildPng } });
  await auditLog({ userId: person.id, aktion: "UPDATE", entitaet: "BdbUnterschrift", entitaetId: userId });
  revalidatePath("/admin/unterschriften");
  return { erfolg: true, meldung: "Unterschrift gespeichert. Sie wird in neuen Teilnahmebescheinigungen verwendet." };
}

export async function entferneUnterschrift(userId: string, _bisher: FormularState): Promise<FormularState> {
  let person;
  try { person = await requireRole("RVS", "ADMIN"); } catch (fehler) {
    if (fehler instanceof AuthError) return { fehler: { _: fehler.message } };
    throw fehler;
  }
  if (!z.string().uuid().safeParse(userId).success || (person.role !== "RVS" && person.id !== userId)) {
    return { fehler: { _: "Sie dürfen diese Unterschrift nicht verwalten." } };
  }
  // Entfernen ist auch bei einem inzwischen deaktivierten Konto möglich.
  const konto = await prisma.user.findFirst({ where: { id: userId, role: "ADMIN" }, select: { id: true } });
  if (!konto) return { fehler: { _: "Das BdB-Konto wurde nicht gefunden." } };
  await prisma.bdbUnterschrift.deleteMany({ where: { userId } });
  await auditLog({ userId: person.id, aktion: "DELETE", entitaet: "BdbUnterschrift", entitaetId: userId });
  revalidatePath("/admin/unterschriften");
  return { erfolg: true, meldung: "Unterschrift entfernt. Bereits heruntergeladene PDFs bleiben unverändert." };
}
