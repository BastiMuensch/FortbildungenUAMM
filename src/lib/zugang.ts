import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { prisma } from "@/lib/prisma";

/**
 * Einmal-Token für „Zugang einrichten" und „Passwort zurücksetzen".
 *
 * Es gibt bewusst keinen Mailversand: Für diese Anwendung ist kein Mailserver
 * eingerichtet, und einen zu behaupten wäre schlimmer als keinen zu haben.
 * Stattdessen erzeugt die Administration einen Link, kopiert ihn und gibt ihn
 * der Person auf dem üblichen Dienstweg. Der Link ist einmalig verwendbar und
 * läuft ab.
 */

const GUELTIGKEIT_TAGE = 14;

export type Zweck = "EINLADUNG" | "PASSWORT_RESET";

function hashe(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Erzeugt ein neues Token und gibt den Klartext zurück — der ist nur in
 * diesem Moment bekannt, gespeichert wird ausschließlich der Hash.
 */
export async function erzeugeZugangstoken(
  userId: string,
  zweck: Zweck,
): Promise<{ token: string; gueltigBis: Date }> {
  // Ältere, noch offene Token derselben Person entwerten — sonst kursieren
  // mehrere gültige Links für denselben Zugang.
  await prisma.zugangstoken.deleteMany({ where: { userId, usedAt: null } });

  const token = randomBytes(32).toString("base64url");
  const gueltigBis = new Date(
    Date.now() + GUELTIGKEIT_TAGE * 24 * 60 * 60 * 1000,
  );

  await prisma.zugangstoken.create({
    data: { tokenHash: hashe(token), userId, zweck, expiresAt: gueltigBis },
  });

  return { token, gueltigBis };
}

export interface GeprueftesToken {
  id: string;
  userId: string;
  zweck: Zweck;
  name: string | null;
  email: string;
}

/** Prüft ein Token, ohne es zu verbrauchen. */
export async function pruefeZugangstoken(
  token: string,
): Promise<GeprueftesToken | null> {
  const eintrag = await prisma.zugangstoken.findUnique({
    where: { tokenHash: hashe(token) },
    include: { user: { select: { id: true, name: true, email: true, isActive: true } } },
  });

  if (!eintrag) return null;
  if (eintrag.usedAt) return null;
  if (eintrag.expiresAt < new Date()) return null;
  if (!eintrag.user.isActive) return null;

  return {
    id: eintrag.id,
    userId: eintrag.user.id,
    zweck: eintrag.zweck as Zweck,
    name: eintrag.user.name,
    email: eintrag.user.email,
  };
}

/**
 * Verbraucht einen Zugangstoken und setzt zugleich ein neues Passwort.
 *
 * Die bedingte Aktualisierung ist der entscheidende Schritt: Nur der erste
 * Request, der einen noch offenen und nicht abgelaufenen Token vorfindet,
 * erhält `count === 1`. Erst dann wird im selben Datenbank-Commit das
 * Passwort gesetzt. So kann ein Einladungslink auch bei parallelen Requests
 * nicht zweimal verwendet werden.
 */
export async function verbraucheTokenUndSetzePasswort(
  token: string,
  passwordHash: string,
): Promise<{ userId: string; zweck: Zweck; sessionVersion: number } | null> {
  const tokenHash = hashe(token);
  const jetzt = new Date();

  return prisma.$transaction(async (tx) => {
    const eintrag = await tx.zugangstoken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, zweck: true },
    });
    if (!eintrag) return null;

    const verbraucht = await tx.zugangstoken.updateMany({
      where: {
        id: eintrag.id,
        usedAt: null,
        expiresAt: { gt: jetzt },
        user: { isActive: true },
      },
      data: { usedAt: jetzt },
    });
    if (verbraucht.count !== 1) return null;

    const user = await tx.user.update({
      where: { id: eintrag.userId },
      data: {
        passwordHash,
        // Alle bereits ausgegebenen JWTs werden ungültig; die neue Sitzung
        // erhält weiter unten genau diese erhöhte Version.
        sessionVersion: { increment: 1 },
      },
      select: { id: true, sessionVersion: true },
    });

    return {
      userId: user.id,
      zweck: eintrag.zweck as Zweck,
      sessionVersion: user.sessionVersion,
    };
  });
}

/**
 * Vergleich in konstanter Zeit — verhindert, dass sich ein Token über
 * Antwortzeiten Zeichen für Zeichen erraten lässt.
 */
export function tokenGleich(a: string, b: string): boolean {
  const pufferA = Buffer.from(a);
  const pufferB = Buffer.from(b);
  if (pufferA.length !== pufferB.length) return false;
  return timingSafeEqual(pufferA, pufferB);
}

/** Vollständiger Link, den die Administration weitergibt. */
export function zugangsLink(token: string): string {
  const basis = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  return `${basis.replace(/\/+$/, "")}/zugang?token=${encodeURIComponent(token)}`;
}
