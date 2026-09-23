"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auditLog } from "@/lib/audit";
import { AuthError, requireRole } from "@/lib/auth";
import { normalisiereSchlagwortListe } from "@/lib/schlagwort";
import { prisma } from "@/lib/prisma";
import { generiereSchulamtKuerzel, pruefeSchulamtKuerzel } from "@/lib/schulamtKuerzel";
import { erzeugeZugangstoken } from "@/lib/zugang";
import type { FormularState } from "@/lib/validation/fortbildung";

const BezirkSchema = z.object({
  name: z.string().trim().min(2, "Bitte einen Bezirksnamen angeben.").max(120),
  kuerzel: z.string().trim().max(60),
  pflichtSchlagworte: z.string().max(1000).transform((wert) =>
    normalisiereSchlagwortListe(wert.split(/[,\n]/).filter((tag) => tag.trim())),
  ).pipe(z.array(z.string().min(2, "Schlagworte brauchen mindestens zwei Zeichen.").max(60, "Ein Schlagwort darf höchstens 60 Zeichen haben.")).max(8, "Höchstens acht Pflicht-Schlagworte.")),
  aktiv: z.boolean(),
});

const BdbSchema = z.object({
  email: z.string().trim().toLowerCase().email("Bitte eine gültige E-Mail-Adresse angeben."),
  name: z.string().trim().min(2, "Bitte einen Namen angeben.").max(120),
  bezirkIds: z.array(z.string().uuid()).min(1, "Mindestens einen Bezirk zuordnen."),
  aktiv: z.boolean(),
});

/** RvS verwaltet die Bezirke und die Zuständigkeiten der BdBs zentral. */
export async function speichereBezirk(
  id: string | null,
  _bisher: FormularState,
  formData: FormData,
): Promise<FormularState> {
  let rvs;
  try { rvs = await requireRole("RVS"); } catch (error) {
    if (error instanceof AuthError) return { fehler: { _: error.message } };
    throw error;
  }
  const daten = BezirkSchema.safeParse({
    name: formData.get("name")?.toString() ?? "",
    kuerzel: formData.get("kuerzel")?.toString() ?? "",
    pflichtSchlagworte: formData.get("pflichtSchlagworte")?.toString() ?? "",
    aktiv: formData.get("aktiv") === "on",
  });
  if (!daten.success) return { fehler: { _: daten.error.issues[0]?.message ?? "Eingabe ungültig." } };
  const kuerzel = daten.data.kuerzel || generiereSchulamtKuerzel(daten.data.name);
  const kuerzelFehler = pruefeSchulamtKuerzel(kuerzel);
  if (kuerzelFehler) return { fehler: { kuerzel: kuerzelFehler } };
  let bezirk;
  try {
    bezirk = id
      ? await prisma.bezirk.update({ where: { id }, data: { ...daten.data, kuerzel } })
      : await prisma.bezirk.create({ data: { ...daten.data, kuerzel } });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      const ziel = "meta" in error && typeof error.meta === "object" && error.meta !== null && "target" in error.meta && Array.isArray(error.meta.target) && error.meta.target.includes("kuerzel")
        ? "kuerzel"
        : "name";
      return { fehler: { [ziel]: ziel === "kuerzel" ? "Dieses Kürzel wird bereits verwendet." : "Ein Bezirk mit diesem Namen existiert bereits." } };
    }
    throw error;
  }
  await auditLog({ userId: rvs.id, aktion: id ? "UPDATE" : "CREATE", entitaet: "Bezirk", entitaetId: bezirk.id });
  revalidatePath("/admin/bezirke");
  return { erfolg: true, meldung: "Bezirk gespeichert." };
}

/** Legt ein BdB-Konto an oder aktualisiert dessen Bezirkszuständigkeiten. */
export async function speichereBdb(
  userId: string | null,
  _bisher: FormularState,
  formData: FormData,
): Promise<FormularState> {
  let rvs;
  try { rvs = await requireRole("RVS"); } catch (error) {
    if (error instanceof AuthError) return { fehler: { _: error.message } };
    throw error;
  }
  const daten = BdbSchema.safeParse({
    email: formData.get("email")?.toString() ?? "",
    name: formData.get("name")?.toString() ?? "",
    bezirkIds: formData.getAll("bezirkIds").map(String),
    aktiv: formData.get("aktiv") === "on",
  });
  if (!daten.success) return { fehler: { _: daten.error.issues[0]?.message ?? "Eingabe ungültig." } };
  const anzahl = await prisma.bezirk.count({ where: { id: { in: daten.data.bezirkIds }, aktiv: true } });
  if (anzahl !== new Set(daten.data.bezirkIds).size) return { fehler: { _: "Ein ausgewählter Bezirk existiert nicht oder ist inaktiv." } };
  let ziel: { role: string } | null = null;
  if (userId) {
    ziel = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!ziel) return { fehler: { _: "Dieses Konto existiert nicht mehr." } };
    if (ziel.role === "RVS") return { fehler: { _: "Ein RvS-Konto darf hier nicht zum BdB herabgestuft werden." } };
  }
  let konto;
  try {
    konto = userId
      ? await prisma.user.update({ where: { id: userId }, data: { email: daten.data.email, name: daten.data.name, isActive: daten.data.aktiv, bezirke: { set: daten.data.bezirkIds.map((id) => ({ id })) }, sessionVersion: { increment: 1 } } })
      : await prisma.user.create({ data: { email: daten.data.email, name: daten.data.name, role: "ADMIN", isActive: daten.data.aktiv, bezirke: { connect: daten.data.bezirkIds.map((id) => ({ id })) } } });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return { fehler: { email: "Diese E-Mail-Adresse wird bereits verwendet." } };
    }
    throw error;
  }
  if (!userId) await erzeugeZugangstoken(konto.id, "EINLADUNG", { wiederAnzeigen: true });
  await auditLog({ userId: rvs.id, aktion: userId ? "UPDATE" : "CREATE", entitaet: "User", entitaetId: konto.id, details: { rolle: "ADMIN", bezirkIds: daten.data.bezirkIds } });
  revalidatePath("/admin/bezirke");
  return { erfolg: true, meldung: userId ? "BdB gespeichert." : `BdB ${konto.email} angelegt. Der Einladungslink ist unten beim Konto gespeichert.` };
}

/** Erzeugt nur auf ausdrücklichen Wunsch einen neuen Zugangslink für einen BdB. */
export async function erzeugeBdbZugangslink(userId: string): Promise<FormularState> {
  let rvs;
  try { rvs = await requireRole("RVS"); } catch (error) {
    if (error instanceof AuthError) return { fehler: { _: error.message } };
    throw error;
  }
  const ziel = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, isActive: true, passwordHash: true } });
  if (!ziel || !["ADMIN", "REDAKTEUR"].includes(ziel.role) || !ziel.isActive) return { fehler: { _: "Für dieses Konto kann kein Zugangslink erzeugt werden." } };
  await erzeugeZugangstoken(ziel.id, ziel.passwordHash ? "PASSWORT_RESET" : "EINLADUNG", { wiederAnzeigen: true });
  await auditLog({ userId: rvs.id, aktion: "CREATE", entitaet: "Zugang", entitaetId: ziel.id, details: { rolle: ziel.role } });
  revalidatePath("/admin/bezirke");
  return { erfolg: true, meldung: "Neuer Zugangslink gespeichert. Der bisherige offene Link ist ungültig." };
}
