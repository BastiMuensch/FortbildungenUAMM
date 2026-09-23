import "server-only";

import { prisma } from "@/lib/prisma";
import { AuthError, bezirkScope, type SessionUser } from "@/lib/auth";

export type BezirkAuswahl = {
  id: string;
  name: string;
  aktiv: boolean;
  pflichtSchlagworte: string[];
};

export type SchulamtsStartseite = {
  name: string;
  kuerzel: string;
};

/** Öffentliche Startseiten, die in der Administration verlinkt werden dürfen. */
export async function ladeSchulamtsStartseiten(user: SessionUser): Promise<SchulamtsStartseite[]> {
  if (!["RVS", "ADMIN", "REDAKTEUR"].includes(user.role)) return [];

  return prisma.bezirk.findMany({
    where: { AND: [bezirkScope(user), { aktiv: true }] },
    select: { name: true, kuerzel: true },
    orderBy: { name: "asc" },
  });
}

/** Liefert die Bezirke, die eine Person für Formulare auswählen darf. */
export async function ladeBezirke(user: SessionUser): Promise<BezirkAuswahl[]> {
  return prisma.bezirk.findMany({
    where: { AND: [bezirkScope(user), { aktiv: true }] },
    select: { id: true, name: true, aktiv: true, pflichtSchlagworte: true },
    orderBy: { name: "asc" },
  });
}

/** Benennt den erlaubten Berichtsbereich, einschließlich historischer Bezirke. */
export async function ladeBezirksUeberschrift(user: SessionUser, bezirkId?: string): Promise<string> {
  if (user.role === "RVS" && !bezirkId) return "Regierung von Schwaben · Alle Schulämter";
  const bezirke = await prisma.bezirk.findMany({
    where: { AND: [bezirkScope(user), ...(bezirkId ? [{ id: bezirkId }] : [])] },
    select: { name: true },
    orderBy: { name: "asc" },
  });
  return bezirke.length
    ? `Schulamtsbezirk${bezirke.length === 1 ? "" : "e"}: ${bezirke.map((bezirk) => bezirk.name).join(", ")}`
    : "Keine Schulämter in der Auswahl";
}

/** Prüft einen übermittelten Ausschreibungsbezirk serverseitig. */
export async function pruefeBezirk(
  user: SessionUser,
  bezirkId: string,
): Promise<BezirkAuswahl> {
  const bezirk = await prisma.bezirk.findFirst({
    where: { AND: [{ id: bezirkId, aktiv: true }, bezirkScope(user)] },
    select: { id: true, name: true, aktiv: true, pflichtSchlagworte: true },
  });
  if (!bezirk) throw new AuthError("Für diesen Bezirk fehlt die Berechtigung.");
  return bezirk;
}
