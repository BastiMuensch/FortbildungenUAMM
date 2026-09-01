/**
 * Eigenes Modul, damit `proxy.ts` den Cookie-Namen importieren kann, ohne
 * `lib/auth.ts` mitzuziehen — dort hängen Prisma und next/headers dran, die im
 * Proxy nicht laufen dürfen.
 */
export const SESSION_COOKIE = "session_token";

/** Sitzungsdauer in Sekunden: acht Stunden, also ein Arbeitstag. */
export const SESSION_DAUER_SEKUNDEN = 60 * 60 * 8;

/** Liest die Version aus einem bereits kryptographisch geprüften JWT-Claim. */
export function liesSessionVersion(wert: unknown): number | null {
  return typeof wert === "number" && Number.isSafeInteger(wert) && wert >= 0
    ? wert
    : null;
}
