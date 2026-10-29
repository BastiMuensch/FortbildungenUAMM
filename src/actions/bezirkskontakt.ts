"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuthError, bezirkScope, requireRole } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { KontaktEmailSchema } from "@/lib/bezirkskontakt";
import { prisma } from "@/lib/prisma";
import { zuFeldFehlern, type FormularState } from "@/lib/validation/fortbildung";

const BezirkskontaktSchema = z.object({
  bezirkId: z.string().uuid("Bitte einen gültigen Bezirk auswählen."),
  kontaktEmail: KontaktEmailSchema,
});

export async function speichereBezirkskontakt(
  bezirkId: string,
  _bisher: FormularState,
  formulardaten: FormData,
): Promise<FormularState> {
  let person;
  try { person = await requireRole("RVS", "ADMIN"); } catch (fehler) {
    if (fehler instanceof AuthError) return { fehler: { _: fehler.message } };
    throw fehler;
  }
  const eingabe = BezirkskontaktSchema.safeParse({ bezirkId, kontaktEmail: formulardaten.get("kontaktEmail") });
  if (!eingabe.success) return { fehler: zuFeldFehlern(eingabe.error) };

  // Bereichsprüfung direkt im Schreibzugriff; übermittelte IDs sind nicht vertrauenswürdig.
  const ergebnis = await prisma.bezirk.updateMany({
    where: { AND: [{ id: eingabe.data.bezirkId, aktiv: true }, bezirkScope(person)] },
    data: { kontaktEmail: eingabe.data.kontaktEmail || null },
  });
  if (!ergebnis.count) return { fehler: { _: "Dieser Bezirk ist nicht aktiv oder Sie sind dafür nicht zuständig." } };

  await auditLog({ userId: person.id, aktion: "UPDATE", entitaet: "Bezirk", entitaetId: bezirkId, details: { felder: ["kontaktEmail"] } });
  revalidatePath("/admin/kontakt");
  revalidatePath("/(schulamt)/[schulamt]", "layout");
  return { erfolg: true, meldung: eingabe.data.kontaktEmail ? "Öffentliche Kontaktadresse gespeichert." : "Öffentliche Kontaktadresse entfernt." };
}
