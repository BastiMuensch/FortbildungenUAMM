/**
 * Regeln für die kurzen, öffentlichen Schulamtsadressen, etwa `/gz`.
 *
 * Dieses Modul bleibt absichtlich datenbank- und Next-unabhängig, damit die
 * Eingabe in der Server Action und der Resolver exakt dieselben Regeln nutzen.
 */

export const SCHULAMT_KUERZEL_MIN_LAENGE = 2;
export const SCHULAMT_KUERZEL_MAX_LAENGE = 60;

/** Routen, die nie durch einen Schulamtsbezirk belegt werden dürfen. */
export const RESERVIERTE_SCHULAMT_KUERZEL = new Set([
  "admin",
  "api",
  "datenschutz",
  "favicon.ico",
  "fortbildungen",
  "impressum",
  "kalender",
  "login",
  "referenten-registrierung",
  "robots.txt",
  "sitemap.xml",
  "zugang",
]);

const BEKANNTE_KUERZEL: Record<string, string> = {
  "guenzburg": "gz",
  "memmingen-unterallgaeu": "uamm",
};

/** Wandelt einen Namen in eine lesbare, ausschließlich ASCII-basierte Adresse. */
export function generiereSchulamtKuerzel(name: string): string {
  const basis = name
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SCHULAMT_KUERZEL_MAX_LAENGE)
    .replace(/-+$/g, "");

  const bekanntesKuerzel = BEKANNTE_KUERZEL[basis] ?? basis;
  if (!bekanntesKuerzel) return "schulamt";
  if (bekanntesKuerzel.length < SCHULAMT_KUERZEL_MIN_LAENGE || RESERVIERTE_SCHULAMT_KUERZEL.has(bekanntesKuerzel)) {
    return `schulamt-${bekanntesKuerzel}`.slice(0, SCHULAMT_KUERZEL_MAX_LAENGE).replace(/-+$/g, "");
  }
  return bekanntesKuerzel;
}

/** Liefert eine deutsche Fehlermeldung oder `null` für ein zulässiges Kürzel. */
export function pruefeSchulamtKuerzel(kuerzel: string): string | null {
  if (kuerzel.length < SCHULAMT_KUERZEL_MIN_LAENGE || kuerzel.length > SCHULAMT_KUERZEL_MAX_LAENGE) {
    return `Das Kürzel muss ${SCHULAMT_KUERZEL_MIN_LAENGE} bis ${SCHULAMT_KUERZEL_MAX_LAENGE} Zeichen lang sein.`;
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(kuerzel)) {
    return "Das Kürzel darf nur Kleinbuchstaben, Ziffern und Bindestriche enthalten.";
  }
  if (RESERVIERTE_SCHULAMT_KUERZEL.has(kuerzel)) {
    return "Dieses Kürzel ist für eine feste Seite reserviert.";
  }
  return null;
}

export function istGueltigesSchulamtKuerzel(kuerzel: string): boolean {
  return pruefeSchulamtKuerzel(kuerzel) === null;
}
