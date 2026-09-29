"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { erstelleTagesDatensicherung, ladeDatensicherungsUebersicht } from "@/lib/datensicherung";
import { datensicherungsHinweis, type Sicherungshinweis } from "@/lib/datensicherungsHinweis";

export type DatensicherungsState = { erfolg?: boolean; meldung?: string; fehler?: string };

const AblageSchema = z.object({
  id: z.string().uuid(),
  sha256: z.string().trim().toLowerCase().regex(/^[a-f0-9]{64}$/, "Bitte die SHA-256-Prüfsumme der Datei auf dem Netzlaufwerk eintragen."),
  externeAblage: z.string().trim().min(5, "Bitte den dienstlichen Ablageort angeben.").max(500),
  ablageBestaetigt: z.literal("on", { error: "Bitte die Ablage auf dem Regierungslaufwerk bestätigen." }),
});

export async function bereiteTagesDatensicherungVor(_bisher: DatensicherungsState, _formData: FormData): Promise<DatensicherungsState> {
  void _formData;
  try { await requireRole("RVS"); } catch { return { fehler: "Nur Regierungskonten mit bestätigter Anmeldung dürfen Vollbackups erstellen." }; }
  try {
    const paket = await erstelleTagesDatensicherung();
    revalidatePath("/admin/datensicherung");
    return { erfolg: true, meldung: paket ? "Das heutige verschlüsselte Vollbackup steht zum Download bereit." : "Eine Sicherung wird bereits erstellt. Bitte den Stand gleich erneut prüfen." };
  } catch {
    revalidatePath("/admin/datensicherung");
    return { fehler: "Die Sicherung konnte nicht erstellt werden. Bitte Konfiguration, Speicherplatz und Betriebsprotokoll prüfen." };
  }
}

/** Nur eine explizite, prüfsummengestützte Erklärung zählt als externe Ablage. */
export async function bestaetigeDatensicherungsAblage(_bisher: DatensicherungsState, formData: FormData): Promise<DatensicherungsState> {
  let user;
  try { user = await requireRole("RVS"); } catch { return { fehler: "Nur Regierungskonten dürfen die Ablage bestätigen." }; }
  const eingabe = AblageSchema.safeParse(Object.fromEntries(formData));
  if (!eingabe.success) return { fehler: eingabe.error.issues[0]?.message ?? "Bitte alle Angaben prüfen." };
  const paket = await prisma.datensicherung.findUnique({ where: { id: eingabe.data.id } });
  if (!paket || paket.status !== "BEREIT" || paket.sha256 !== eingabe.data.sha256) {
    return { fehler: "Die Prüfsumme passt nicht zu diesem Vollbackup. Bitte die Datei auf dem Netzlaufwerk prüfen." };
  }
  if (paket.abgelegtAm) return { erfolg: true, meldung: "Die Ablage dieses Vollbackups wurde bereits bestätigt." };
  // Auch ein inzwischen vom Server bereinigtes Paket darf nachträglich bestätigt
  // werden. Seine Metadaten und die tatsächliche externe Kopie bleiben maßgeblich.
  try {
    await prisma.$transaction(async (tx) => {
      const ergebnis = await tx.datensicherung.updateMany({
        where: { id: paket.id, status: "BEREIT", sha256: eingabe.data.sha256, abgelegtAm: null },
        data: { abgelegtAm: new Date(), abgelegtVonId: user.id, externeAblage: eingabe.data.externeAblage },
      });
      if (ergebnis.count) await tx.auditLog.create({ data: {
        userId: user.id, aktion: "UPDATE", entitaet: "DatensicherungsAblage", entitaetId: paket.id,
        details: { tag: paket.tag, sha256: eingabe.data.sha256 },
      } });
    });
    revalidatePath("/admin", "layout");
    return { erfolg: true, meldung: "Die Ablage auf dem Regierungslaufwerk ist dokumentiert. Eine Wiederherstellungsprobe bleibt ein eigener Prüfschritt." };
  } catch { return { fehler: "Die Ablagebestätigung konnte nicht gespeichert werden. Bitte erneut versuchen." }; }
}

/** Aktualisiert den Hinweis auch in lange geöffneten Regierungsansichten. */
export async function ladeTagesSicherungshinweis(): Promise<Sicherungshinweis> {
  await requireRole("RVS");
  const stand = await ladeDatensicherungsUebersicht();
  return datensicherungsHinweis(stand.konfiguriert, stand.pakete);
}
