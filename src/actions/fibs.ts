"use server";

import { revalidatePath } from "next/cache";

import { AuthError, requireRole } from "@/lib/auth";
import { pruefeBezirk } from "@/lib/bezirke";
import { auditLog } from "@/lib/audit";
import { runFibsImport } from "@/lib/fibs/importer";
import type { FibsImportErgebnis } from "@/lib/fibs/types";

export interface ImportState {
  ergebnis?: FibsImportErgebnis;
  fehler?: string;
}

/**
 * Startet einen FIBS-Import.
 *
 * Ohne ausdrückliches Häkchen läuft nur der Trockenlauf: Die Vorschau zeigt,
 * was passieren würde, geschrieben wird nichts. Das echte Übernehmen ist der
 * RvS vorbehalten.
 */
export async function starteFibsImport(
  _bisher: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const uebernehmen = formData.get("uebernehmen") === "on";

  const user = await requireRole("RVS");
  let bezirk;
  try {
    bezirk = await pruefeBezirk(user, String(formData.get("bezirkId") ?? ""));
  } catch (error) {
    if (error instanceof AuthError) return { fehler: error.message };
    throw error;
  }
  const ergebnis = await runFibsImport({ dryRun: !uebernehmen, bezirkId: bezirk.id });

  await auditLog({
    userId: user.id,
    aktion: "IMPORT",
    entitaet: "Fortbildung",
    details: {
      dryRun: ergebnis.dryRun,
      gefunden: ergebnis.gefunden,
      neu: ergebnis.neu,
      aktualisiert: ergebnis.aktualisiert,
      fehler: ergebnis.fehler ?? null,
    },
  });

  if (uebernehmen) {
    revalidatePath("/admin");
    revalidatePath("/fortbildungen");
  }

  return { ergebnis, fehler: ergebnis.fehler };
}
