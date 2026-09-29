import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { NAMENSFREIGABE_VERSION } from "@/constants/fortbildung";

/** Ein alter Sichtbarkeitsschalter allein darf keine Namen veröffentlichen. */
export const oeffentlicherReferentWhere = {
  oeffentlichSichtbar: true,
  aktiv: true,
  user: { isActive: true },
  oeffentlicheEinwilligungVersion: NAMENSFREIGABE_VERSION,
  oeffentlicheEinwilligungAm: { not: null },
} satisfies Prisma.ReferentWhereInput;

/** Nur die ausdrücklich freigegebenen Namen verlassen den internen Bereich. */
export const oeffentlicherReferentSelect = {
  vorname: true,
  nachname: true,
} satisfies Prisma.ReferentSelect;

export function organisationsKennzeichnungen(bezirkName: string): [string, string] {
  return [
    `Referentennetzwerk digitale Bildung – ${bezirkName}`,
    `Beratung digitale Bildung – ${bezirkName}`,
  ];
}

export const NamensentscheidungSchema = z.object({
  zustimmung: z.enum(["on"]).nullable().transform((wert) => wert === "on"),
  version: z.string().nullable(),
}).refine((wert) => !wert.zustimmung || wert.version === NAMENSFREIGABE_VERSION, {
  message: "Der Einwilligungstext wurde geändert. Bitte die Seite neu laden und erneut entscheiden.",
  path: ["zustimmung"],
});

export function leseNamensentscheidung(formData: FormData) {
  return NamensentscheidungSchema.safeParse({
    zustimmung: formData.get("namensfreigabe"),
    version: formData.get("namensfreigabeVersion"),
  });
}
