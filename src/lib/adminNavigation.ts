import { aktuellesSchuljahr } from "@/lib/datetime";
import { parseSchuljahr, schuljahrBezeichnung } from "@/lib/schuljahr";

type KontextParameter = {
  bezirk?: string | string[];
  schuljahr?: string | string[];
};

/** Bereich und Schuljahr reisen mit; lokale Such- und Arbeitsfilter bleiben auf ihrer Seite. */
export function adminBereichUrl(pfad: string, params: KontextParameter): string {
  const url = new URL(pfad, "https://intern.invalid");
  for (const name of ["bezirk", "schuljahr"] as const) {
    const roh = params[name];
    const wert = (Array.isArray(roh) ? roh[0] : roh)?.trim();
    if (wert) url.searchParams.set(name, wert);
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Dieselbe Vorgabe wie in den Arbeitsansichten; „alle“ ist eine bewusste Auswahl. */
export function adminSchuljahr(wert: string | null | undefined, aktuell = aktuellesSchuljahr()): string {
  if (wert === "alle") return "alle";
  const jahr = parseSchuljahr(wert ?? undefined);
  return jahr === null ? aktuell : schuljahrBezeichnung(jahr);
}

/** Erlaubt Rücksprünge nur in die bekannten internen Arbeitslisten. */
export function erlaubteAdminRueckkehr(wert: string | string[] | undefined): string | null {
  const text = (Array.isArray(wert) ? wert[0] : wert)?.trim();
  if (!text) return null;

  try {
    const url = new URL(text, "https://intern.invalid");
    if (url.origin !== "https://intern.invalid") return null;
    if (!["/admin", "/admin/fortbildungen", "/admin/freigaben", "/admin/nachbereitung", "/admin/katalog"].includes(url.pathname)) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
