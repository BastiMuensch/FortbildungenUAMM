import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { REGISTRIERUNG_GUELTIGKEIT_TAGE } from "@/constants/registrierung";

function hashe(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Erzeugt einen 256-Bit-Token. Der Klartext verlässt diese Funktion nur als
 * Link; in der Datenbank liegt ausschließlich sein SHA-256-Hash.
 */
export async function erzeugeReferentenRegistrierungslink(
  erstelltVonId: string,
  bezirkId: string,
  maxNutzungen: number,
): Promise<{ token: string; gueltigBis: Date }> {
  const token = randomBytes(32).toString("base64url");
  const gueltigBis = new Date(
    Date.now() + REGISTRIERUNG_GUELTIGKEIT_TAGE * 24 * 60 * 60 * 1000,
  );

  // Pro Bezirk gibt es nur einen aktiven Link. Ein BdB kann damit keinen Link
  // eines anderen Bezirks entwerten.
  await prisma.$transaction(async (tx) => {
    // Der transaktionale PostgreSQL-Lock verhindert, dass zwei parallele
    // BdB-Requests für denselben Bezirk beide einen gültigen Link hinterlassen.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${bezirkId}))`;
    await tx.referentenRegistrierungslink.updateMany({
      where: { aktiv: true, bezirkId },
      data: { aktiv: false },
    });
    await tx.referentenRegistrierungslink.create({
      data: {
        tokenHash: hashe(token),
        expiresAt: gueltigBis,
        maxNutzungen,
        erstelltVonId,
        bezirkId,
      },
    });
  });

  return { token, gueltigBis };
}

/** Minimaldaten für die öffentliche Registrierungsseite. */
export async function ladeReferentenRegistrierungslink(
  token: string,
): Promise<{ bezirkId: string; bezirkName: string } | null> {
  if (token.length < 40 || token.length > 200) return null;

  const link = await prisma.referentenRegistrierungslink.findUnique({
    where: { tokenHash: hashe(token) },
    select: {
      aktiv: true,
      expiresAt: true,
      nutzungen: true,
      maxNutzungen: true,
      bezirk: { select: { id: true, name: true, aktiv: true } },
    },
  });
  if (
    !link?.aktiv ||
    !link.bezirk.aktiv ||
    link.expiresAt <= new Date() ||
    link.nutzungen >= link.maxNutzungen
  ) {
    return null;
  }
  return { bezirkId: link.bezirk.id, bezirkName: link.bezirk.name };
}

/** Prüft nur die Link-Gültigkeit; der Link bleibt dabei wiederverwendbar. */
export async function pruefeReferentenRegistrierungslink(
  token: string,
): Promise<boolean> {
  if (token.length < 40 || token.length > 200) return false;

  const link = await prisma.referentenRegistrierungslink.findUnique({
    where: { tokenHash: hashe(token) },
    select: {
      aktiv: true,
      expiresAt: true,
      nutzungen: true,
      maxNutzungen: true,
      bezirk: { select: { aktiv: true } },
    },
  });

  return Boolean(
      link?.aktiv &&
      link.bezirk.aktiv &&
      link.expiresAt > new Date() &&
      link.nutzungen < link.maxNutzungen,
  );
}

/** Vollständiger Link für die Weitergabe durch Redaktion oder Administration. */
export function referentenRegistrierungsLink(token: string): string {
  const basis = process.env.APP_BASE_URL ?? "http://localhost:3000";
  return `${basis.replace(/\/+$/, "")}/referenten-registrierung?token=${encodeURIComponent(token)}`;
}

/** Nur für die Server Action: der Hash wird nie an den Client zurückgegeben. */
export function hashRegistrierungsToken(token: string): string {
  return hashe(token);
}
