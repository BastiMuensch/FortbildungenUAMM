import type { Prisma } from "@prisma/client";
import { berlinIsoDatum, fromDatetimeLocalValue } from "@/lib/datetime";

/** Schuljahre werden über ihr Anfangsjahr bezeichnet, z. B. 2026 für 2026/2027. */
export function parseSchuljahr(wert: string | undefined): number | null {
  if (!wert) return null;
  const treffer = /^([1-9]\d{3})(?:\/([1-9]\d{3}))?$/.exec(wert);
  if (!treffer) return null;
  const jahr = Number(treffer[1]);
  return jahr < 9999 && (!treffer[2] || Number(treffer[2]) === jahr + 1) ? jahr : null;
}

export function schuljahrFuerDatum(datum: Date): number {
  const [jahr, monat] = berlinIsoDatum(datum).split("-").map(Number);
  return monat >= 8 ? jahr : jahr - 1;
}

export function schuljahrBezeichnung(jahr: number): string {
  return `${jahr}/${jahr + 1}`;
}

export function schuljahrBeginn(jahr: number): Date {
  if (!Number.isInteger(jahr) || jahr < 1000 || jahr > 9998) throw new Error("Ungültiges Schuljahr.");
  return fromDatetimeLocalValue(`${jahr}-08-01T00:00`)!;
}

/** 400 volle Berliner Kalendertage ab dem 1. August NACH Schuljahresende. */
export function schuljahrFristende(jahr: number): Date {
  schuljahrBeginn(jahr);
  // UTC dient nur als Kalenderrechner. Erst das Ergebnis wird Berliner Mitternacht.
  const kalender = new Date(Date.UTC(jahr + 1, 7, 1 + 400, 12));
  return fromDatetimeLocalValue(`${berlinIsoDatum(kalender)}T00:00`)!;
}

/** Gilt auch für RvS, Kalender, Downloads und bei ausgefallenem Löschlauf. */
export function operativeFortbildungWhere(jetzt = new Date()): Prisma.FortbildungWhereInput {
  return { aufbewahrenBis: { gt: jetzt } };
}

export function schuljahrWhere(jahr: number): Prisma.FortbildungWhereInput {
  schuljahrBeginn(jahr);
  return { schuljahr: jahr };
}

export function istSchuljahrAbgelaufen(beginn: Date, jetzt = new Date()): boolean {
  return schuljahrFristende(schuljahrFuerDatum(beginn)) <= jetzt;
}
