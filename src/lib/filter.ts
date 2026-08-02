import type { Prisma } from "@prisma/client";

import { fromDatetimeLocalValue } from "@/lib/datetime";
import {
  FORMAT_VALUES,
  NIVEAUSTUFE_VALUES,
  ORGANISATIONSFORM_VALUES,
  SCHULART_VALUES,
  STATUS_VALUES,
} from "@/constants/fortbildung";

/**
 * Filter aus der URL.
 *
 * Alle Filter leben in den Suchparametern, nicht im Client-State: Damit ist
 * jede Filterkombination ein teilbarer Link, der Zurück-Knopf funktioniert,
 * und die Liste kann als Server Component ohne JavaScript gerendert werden.
 */
export interface FortbildungFilter {
  q?: string;
  von?: string;
  bis?: string;
  organisationsform?: string;
  format?: string;
  schulart?: string;
  niveaustufe?: string;
  /** Kompetenzbereich, z. B. "3" — trifft auch alle Unterkompetenzen. */
  kb?: string;
  schlagwort?: string;
  status?: string;
  /** "offen" = noch nicht in FIBS, "erledigt" = eingetragen. */
  fibs?: string;
}

export type SuchParameter = Record<string, string | string[] | undefined>;

export function leseFilter(params: SuchParameter): FortbildungFilter {
  const einzeln = (name: string): string | undefined => {
    const wert = params[name];
    const text = Array.isArray(wert) ? wert[0] : wert;
    return text?.trim() || undefined;
  };

  return {
    q: einzeln("q"),
    von: einzeln("von"),
    bis: einzeln("bis"),
    organisationsform: erlaubt(einzeln("organisationsform"), ORGANISATIONSFORM_VALUES),
    format: erlaubt(einzeln("format"), FORMAT_VALUES),
    schulart: erlaubt(einzeln("schulart"), SCHULART_VALUES),
    niveaustufe: erlaubt(einzeln("niveaustufe"), NIVEAUSTUFE_VALUES),
    kb: /^[1-6]$/.test(einzeln("kb") ?? "") ? einzeln("kb") : undefined,
    schlagwort: einzeln("schlagwort"),
    status: erlaubt(einzeln("status"), STATUS_VALUES),
    fibs: erlaubt(einzeln("fibs"), ["offen", "erledigt"]),
  };
}

function erlaubt(wert: string | undefined, werte: readonly string[]): string | undefined {
  return wert && werte.includes(wert) ? wert : undefined;
}

/** Übersetzt die Filter in eine Prisma-Bedingung. */
export function filterZuWhere(filter: FortbildungFilter): Prisma.FortbildungWhereInput {
  const und: Prisma.FortbildungWhereInput[] = [];

  if (filter.q) {
    und.push({
      OR: [
        { titel: { contains: filter.q, mode: "insensitive" } },
        { kurztitel: { contains: filter.q, mode: "insensitive" } },
        { beschreibungText: { contains: filter.q, mode: "insensitive" } },
        { fach: { contains: filter.q, mode: "insensitive" } },
        { veranstaltungsort: { name: { contains: filter.q, mode: "insensitive" } } },
      ],
    });
  }

  const von = tagesGrenze(filter.von, "start");
  const bis = tagesGrenze(filter.bis, "ende");

  // Ein Zeitraumfilter meint "findet in diesem Zeitraum statt", nicht "beginnt
  // darin" — ein mehrtägiger Lehrgang soll auch am zweiten Tag gefunden werden.
  if (von) und.push({ ende: { gte: von } });
  if (bis) und.push({ beginn: { lte: bis } });

  if (filter.organisationsform) und.push({ organisationsform: filter.organisationsform });
  if (filter.format) und.push({ format: filter.format });
  if (filter.niveaustufe) und.push({ niveaustufe: filter.niveaustufe });
  if (filter.status) und.push({ status: filter.status });
  if (filter.schulart) und.push({ schularten: { has: filter.schulart } });

  if (filter.kb) {
    // "3" trifft den Bereich selbst und jede Unterkompetenz "3.x".
    und.push({
      kompetenzen: {
        some: { kompetenzCode: { startsWith: filter.kb } },
      },
    });
  }

  if (filter.fibs === "offen") und.push({ inFibs: false });
  if (filter.fibs === "erledigt") und.push({ inFibs: true });

  if (filter.schlagwort) {
    und.push({
      schlagworte: { some: { schlagwort: { name: filter.schlagwort } } },
    });
  }

  return und.length > 0 ? { AND: und } : {};
}

/** "2026-09-15" aus einem <input type="date"> zu Berliner Tagesgrenze. */
function tagesGrenze(wert: string | undefined, kante: "start" | "ende"): Date | null {
  if (!wert || !/^\d{4}-\d{2}-\d{2}$/.test(wert)) return null;
  return fromDatetimeLocalValue(
    `${wert}T${kante === "start" ? "00:00" : "23:59"}`,
  );
}

/** Zählt die aktiven Filter — für den "Filter zurücksetzen"-Hinweis. */
export function anzahlAktiverFilter(filter: FortbildungFilter): number {
  return Object.values(filter).filter(Boolean).length;
}

/** Baut eine URL mit geänderten Parametern, leere Werte fallen raus. */
export function baueUrl(
  basis: string,
  bisher: SuchParameter,
  aenderungen: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();

  for (const [key, wert] of Object.entries(bisher)) {
    const text = Array.isArray(wert) ? wert[0] : wert;
    if (text) params.set(key, text);
  }

  for (const [key, wert] of Object.entries(aenderungen)) {
    if (wert) params.set(key, wert);
    else params.delete(key);
  }

  const query = params.toString();
  return query ? `${basis}?${query}` : basis;
}
