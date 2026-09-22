import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function schluessel(): Buffer {
  const geheimnis = process.env.JWT_SECRET;
  if (!geheimnis || geheimnis.length < 32) throw new Error("JWT_SECRET fehlt oder ist zu kurz.");
  return createHash("sha256").update("bdb-zugangslink-v1\0").update(geheimnis).digest();
}

/** Separater Schlüsselkontext und Kontobindung für wieder anzeigbare Links. */
export function verschluesseleZugangslinkToken(token: string, userId: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", schluessel(), iv);
  cipher.setAAD(Buffer.from(userId));
  const inhalt = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), inhalt.toString("base64url")].join(".");
}

/** Schlüsselwechsel oder beschädigte Daten verhindern nur die erneute Anzeige. */
export function entschluesseleZugangslinkToken(wert: string, userId: string): string | null {
  try {
    const [version, iv, tag, inhalt, extra] = wert.split(".");
    if (version !== "v1" || !iv || !tag || !inhalt || extra !== undefined) return null;
    const decipher = createDecipheriv("aes-256-gcm", schluessel(), Buffer.from(iv, "base64url"));
    decipher.setAAD(Buffer.from(userId));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(inhalt, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
