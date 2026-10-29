import { z } from "zod";

export const KontaktEmailSchema = z.string().trim().max(254, "Die E-Mail-Adresse ist zu lang.")
  .pipe(z.union([z.literal(""), z.string().email("Bitte eine gültige E-Mail-Adresse angeben.")]));

/** Alle Bestandteile werden einzeln kodiert, auch Pluszeichen in der Adresse. */
export function bezirksKontaktLink(email: string, bezirkName: string, fortbildungsanfrage = false): string {
  const betreff = `${fortbildungsanfrage ? "Fortbildungsanfrage" : "Kontakt"} – Schulamtsbezirk ${bezirkName}`;
  const text = fortbildungsanfrage
    ? [
      "Guten Tag,", "", "ich möchte eine Fortbildung anfragen.", "",
      "Thema / Fortbildungswunsch:", "Schule / Dienststelle:", "Zielgruppe und ungefähre Gruppengröße:",
      "Gewünschter Zeitraum:", "Gewünschtes Format / Ort (z. B. SchiLf an der Schule oder online):",
      "Weitere Angaben:", "", "Name und Rückkontakt:", "", "Vielen Dank!",
    ].join("\r\n")
    : "Guten Tag,\r\n\r\nmein Anliegen:\r\n\r\n\r\nMit freundlichen Grüßen";
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(betreff)}&body=${encodeURIComponent(text)}`;
}
