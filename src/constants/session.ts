/**
 * Eigenes Modul, damit `proxy.ts` den Cookie-Namen importieren kann, ohne
 * `lib/auth.ts` mitzuziehen — dort hängen Prisma und next/headers dran, die im
 * Proxy nicht laufen dürfen.
 */
export const SESSION_COOKIE = "session_token";

/** Sitzungsdauer in Sekunden: acht Stunden, also ein Arbeitstag. */
export const SESSION_DAUER_SEKUNDEN = 60 * 60 * 8;
