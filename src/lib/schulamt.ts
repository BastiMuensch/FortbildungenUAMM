import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { SCHWABEN_SCHULAMT, SCHULAMT_PROFIL_SCHLUESSEL, SchulamtProfilSchema } from "@/lib/schulamtProfil";

/** React dedupliziert nur innerhalb eines Renderdurchlaufs, nicht dauerhaft. */
export const ladeSchulamt = cache(async () => {
  const eintrag = await prisma.systemSetting.findUnique({ where: { id: SCHULAMT_PROFIL_SCHLUESSEL } });
  if (!eintrag) return SCHWABEN_SCHULAMT;
  return SchulamtProfilSchema.parse(JSON.parse(eintrag.value));
});

export const istEinrichtungOffen = cache(async () => {
  const eintrag = await prisma.systemSetting.findUnique({ where: { id: "einrichtungStatus" } });
  return eintrag?.value === "offen";
});

/** Vorhandene Kalender-UIDs bleiben beim Wechsel der Schulamtsbezeichnung stabil. */
export async function ladeKalenderKennung(): Promise<string> {
  const eintrag = await prisma.systemSetting.findUnique({ where: { id: "kalenderKennung" } });
  return eintrag?.value ?? "fortbildungen-uamm";
}
