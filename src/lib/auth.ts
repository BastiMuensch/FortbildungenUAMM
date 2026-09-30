import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

import { prisma } from "@/lib/prisma";
import { fortbildungScope } from "@/lib/berechtigungsScope";
import { istPrivilegierteRolle } from "@/lib/mfa";
import type { Rolle } from "@/constants/fortbildung";
import { RolleSchema } from "@/lib/validation/rolle";
import {
  liesSessionVersion,
  SESSION_COOKIE,
  SESSION_DAUER_SEKUNDEN,
  sitzungsCookieSicher,
} from "@/constants/session";

export { SESSION_COOKIE };

const SESSION_DAUER = `${SESSION_DAUER_SEKUNDEN}s`;
export const MFA_ANMELDE_COOKIE = "mfa_anmeldung";

function secret(): Uint8Array {
  const wert = process.env.JWT_SECRET;
  if (!wert || wert.length < 32) {
    throw new Error(
      "JWT_SECRET fehlt oder ist zu kurz. Erzeugen mit: openssl rand -base64 48",
    );
  }
  return new TextEncoder().encode(wert);
}

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: Rolle;
  /** Bei der Rolle REFERENT: der zugehörige Eintrag im Referentenverzeichnis. */
  referentId: string | null;
  /** Bezirke, für die dieses Konto organisatorisch zuständig ist. */
  bezirkIds: string[];
  bezirke: Array<{ id: string; name: string }>;
  mfaBestaetigt: boolean;
  mfaEinrichtungErforderlich: boolean;
}

/** Regierung und BdBs; BdB-Abfragen bleiben auf die zugeordneten Bezirke begrenzt. */
export const VERWALTUNG: Rolle[] = ["RVS", "ADMIN"];

/** Alle, die überhaupt Fortbildungen erfassen dürfen. */
export const ERFASSER: Rolle[] = ["RVS", "ADMIN", "REFERENT"];

export async function signToken(
  userId: string,
  sessionVersion: number,
  mfaBestaetigt = true,
): Promise<string> {
  return new SignJWT({ sub: userId, sv: sessionVersion, mf: mfaBestaetigt, typ: "session" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DAUER)
    .sign(secret());
}

export interface VerifiziertesToken {
  userId: string;
  sessionVersion: number | null;
  mfaBestaetigt: boolean;
}

export async function verifyToken(
  token: string,
): Promise<VerifiziertesToken | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.sub !== "string" || payload.typ !== "session") return null;

    return {
      userId: payload.sub,
      // Tokens vor Einführung der Sitzungsversion werden absichtlich nicht
      // weiter akzeptiert: Ein erneuter Login ist sicherer als eine
      // unkontrollierbare Alt-Sitzung.
      sessionVersion: liesSessionVersion(payload.sv),
      mfaBestaetigt: payload.mf === true,
    };
  } catch {
    return null;
  }
}

/** Setzt das Sitzungs-Cookie. Nur aus Server Actions oder Route Handlern aufrufbar. */
export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: sitzungsCookieSicher(
      process.env.SESSION_COOKIE_SECURE,
      process.env.NODE_ENV === "production",
    ),
    path: "/",
    maxAge: SESSION_DAUER_SEKUNDEN,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Kurzlebiger, ausschließlich für die zweite Anmeldephase gültiger Nachweis. */
export async function setzeMfaAnmeldeCookie(userId: string, sessionVersion: number): Promise<void> {
  const token = await new SignJWT({ sub: userId, sv: sessionVersion, typ: "mfa" })
    .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("5m").sign(secret());
  (await cookies()).set(MFA_ANMELDE_COOKIE, token, {
    httpOnly: true, sameSite: "strict", secure: sitzungsCookieSicher(process.env.SESSION_COOKIE_SECURE, process.env.NODE_ENV === "production"), path: "/mfa", maxAge: 5 * 60,
  });
}

export async function liesMfaAnmeldung(): Promise<{ userId: string; sessionVersion: number } | null> {
  const token = (await cookies()).get(MFA_ANMELDE_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.typ !== "mfa" || typeof payload.sub !== "string" || liesSessionVersion(payload.sv) === null) return null;
    return { userId: payload.sub, sessionVersion: payload.sv as number };
  } catch { return null; }
}

export async function loescheMfaAnmeldeCookie(): Promise<void> {
  (await cookies()).set(MFA_ANMELDE_COOKIE, "", { path: "/mfa", maxAge: 0, httpOnly: true, sameSite: "strict", secure: sitzungsCookieSicher(process.env.SESSION_COOKIE_SECURE, process.env.NODE_ENV === "production") });
}

/**
 * Die angemeldete Person, oder null.
 *
 * Liest bewusst gegen die Datenbank statt nur das Token auszuwerten: so wirkt
 * ein deaktivierter Zugang sofort und nicht erst nach Ablauf des Tokens.
 */
export async function getSessionUser(optionen: { mfaEinrichtungErlauben?: boolean } = {}): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenDaten = await verifyToken(token);
  if (!tokenDaten) return null;

  const user = await prisma.user.findUnique({
    where: { id: tokenDaten.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      sessionVersion: true,
      mfaAktiviertAm: true,
      bezirke: { where: { aktiv: true }, select: { id: true, name: true }, orderBy: { name: "asc" } },
      referent: {
        select: {
          id: true,
          aktiv: true,
          bezirke: { where: { aktiv: true }, select: { id: true, name: true }, orderBy: { name: "asc" } },
        },
      },
    },
  });

  const rolle = RolleSchema.safeParse(user?.role);
  if (
    !user ||
    !rolle.success ||
    !user.isActive ||
    tokenDaten.sessionVersion !== user.sessionVersion
  ) {
    return null;
  }

  // Ein stillgelegter Referenteneintrag beendet auch den Zugang — sonst
  // bliebe ein ausgeschiedener Referent weiter angemeldet.
  if (user.role === "REFERENT" && !user.referent?.aktiv) return null;

  // Referentenzuständigkeiten werden am Referenteneintrag gepflegt. Für die
  // Session verwenden wir sie verbindlich, damit ein BdB einem Referenten
  // keinen Bezirk über ein separates Benutzerfeld unterschieben kann.
  const bezirke = user.role === "REFERENT" ? (user.referent?.bezirke ?? []) : user.bezirke;
  const mfaEinrichtungErforderlich = istPrivilegierteRolle(user.role) && !user.mfaAktiviertAm;
  const mfaBestaetigt = !istPrivilegierteRolle(user.role) || (Boolean(user.mfaAktiviertAm) && tokenDaten.mfaBestaetigt);
  // Unvollständige Sitzungen dürfen niemals Download- oder Fachzugriff erhalten.
  if (!mfaBestaetigt && !(optionen.mfaEinrichtungErlauben && mfaEinrichtungErforderlich)) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: rolle.data,
    referentId: user.referent?.id ?? null,
    bezirkIds: bezirke.map((bezirk) => bezirk.id),
    bezirke,
    mfaBestaetigt,
    mfaEinrichtungErforderlich,
  };
}

/**
 * Erzwingt eine Anmeldung. Wirft, wenn niemand angemeldet ist.
 *
 * In JEDER Server Action und JEDEM geschützten Route Handler aufrufen — der
 * Guard im Layout und die Prüfung in proxy.ts sind nur vorgelagert, sie
 * schützen die Aktion selbst nicht (Server Actions sind eigene Endpunkte).
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError("Nicht angemeldet.");
  if (!user.mfaBestaetigt) throw new AuthError(user.mfaEinrichtungErforderlich
    ? "Für dieses Konto muss zuerst die Zwei-Faktor-Authentifizierung eingerichtet werden."
    : "Die Zwei-Faktor-Authentifizierung wurde noch nicht bestätigt.");
  return user;
}

/** Ausschließlich für die MFA-Einrichtung eines bereits per Passwort bestätigten Kontos. */
export async function requireMfaEinrichtungUser(): Promise<SessionUser> {
  const user = await getSessionUser({ mfaEinrichtungErlauben: true });
  if (!user) throw new AuthError("Nicht angemeldet.");
  if (!user.mfaEinrichtungErforderlich) throw new AuthError("Für dieses Konto ist keine MFA-Einrichtung offen.");
  return user;
}

/** Erzwingt eine der angegebenen Rollen. */
export async function requireRole(...rollen: Rolle[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!rollen.includes(user.role)) {
    throw new AuthError("Für diese Aktion fehlt die Berechtigung.");
  }
  return user;
}

/**
 * Einschränkung, welche Fortbildungen eine Person sehen und bearbeiten darf.
 *
 * Die RvS sieht alles, BdBs nur ihre zugeordneten Bezirke.
 * Referierende benötigen zusätzlich die eigene Veranstaltungszuordnung.
 * Diese eine Funktion wird überall verwendet, damit die Regel nicht an jeder
 * Abfrage neu formuliert — und irgendwann vergessen — wird.
 */
export { bezirkScope, fortbildungScope, referentScope } from "@/lib/berechtigungsScope";

/** Prüft den Zugriff auf einen konkreten Datensatz. */
export async function darfBearbeiten(
  user: SessionUser,
  fortbildungId: string,
): Promise<boolean> {
  const treffer = await prisma.fortbildung.findFirst({
    where: { AND: [{ id: fortbildungId }, fortbildungScope(user)] },
    select: { id: true },
  });
  return treffer !== null;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
