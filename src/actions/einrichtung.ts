"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SchulamtProfilSchema, SCHULAMT_PROFIL_SCHLUESSEL } from "@/lib/schulamtProfil";
import { ladeSchulamt } from "@/lib/schulamt";
import { zuFeldFehlern, type FormularState } from "@/lib/validation/fortbildung";

export async function speichereEinrichtung(_bisher: FormularState, formData: FormData): Promise<FormularState> {
  const user = await requireRole("RVS");
  const bisherigesProfil = await ladeSchulamt();
  const geprueft = SchulamtProfilSchema.safeParse({
    name: formData.get("name"), kurzname: formData.get("kurzname"), region: formData.get("region"),
    startTitel: formData.get("startTitel"), zielgruppe: formData.get("zielgruppe"), angebotsRegion: formData.get("angebotsRegion"),
    pflichtSchlagworte: bisherigesProfil.pflichtSchlagworte,
  });
  if (!geprueft.success) return { fehler: zuFeldFehlern(geprueft.error) };
  const profil = geprueft.data;

  await prisma.$transaction(async (tx) => {
    // Pflichtschlagworte werden ausschließlich am jeweiligen Bezirk verwaltet.
    await tx.systemSetting.upsert({ where: { id: SCHULAMT_PROFIL_SCHLUESSEL }, create: { id: SCHULAMT_PROFIL_SCHLUESSEL, value: JSON.stringify(profil) }, update: { value: JSON.stringify(profil) } });
    await tx.systemSetting.upsert({ where: { id: "einrichtungProfilGespeichert" }, create: { id: "einrichtungProfilGespeichert", value: "ja" }, update: { value: "ja" } });
    await tx.auditLog.create({ data: { userId: user.id, aktion: "UPDATE", entitaet: "SystemSetting", entitaetId: SCHULAMT_PROFIL_SCHLUESSEL, details: { felder: Object.keys(profil) } } });
  });
  revalidatePath("/", "layout");
  if (formData.get("weiter") === "schulen") redirect("/admin/einrichtung?schritt=2");
  return { erfolg: true, meldung: "Einrichtung gespeichert. Name und Texte gelten ab sofort. Pflicht-Schlagworte verwalten Sie unter Bezirke und BdBs." };
}

export async function schliesseEinrichtungAb(_bisher: FormularState, formData: FormData): Promise<FormularState> {
  const user = await requireRole("RVS");
  if (formData.get("bestaetigt") !== "on") return { fehler: { _: "Bitte bestätigen Sie die Prüfung Ihrer Angaben." } };
  const eintraege = await prisma.systemSetting.findMany({ where: { id: { in: [SCHULAMT_PROFIL_SCHLUESSEL, "einrichtungProfilGespeichert", "impressum", "datenschutz"] } } });
  if (!eintraege.some((eintrag) => eintrag.id === "einrichtungProfilGespeichert")) return { fehler: { _: "Bitte zuerst in Schritt 1 die Angaben zum Schulamt speichern." } };
  for (const id of ["impressum", "datenschutz"]) {
    const text = eintraege.find((eintrag) => eintrag.id === id)?.value.trim();
    if (!text || text.length < 50 || /Platzhalter\s*[—–-]/i.test(text)) return { fehler: { _: `Bitte ${id === "impressum" ? "das Impressum" : "die Datenschutzerklärung"} in Schritt 3 vervollständigen und speichern.` } };
  }
  await prisma.$transaction([
    prisma.systemSetting.upsert({ where: { id: "einrichtungStatus" }, create: { id: "einrichtungStatus", value: "fertig" }, update: { value: "fertig" } }),
    prisma.auditLog.create({ data: { userId: user.id, aktion: "UPDATE", entitaet: "SystemSetting", entitaetId: "einrichtungStatus", details: { abgeschlossen: true } } }),
  ]);
  revalidatePath("/admin", "layout");
  redirect("/admin");
}
