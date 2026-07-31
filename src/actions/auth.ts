"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import {
  clearSessionCookie,
  getSessionUser,
  setSessionCookie,
  signToken,
} from "@/lib/auth";
import { createRateLimiter, getClientIp } from "@/lib/rateLimit";

/**
 * Zwei Begrenzer: einer pro Konto (gegen das Durchprobieren eines Passworts),
 * einer pro IP (gegen das Durchprobieren vieler Konten von einer Quelle).
 * Modul-Ebene, damit die Zähler zwischen Aufrufen erhalten bleiben.
 */
const proKonto = createRateLimiter(5, 15 * 60);
const proIp = createRateLimiter(20, 15 * 60);

const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Bitte die E-Mail-Adresse eingeben.")
    .refine(
      (wert) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(wert),
      "Bitte eine gültige E-Mail-Adresse eingeben.",
    ),
  passwort: z.string().min(1, "Bitte das Passwort eingeben."),
  weiter: z.string().optional(),
});

export interface LoginState {
  fehler?: string;
}

export async function login(
  _bisher: LoginState,
  formData: FormData,
): Promise<LoginState> {
  // formData.get() liefert null, wenn das Feld fehlt — zod würde daraus eine
  // englische Typmeldung machen. Deshalb hier auf Strings normalisieren.
  const eingabe = LoginSchema.safeParse({
    email: formData.get("email")?.toString() ?? "",
    passwort: formData.get("passwort")?.toString() ?? "",
    weiter: formData.get("weiter")?.toString() || undefined,
  });

  if (!eingabe.success) {
    return { fehler: eingabe.error.issues[0]?.message ?? "Eingabe unvollständig." };
  }

  const { email, passwort } = eingabe.data;
  const ip = getClientIp(await headers());

  const ipLimit = proIp.pruefen(ip);
  const kontoLimit = proKonto.pruefen(email);

  if (!ipLimit.erlaubt || !kontoLimit.erlaubt) {
    const warten = Math.max(ipLimit.wartesekunden, kontoLimit.wartesekunden);
    return {
      fehler: `Zu viele Anmeldeversuche. Bitte in ${Math.ceil(warten / 60)} Minuten erneut versuchen.`,
    };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Auch bei unbekannter Adresse wird gehasht: Sonst wäre an der Antwortzeit
  // ablesbar, welche Adressen im System existieren.
  const passt = user
    ? await bcrypt.compare(passwort, user.passwordHash)
    : await bcrypt.compare(passwort, "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv");

  if (!user || !passt || !user.isActive) {
    await auditLog({
      userId: user?.id ?? null,
      aktion: "LOGIN_FAILED",
      entitaet: "User",
      entitaetId: user?.id ?? null,
      details: { email, ip },
    });
    // Bewusst dieselbe Meldung für "Konto unbekannt", "Passwort falsch" und
    // "Konto deaktiviert".
    return { fehler: "E-Mail-Adresse oder Passwort ist nicht korrekt." };
  }

  proKonto.zuruecksetzen(email);
  proIp.zuruecksetzen(ip);

  await setSessionCookie(await signToken(user.id));
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  await auditLog({ userId: user.id, aktion: "LOGIN", entitaet: "User", entitaetId: user.id });

  // Nur interne Pfade als Weiterleitungsziel zulassen — sonst ließe sich der
  // Login als Sprungbrett auf fremde Seiten missbrauchen (Open Redirect).
  const weiter = eingabe.data.weiter;
  const ziel =
    weiter && weiter.startsWith("/") && !weiter.startsWith("//") ? weiter : "/admin";

  redirect(ziel);
}

export async function logout(): Promise<void> {
  const user = await getSessionUser();
  if (user) {
    await auditLog({ userId: user.id, aktion: "LOGOUT", entitaet: "User", entitaetId: user.id });
  }
  await clearSessionCookie();
  redirect("/login");
}
