"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { hatOffeneRechtstextAngaben } from "@/lib/validation/systemtext";
import type { FormularState } from "@/lib/validation/fortbildung";

/** Erlaubte Schlüssel — verhindert, dass über das Formular beliebige
 *  Systemwerte (etwa lastRetentionRun) überschrieben werden. */
const ERLAUBT = new Set(["impressum", "datenschutz"]);

export async function speichereSystemtext(
  id: string,
  _bisher: FormularState,
  formData: FormData,
): Promise<FormularState> {
  const user = await requireRole("RVS");

  if (!ERLAUBT.has(id)) {
    return { fehler: { _: "Dieser Text kann hier nicht bearbeitet werden." } };
  }

  const wert = (formData.get("wert") ?? "").toString().trim();
  if (wert.length < 50) {
    return { fehler: { _: "Bitte einen vollständigen Rechtstext eintragen." } };
  }
  if (wert.length > 100_000) {
    return { fehler: { _: "Der Text ist zu lang." } };
  }
  if (hatOffeneRechtstextAngaben(wert)) {
    return { fehler: { _: "Bitte zuerst die mit [OFFEN: …] markierten Angaben und Platzhalter ergänzen. Speichern veröffentlicht den Text unmittelbar." } };
  }

  await prisma.systemSetting.upsert({
    where: { id },
    update: { value: wert },
    create: { id, value: wert },
  });

  await auditLog({
    userId: user.id,
    aktion: "UPDATE",
    entitaet: "SystemSetting",
    entitaetId: id,
  });

  revalidatePath(`/${id}`);
  revalidatePath("/admin/texte");
  revalidatePath("/admin/einrichtung");

  return { erfolg: true, meldung: "Gespeichert und veröffentlicht." };
}
