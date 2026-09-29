"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auditLog } from "@/lib/audit";
import { AuthError, liesMfaAnmeldung, loescheMfaAnmeldeCookie, requireMfaEinrichtungUser, setSessionCookie, signToken } from "@/lib/auth";
import { entschluesseleMfaGeheimnis, erstelleTotpGeheimnis, erstelleWiederherstellungscodes, findeTotpZaehler, hasheWiederherstellungscode, istPrivilegierteRolle, otpauthUrl, verschluesseleMfaGeheimnis } from "@/lib/mfa";
import { prisma } from "@/lib/prisma";
import { createRateLimiter, getClientIp } from "@/lib/rateLimit";

const mfaProKonto = createRateLimiter(5, 15 * 60);
const mfaProIp = createRateLimiter(20, 15 * 60);
const CodeSchema = z.string().trim().regex(/^(\d{6}|[A-Za-z0-9]{5}-?[A-Za-z0-9]{5})$/, "Bitte einen sechsstelligen Code oder Wiederherstellungscode eingeben.");

export interface MfaState { fehler?: string; erfolg?: string; geheimnis?: string; otpauth?: string; wiederherstellungscodes?: string[]; }

export async function starteMfaEinrichtung(_bisher: MfaState, _formData: FormData): Promise<MfaState> {
  let user;
  try { user = await requireMfaEinrichtungUser(); } catch (error) { return { fehler: error instanceof AuthError ? error.message : "MFA-Einrichtung nicht möglich." }; }
  const geheimnis = erstelleTotpGeheimnis();
  await prisma.user.update({ where: { id: user.id }, data: {
    mfaAusstehendesSecretVerschluesselt: verschluesseleMfaGeheimnis(geheimnis),
    mfaAusstehendBis: new Date(Date.now() + 15 * 60 * 1000),
  } });
  return { geheimnis, otpauth: otpauthUrl(user.email, geheimnis) };
}

export async function bestaetigeMfaEinrichtung(_bisher: MfaState, formData: FormData): Promise<MfaState> {
  let user;
  try { user = await requireMfaEinrichtungUser(); } catch (error) { return { fehler: error instanceof AuthError ? error.message : "MFA-Einrichtung nicht möglich." }; }
  const code = (formData.get("code") ?? "").toString().trim();
  if (!/^\d{6}$/.test(code)) return { fehler: "Bitte den sechsstelligen Code aus der Authenticator-App eingeben." };
  const konto = await prisma.user.findUnique({ where: { id: user.id }, select: { mfaAusstehendesSecretVerschluesselt: true, mfaAusstehendBis: true, sessionVersion: true } });
  const geheimnis = konto?.mfaAusstehendesSecretVerschluesselt ? entschluesseleMfaGeheimnis(konto.mfaAusstehendesSecretVerschluesselt) : null;
  const zaehler = geheimnis && konto?.mfaAusstehendBis && konto.mfaAusstehendBis > new Date() ? findeTotpZaehler(geheimnis, code) : null;
  if (zaehler === null) return { fehler: "Der Code ist ungültig oder die Einrichtung ist abgelaufen. Bitte erneut beginnen." };
  const wiederherstellungscodes = erstelleWiederherstellungscodes();
  // Compare-and-swap: Ein zweiter Browser-Tab darf weder einen frisch
  // gestarteten Schlüssel noch einen zwischenzeitlichen Versionswechsel
  // mit einem veralteten Einrichtungssnapshot überschreiben.
  const aktualisiert = await prisma.user.updateMany({ where: {
    id: user.id,
    sessionVersion: konto!.sessionVersion,
    mfaAktiviertAm: null,
    mfaAusstehendesSecretVerschluesselt: konto!.mfaAusstehendesSecretVerschluesselt,
    mfaAusstehendBis: { gt: new Date() },
  }, data: {
    mfaSecretVerschluesselt: konto!.mfaAusstehendesSecretVerschluesselt,
    mfaAusstehendesSecretVerschluesselt: null, mfaAusstehendBis: null, mfaAktiviertAm: new Date(), mfaLetzterZaehler: zaehler,
    mfaWiederherstellungscodeHashes: { set: wiederherstellungscodes.map(hasheWiederherstellungscode) }, sessionVersion: { increment: 1 },
  } });
  if (aktualisiert.count !== 1) return { fehler: "Die MFA-Einrichtung wurde zwischenzeitlich geändert. Bitte erneut beginnen." };
  await setSessionCookie(await signToken(user.id, konto!.sessionVersion + 1, true));
  await auditLog({ userId: user.id, aktion: "UPDATE", entitaet: "User", entitaetId: user.id, details: { mfaAktiviert: true } });
  return { erfolg: "Zwei-Faktor-Authentifizierung ist eingerichtet. Bewahren Sie die Wiederherstellungscodes sicher auf.", wiederherstellungscodes };
}

export async function bestaetigeMfaAnmeldung(_bisher: MfaState, formData: FormData): Promise<MfaState> {
  const eingabe = CodeSchema.safeParse((formData.get("code") ?? "").toString());
  if (!eingabe.success) return { fehler: eingabe.error.issues[0]!.message };
  const anfrage = await liesMfaAnmeldung();
  if (!anfrage) return { fehler: "Die Anmeldung ist abgelaufen. Bitte erneut anmelden." };
  const ip = getClientIp(await headers());
  const [kontoLimit, ipLimit] = [mfaProKonto.pruefen(anfrage.userId), mfaProIp.pruefen(ip)];
  if (!kontoLimit.erlaubt || !ipLimit.erlaubt) return { fehler: "Zu viele Versuche. Bitte später erneut anmelden." };
  const konto = await prisma.user.findUnique({ where: { id: anfrage.userId }, select: { id: true, role: true, isActive: true, sessionVersion: true, mfaSecretVerschluesselt: true, mfaLetzterZaehler: true, mfaWiederherstellungscodeHashes: true } });
  if (!konto || !konto.isActive || konto.sessionVersion !== anfrage.sessionVersion || !istPrivilegierteRolle(konto.role) || !konto.mfaSecretVerschluesselt) return { fehler: "Die Anmeldung ist nicht mehr gültig. Bitte erneut anmelden." };
  const code = eingabe.data;
  const geheimnis = entschluesseleMfaGeheimnis(konto.mfaSecretVerschluesselt);
  const zaehler = geheimnis ? findeTotpZaehler(geheimnis, code) : null;
  let erfolgreich = false;
  if (zaehler !== null) {
    const genutzt = await prisma.user.updateMany({ where: { id: konto.id, OR: [{ mfaLetzterZaehler: null }, { mfaLetzterZaehler: { lt: zaehler } }] }, data: { mfaLetzterZaehler: zaehler } });
    erfolgreich = genutzt.count === 1;
  } else {
    const hash = hasheWiederherstellungscode(code);
    // Der Array-Update muss serialisiert werden: Zwei parallele gültige Codes
    // dürfen einander nicht durch zwei veraltete Snapshots wieder einsetzen.
    erfolgreich = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${"mfa-recovery:" + konto.id}))`;
      const aktuell = await tx.user.findUnique({ where: { id: konto.id }, select: { mfaWiederherstellungscodeHashes: true } });
      if (!aktuell?.mfaWiederherstellungscodeHashes.includes(hash)) return false;
      await tx.user.update({ where: { id: konto.id }, data: { mfaWiederherstellungscodeHashes: { set: aktuell.mfaWiederherstellungscodeHashes.filter((wert) => wert !== hash) } } });
      return true;
    });
  }
  if (!erfolgreich) { await auditLog({ userId: konto.id, aktion: "LOGIN_FAILED", entitaet: "User", entitaetId: konto.id, details: { mfa: true, ip } }); return { fehler: "Der Code ist ungültig oder wurde bereits verwendet." }; }
  mfaProKonto.zuruecksetzen(konto.id); mfaProIp.zuruecksetzen(ip);
  await loescheMfaAnmeldeCookie(); await setSessionCookie(await signToken(konto.id, konto.sessionVersion, true));
  await prisma.user.update({ where: { id: konto.id }, data: { lastLoginAt: new Date() } });
  await auditLog({ userId: konto.id, aktion: "LOGIN", entitaet: "User", entitaetId: konto.id, details: { mfa: true } });
  redirect("/admin");
}
