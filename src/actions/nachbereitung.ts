"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { AuthError, ERFASSER, darfBearbeiten, requireRole } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import type { FormularState } from "@/lib/validation/fortbildung";

const MeldungSchema = z.object({
  tnTatsaechlich: z.coerce
    .number({ message: "Bitte eine Zahl eintragen." })
    .int("Bitte eine ganze Zahl eintragen.")
    .min(0, "Weniger als null Teilnehmende gibt es nicht.")
    .max(2000, "Diese Zahl ist nicht plausibel."),
  tnBemerkung: z
    .string()
    .trim()
    .max(300, "Die Bemerkung ist zu lang.")
    .optional()
    .transform((w) => w || null),
});

/**
 * Meldet die tatsächliche Teilnehmerzahl einer bereits gelaufenen Veranstaltung.
 *
 * Referentinnen und Referenten dürfen das nur für ihre eigenen Termine — die
 * Prüfung läuft über dieselbe Regel wie beim Bearbeiten (fortbildungScope).
 */
export async function meldeTeilnehmerzahl(
  id: string,
  _bisher: FormularState,
  formData: FormData,
): Promise<FormularState> {
  let user;
  try {
    user = await requireRole(...ERFASSER);
  } catch (error) {
    if (error instanceof AuthError) return { fehler: { _: error.message } };
    throw error;
  }

  if (!(await darfBearbeiten(user, id))) {
    return { fehler: { _: "Diese Veranstaltung gehört nicht zu Ihren Terminen." } };
  }

  const geparst = MeldungSchema.safeParse({
    tnTatsaechlich: formData.get("tnTatsaechlich"),
    tnBemerkung: formData.get("tnBemerkung") ?? "",
  });

  if (!geparst.success) {
    const problem = geparst.error.issues[0]!;
    return { fehler: { [problem.path.join(".") || "_"]: problem.message } };
  }

  const fortbildung = await prisma.fortbildung.findUnique({
    where: { id },
    select: { beginn: true, ende: true, maxTn: true, titel: true },
  });
  if (!fortbildung) return { fehler: { _: "Diese Veranstaltung gibt es nicht mehr." } };

  // Eine Zahl für einen Termin, der noch gar nicht stattgefunden hat, ist
  // fast immer ein Versehen.
  if (fortbildung.ende > new Date()) {
    return {
      fehler: {
        _: "Diese Veranstaltung hat noch nicht stattgefunden — eine Teilnehmerzahl lässt sich erst danach melden.",
      },
    };
  }

  await prisma.fortbildung.update({
    where: { id },
    data: {
      tnTatsaechlich: geparst.data.tnTatsaechlich,
      tnBemerkung: geparst.data.tnBemerkung,
      tnGemeldetAm: new Date(),
      tnGemeldetVonId: user.id,
    },
  });

  await auditLog({
    userId: user.id,
    aktion: "UPDATE",
    entitaet: "Fortbildung",
    entitaetId: id,
    details: { tnTatsaechlich: geparst.data.tnTatsaechlich },
  });

  revalidatePath("/admin/nachbereitung");
  revalidatePath("/admin");

  const ueberbucht = geparst.data.tnTatsaechlich > fortbildung.maxTn;

  return {
    erfolg: true,
    meldung: ueberbucht
      ? `${geparst.data.tnTatsaechlich} Teilnehmende gespeichert — mehr als die geplanten ${fortbildung.maxTn} Plätze.`
      : `${geparst.data.tnTatsaechlich} Teilnehmende gespeichert.`,
  };
}

/** Nimmt eine Meldung zurück, etwa nach einem Zahlendreher. */
export async function meldungZuruecknehmen(id: string): Promise<void> {
  const user = await requireRole(...ERFASSER);
  if (!(await darfBearbeiten(user, id))) return;

  await prisma.fortbildung.update({
    where: { id },
    data: {
      tnTatsaechlich: null,
      tnBemerkung: null,
      tnGemeldetAm: null,
      tnGemeldetVonId: null,
    },
  });

  await auditLog({
    userId: user.id,
    aktion: "UPDATE",
    entitaet: "Fortbildung",
    entitaetId: id,
    details: { tnMeldungZurueckgenommen: true },
  });

  revalidatePath("/admin/nachbereitung");
}
