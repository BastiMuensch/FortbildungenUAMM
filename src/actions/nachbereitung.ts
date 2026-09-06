"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { AuthError, darfBearbeiten, requireRole, type SessionUser } from "@/lib/auth";
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

const BestaetigungsVersandSchema = z.object({
  empfaenger: z.enum(["REFERENTEN", "TEILNEHMENDE"]),
  versandt: z.boolean(),
});

/**
 * Meldet die tatsächliche Teilnehmerzahl einer bereits gelaufenen Veranstaltung.
 *
 * Ausschließlich die Administration sowie Referentinnen und Referenten für
 * eigene beziehungsweise zugeordnete SchiLf dürfen Teilnehmerzahlen melden.
 * Redaktion hat dafür bewusst keine Berechtigung.
 */
export async function meldeTeilnehmerzahl(
  id: string,
  _bisher: FormularState,
  formData: FormData,
): Promise<FormularState> {
  let user;
  try {
    user = await requireRole("ADMIN", "REFERENT");
  } catch (error) {
    if (error instanceof AuthError) return { fehler: { _: error.message } };
    throw error;
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
    select: { beginn: true, ende: true, maxTn: true, titel: true, organisationsform: true, status: true },
  });
  if (!fortbildung) return { fehler: { _: "Diese Veranstaltung gibt es nicht mehr." } };

  if (!(await darfTeilnehmerzahlMelden(user, id, fortbildung.organisationsform))) {
    return {
      fehler: {
        _: "Teilnehmerzahlen dürfen nur von der Administration oder von Referent:innen für eigene SchiLf gemeldet werden.",
      },
    };
  }

  if (fortbildung.status === "ABGESAGT") {
    return { fehler: { _: "Für abgesagte Veranstaltungen gibt es keine Teilnehmerzahl." } };
  }

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
  revalidatePath(`/admin/fortbildungen/${id}`);
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
  const user = await requireRole("ADMIN", "REFERENT");
  const fortbildung = await prisma.fortbildung.findUnique({
    where: { id },
    select: { organisationsform: true, ende: true, status: true },
  });
  if (
    !fortbildung ||
    fortbildung.ende > new Date() ||
    fortbildung.status === "ABGESAGT" ||
    !(await darfTeilnehmerzahlMelden(user, id, fortbildung.organisationsform))
  ) {
    return;
  }

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
  revalidatePath(`/admin/fortbildungen/${id}`);
  revalidatePath("/admin");
}

/**
 * Bestätigt getrennt den Versand der FIBS-Teilnahmebestätigungen. Es werden
 * keine Empfängerlisten oder FIBS-Nachrichten gespeichert, nur der Vermerk
 * inklusive Zeitpunkt und administrativem Konto.
 */
export async function setzeTeilnahmebestaetigungsVersand(
  id: string,
  empfaenger: "REFERENTEN" | "TEILNEHMENDE",
  versandt: boolean,
): Promise<void> {
  const admin = await requireRole("ADMIN");
  const geparst = BestaetigungsVersandSchema.safeParse({ empfaenger, versandt });
  if (!geparst.success) return;

  const versand = geparst.data;

  const fortbildung = await prisma.fortbildung.findUnique({
    where: { id },
    select: { ende: true, status: true, tnTatsaechlich: true },
  });
  if (
    !fortbildung ||
    fortbildung.tnTatsaechlich === null ||
    fortbildung.ende > new Date() ||
    fortbildung.status === "ABGESAGT"
  ) {
    return;
  }

  const jetzt = new Date();
  const daten =
    versand.empfaenger === "REFERENTEN"
      ? versand.versandt
        ? {
            teilnahmebestaetigungenReferentenVersandtAm: jetzt,
            teilnahmebestaetigungenReferentenVersandtVonId: admin.id,
          }
        : {
            teilnahmebestaetigungenReferentenVersandtAm: null,
            teilnahmebestaetigungenReferentenVersandtVonId: null,
          }
      : versand.versandt
        ? {
            teilnahmebestaetigungenTeilnehmendeVersandtAm: jetzt,
            teilnahmebestaetigungenTeilnehmendeVersandtVonId: admin.id,
          }
        : {
            teilnahmebestaetigungenTeilnehmendeVersandtAm: null,
            teilnahmebestaetigungenTeilnehmendeVersandtVonId: null,
          };

  await prisma.fortbildung.update({ where: { id }, data: daten });

  await auditLog({
    userId: admin.id,
    aktion: "UPDATE",
    entitaet: "Fortbildung",
    entitaetId: id,
    details: { teilnahmebestaetigung: versand.empfaenger, versandt: versand.versandt },
  });

  revalidatePath("/admin/nachbereitung");
  revalidatePath(`/admin/fortbildungen/${id}`);
  revalidatePath("/admin");
}

async function darfTeilnehmerzahlMelden(
  user: SessionUser,
  fortbildungId: string,
  organisationsform: string,
): Promise<boolean> {
  if (user.role === "ADMIN") return true;
  return (
    user.role === "REFERENT" &&
    organisationsform === "SCHILF" &&
    (await darfBearbeiten(user, fortbildungId))
  );
}
