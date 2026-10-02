import { z } from "zod";

export const MAX_BESCHEINIGUNGEN = 100;

export const BescheinigungsAnfrageSchema = z.object({
  id: z.string().uuid("Bitte eine gültige Fortbildung auswählen."),
  anzahl: z.string().regex(/^[1-9]\d{0,2}$/, "Bitte eine ganze Anzahl zwischen 1 und 100 eingeben.")
    .transform(Number).pipe(z.number().int().min(1).max(MAX_BESCHEINIGUNGEN, "Höchstens 100 Exemplare pro PDF.")),
});

/** Auch vor dem Termin druckbar, damit die Blätter vor Ort bereitliegen. */
export function istBescheinigungVerfuegbar(fortbildung: { organisationsform: string; status: string }): boolean {
  return fortbildung.organisationsform === "SCHILF" &&
    (fortbildung.status === "VEROEFFENTLICHT" || fortbildung.status === "ARCHIVIERT");
}
