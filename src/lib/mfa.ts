import "server-only";

import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const SCHRITT_SEKUNDEN = 30;

function schluessel(): Buffer {
  const wert = process.env.MFA_ENCRYPTION_KEY;
  if (!wert || wert.length < 32) {
    throw new Error("MFA_ENCRYPTION_KEY fehlt oder ist zu kurz (mindestens 32 Zeichen).");
  }
  return createHash("sha256").update(wert).digest();
}

export function erstelleTotpGeheimnis(): string {
  const bytes = randomBytes(20);
  let bits = 0; let wert = 0; let ergebnis = "";
  for (const byte of bytes) {
    wert = (wert << 8) | byte; bits += 8;
    while (bits >= 5) { ergebnis += ALPHABET[(wert >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) ergebnis += ALPHABET[(wert << (5 - bits)) & 31];
  return ergebnis;
}

function base32Dekodieren(eingabe: string): Buffer {
  let bits = 0; let wert = 0; const bytes: number[] = [];
  for (const zeichen of eingabe.replace(/[\s-]/g, "").toUpperCase()) {
    const index = ALPHABET.indexOf(zeichen);
    if (index < 0) throw new Error("Ungültiges TOTP-Geheimnis.");
    wert = (wert << 5) | index; bits += 5;
    if (bits >= 8) { bytes.push((wert >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(bytes);
}

export function verschluesseleMfaGeheimnis(geheimnis: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", schluessel(), iv);
  const verschluesselt = Buffer.concat([cipher.update(geheimnis, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), verschluesselt]).toString("base64url");
}

export function entschluesseleMfaGeheimnis(wert: string): string | null {
  try {
    const daten = Buffer.from(wert, "base64url");
    if (daten.length < 29) return null;
    const decipher = createDecipheriv("aes-256-gcm", schluessel(), daten.subarray(0, 12));
    decipher.setAuthTag(daten.subarray(12, 28));
    return Buffer.concat([decipher.update(daten.subarray(28)), decipher.final()]).toString("utf8");
  } catch { return null; }
}

function totp(geheimnis: string, zaehler: number): string {
  const puffer = Buffer.alloc(8); puffer.writeBigUInt64BE(BigInt(zaehler));
  const hmac = createHmac("sha1", base32Dekodieren(geheimnis)).update(puffer).digest();
  const offset = hmac[hmac.length - 1]! & 15;
  return String((((hmac[offset]! & 127) << 24) | (hmac[offset + 1]! << 16) | (hmac[offset + 2]! << 8) | hmac[offset + 3]!) % 1_000_000).padStart(6, "0");
}

export function findeTotpZaehler(geheimnis: string, code: string, jetzt = Date.now()): number | null {
  if (!/^\d{6}$/.test(code)) return null;
  const aktuell = Math.floor(jetzt / 1000 / SCHRITT_SEKUNDEN);
  const pruefcode = Buffer.from(code);
  for (const verschiebung of [-1, 0, 1]) {
    const erwartet = Buffer.from(totp(geheimnis, aktuell + verschiebung));
    if (timingSafeEqual(pruefcode, erwartet)) return aktuell + verschiebung;
  }
  return null;
}

export function otpauthUrl(email: string, geheimnis: string): string {
  const aussteller = "Fortbildungen UAMM";
  return `otpauth://totp/${encodeURIComponent(`${aussteller}:${email}`)}?secret=${geheimnis}&issuer=${encodeURIComponent(aussteller)}&algorithm=SHA1&digits=6&period=${SCHRITT_SEKUNDEN}`;
}

export function erstelleWiederherstellungscodes(): string[] {
  return Array.from({ length: 10 }, () => randomBytes(5).toString("hex").toUpperCase().match(/.{1,5}/g)!.join("-"));
}
export function hasheWiederherstellungscode(code: string): string {
  return createHash("sha256").update(code.replace(/[\s-]/g, "").toUpperCase()).digest("hex");
}
export function istPrivilegierteRolle(rolle: string): boolean {
  return ["RVS", "ADMIN"].includes(rolle);
}
