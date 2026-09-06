"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { AuthError, requireRole, requireUser, setSessionCookie, signToken } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import {
  erzeugeZugangstoken,
  pruefeZugangstoken,
  verbraucheTokenUndSetzePasswort,
  zugangsLink,
  type Zweck,
} from "@/lib/zugang";
import type { FormularState } from "@/lib/validation/fortbildung";

/** Mindestanforderung an ein Passwort. */
const PasswortSchema = z
  .string()
  .min(12, "Das Passwort muss mindestens 12 Zeichen haben.")
  .max(200, "Das Passwort ist zu lang.");

// ---------------------------------------------------------------------------
// Zugang einrichten (durch die Administration)
// ---------------------------------------------------------------------------

export interface EinladungState extends FormularState {
  /** Der erzeugte Link — wird einmalig angezeigt und muss kopiert werden. */
  link?: string;
  gueltigBis?: string;
}

/**
 * Hebt ein bestehendes Referentenkonto zur Administration hoch.
 *
 * Die Aktion ist bewusst kein frei editierbares Rollenfeld: Nur ein bereits
 * aktives, mit einem Referenteneintrag verknüpftes REFERENT-Konto mit
 * eingerichtetem Passwort kommt in Frage. Zusätzlich muss die Administration
 * die E-Mail-Adresse der Person eintippen. Der Versionssprung beendet vorhandene Sitzungen des Zielkontos,
 * damit es die neuen Rechte erst nach einer frischen Anmeldung verwenden kann.
 */
export async function stufeReferentZuAdministrationHoch(
  userId: string,
  _bisher: FormularState,
  formData: FormData,
): Promise<FormularState> {
  let admin;
  try {
    admin = await requireRole("ADMIN");
  } catch (error) {
    if (error instanceof AuthError) return { fehler: { _: error.message } };
    throw error;
  }

  const bestaetigung = (formData.get("bestaetigung") ?? "")
    .toString()
    .trim()
    .toLowerCase();
  const ziel = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      passwordHash: true,
      referent: { select: { id: true, aktiv: true } },
    },
  });

  if (
    !ziel ||
    ziel.role !== "REFERENT" ||
    !ziel.referent ||
    !ziel.isActive ||
    !ziel.referent.aktiv ||
    !ziel.passwordHash
  ) {
    return {
      fehler: {
        _: "Nur aktive Referentenkonten mit eingerichtetem Passwort können hochgestuft werden.",
      },
    };
  }

  if (bestaetigung !== ziel.email.trim().toLowerCase()) {
    return {
      fehler: {
        bestaetigung: "Zur Bestätigung bitte die E-Mail-Adresse der Person exakt eingeben.",
      },
    };
  }

  const hochgestuft = await prisma.user.updateMany({
    where: {
      id: ziel.id,
      role: "REFERENT",
      isActive: true,
      passwordHash: { not: null },
    },
    data: { role: "ADMIN", sessionVersion: { increment: 1 } },
  });
  if (hochgestuft.count === 0) {
    return {
      fehler: {
        _: "Der Zugang wurde zwischenzeitlich geändert. Bitte die Seite neu laden.",
      },
    };
  }

  await auditLog({
    userId: admin.id,
    aktion: "UPDATE",
    entitaet: "User",
    entitaetId: ziel.id,
    details: { rollenwechsel: "REFERENT_ZU_ADMIN", referentId: ziel.referent.id },
  });

  revalidatePath("/admin/referenten");
  revalidatePath("/admin");
  return {
    erfolg: true,
    meldung: `${ziel.email} ist jetzt als Administration eingestuft und muss sich erneut anmelden.`,
  };
}

/**
 * Richtet für eine Referentin oder einen Referenten ein Anmeldekonto ein und
 * gibt einen Einladungslink zurück.
 *
 * Kein Mailversand: Für diese Anwendung ist kein Mailserver eingerichtet. Der
 * Link wird angezeigt, kopiert und auf dem üblichen Dienstweg weitergegeben.
 */
export async function richteZugangEin(
  referentId: string,
  _bisher: EinladungState,
  _formData: FormData,
): Promise<EinladungState> {
  let admin;
  try {
    admin = await requireRole("ADMIN");
  } catch (error) {
    if (error instanceof AuthError) return { fehler: { _: error.message } };
    throw error;
  }

  const referent = await prisma.referent.findUnique({
    where: { id: referentId },
    select: { id: true, vorname: true, nachname: true, email: true, userId: true },
  });

  if (!referent) return { fehler: { _: "Diese Person gibt es nicht mehr." } };

  if (!referent.email) {
    return {
      fehler: {
        _: "Für den Zugang wird eine E-Mail-Adresse gebraucht — sie ist die Anmeldekennung. Bitte zuerst beim Referenten eintragen.",
      },
    };
  }

  const email = referent.email.trim().toLowerCase();
  let userId = referent.userId;

  if (!userId) {
    const belegt = await prisma.user.findUnique({ where: { email } });
    if (belegt) {
      return {
        fehler: {
          _: `Für ${email} gibt es bereits ein Konto. Bitte im Referentenverzeichnis eine andere Adresse eintragen oder das bestehende Konto verknüpfen.`,
        },
      };
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: `${referent.vorname} ${referent.nachname}`,
        role: "REFERENT",
        // Kein Passwort: Das setzt die Person selbst über den Einladungslink.
        passwordHash: null,
      },
      select: { id: true },
    });

    await prisma.referent.update({
      where: { id: referentId },
      data: { userId: user.id },
    });

    userId = user.id;
  }

  const zweck: Zweck = "EINLADUNG";
  const { token, gueltigBis } = await erzeugeZugangstoken(userId, zweck);

  await auditLog({
    userId: admin.id,
    aktion: "CREATE",
    entitaet: "Zugang",
    entitaetId: userId,
    details: { referentId, zweck },
  });

  revalidatePath("/admin/referenten");

  return {
    erfolg: true,
    link: zugangsLink(token),
    gueltigBis: gueltigBis.toISOString(),
    meldung: `Zugang für ${email} eingerichtet.`,
  };
}

/** Erzeugt einen neuen Link, wenn der alte abgelaufen oder verloren ist. */
export async function neuerZugangslink(
  userId: string,
  _bisher: EinladungState,
  _formData: FormData,
): Promise<EinladungState> {
  let admin;
  try {
    admin = await requireRole("ADMIN");
  } catch (error) {
    if (error instanceof AuthError) return { fehler: { _: error.message } };
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, passwordHash: true },
  });
  if (!user) return { fehler: { _: "Dieses Konto gibt es nicht mehr." } };

  const zweck: Zweck = user.passwordHash ? "PASSWORT_RESET" : "EINLADUNG";
  const { token, gueltigBis } = await erzeugeZugangstoken(user.id, zweck);

  await auditLog({
    userId: admin.id,
    aktion: "UPDATE",
    entitaet: "Zugang",
    entitaetId: user.id,
    details: { zweck },
  });

  return {
    erfolg: true,
    link: zugangsLink(token),
    gueltigBis: gueltigBis.toISOString(),
    meldung:
      zweck === "EINLADUNG"
        ? `Neuer Einladungslink für ${user.email}.`
        : `Link zum Zurücksetzen des Passworts für ${user.email}.`,
  };
}

/** Nimmt einer Person den Zugang, ohne den Referenteneintrag zu löschen. */
export async function zugangEntziehen(userId: string): Promise<void> {
  const admin = await requireRole("ADMIN");

  await prisma.$transaction([
    prisma.zugangstoken.deleteMany({ where: { userId } }),
    prisma.user.update({ where: { id: userId }, data: { isActive: false } }),
  ]);

  await auditLog({
    userId: admin.id,
    aktion: "DELETE",
    entitaet: "Zugang",
    entitaetId: userId,
  });

  revalidatePath("/admin/referenten");
}

// ---------------------------------------------------------------------------
// Passwort setzen (durch die eingeladene Person)
// ---------------------------------------------------------------------------

export async function setzePasswort(
  _bisher: FormularState,
  formData: FormData,
): Promise<FormularState> {
  const token = (formData.get("token") ?? "").toString();
  const passwort = (formData.get("passwort") ?? "").toString();
  const wiederholung = (formData.get("wiederholung") ?? "").toString();

  const geprueft = PasswortSchema.safeParse(passwort);
  if (!geprueft.success) {
    return { fehler: { passwort: geprueft.error.issues[0]!.message } };
  }

  if (passwort !== wiederholung) {
    return { fehler: { wiederholung: "Die beiden Eingaben stimmen nicht überein." } };
  }

  // Vorprüfung vermeidet die teure Passwort-Hashing-Arbeit für beliebige,
  // ungültige Links. Verbindlich ist trotzdem erst das atomare Verbrauchen
  // darunter; zwischen beiden Schritten kann ein paralleler Request den
  // Token bereits genutzt haben.
  if (!(await pruefeZugangstoken(token))) {
    return {
      fehler: {
        _: "Dieser Link ist abgelaufen oder wurde bereits verwendet. Bitte bei der Administration einen neuen anfordern.",
      },
    };
  }

  const passwordHash = await bcrypt.hash(passwort, 12);
  const eintrag = await verbraucheTokenUndSetzePasswort(token, passwordHash);
  if (!eintrag) {
    return {
      fehler: {
        _: "Dieser Link ist abgelaufen oder wurde bereits verwendet. Bitte bei der Administration einen neuen anfordern.",
      },
    };
  }

  await auditLog({
    userId: eintrag.userId,
    aktion: "UPDATE",
    entitaet: "User",
    entitaetId: eintrag.userId,
    details: { passwortGesetzt: true, zweck: eintrag.zweck },
  });

  // Direkt anmelden — die Person hat sich gerade ausgewiesen.
  await setSessionCookie(
    await signToken(eintrag.userId, eintrag.sessionVersion),
  );

  redirect("/admin?willkommen=1");
}

// ---------------------------------------------------------------------------
// Eigenes Passwort ändern
// ---------------------------------------------------------------------------

export async function aenderePasswort(
  _bisher: FormularState,
  formData: FormData,
): Promise<FormularState> {
  const user = await requireUser();

  const bisheriges = (formData.get("bisheriges") ?? "").toString();
  const neues = (formData.get("neues") ?? "").toString();
  const wiederholung = (formData.get("wiederholung") ?? "").toString();

  const konto = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  if (!konto?.passwordHash || !(await bcrypt.compare(bisheriges, konto.passwordHash))) {
    return { fehler: { bisheriges: "Das bisherige Passwort stimmt nicht." } };
  }

  const geprueft = PasswortSchema.safeParse(neues);
  if (!geprueft.success) {
    return { fehler: { neues: geprueft.error.issues[0]!.message } };
  }

  if (neues === bisheriges) {
    return { fehler: { neues: "Bitte ein anderes als das bisherige Passwort wählen." } };
  }

  if (neues !== wiederholung) {
    return { fehler: { wiederholung: "Die beiden Eingaben stimmen nicht überein." } };
  }

  const aktualisiert = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(neues, 12),
      sessionVersion: { increment: 1 },
    },
    select: { sessionVersion: true },
  });

  // Die aktuelle Sitzung erhält die neue Version; alle anderen Sitzungen
  // desselben Kontos werden beim nächsten Zugriff abgewiesen.
  await setSessionCookie(await signToken(user.id, aktualisiert.sessionVersion));

  await auditLog({
    userId: user.id,
    aktion: "UPDATE",
    entitaet: "User",
    entitaetId: user.id,
    details: { passwortGeaendert: true },
  });

  return { erfolg: true, meldung: "Das Passwort wurde geändert." };
}
