import { z } from "zod";

import { parseDatumZeitEingabe } from "@/lib/datetime";
import { istLeer } from "@/lib/sanitize";
import {
  FORMAT_VALUES,
  NIVEAUSTUFE_VALUES,
  ORGANISATIONSFORM_VALUES,
  SCHULART_VALUES,
  STATUS_VALUES,
} from "@/constants/fortbildung";
import { normalisiereSchlagwort, normalisiereSchlagwortListe } from "@/lib/schlagwort";

/**
 * Ein Schema für Formular und Server Action.
 *
 * Die Server Action ist ein eigener HTTP-Endpunkt — sie muss jede Regel selbst
 * prüfen, unabhängig davon, was das Formular im Browser bereits verhindert.
 * Deshalb liegt die Wahrheit hier und nicht in der Komponente.
 */

const datumFeld = (feldname: string) =>
  z
    .string()
    .min(1, `${feldname} ist ein Pflichtfeld.`)
    .transform((wert, ctx) => {
      const datum = parseDatumZeitEingabe(wert);
      if (!datum) {
        ctx.addIssue({
          code: "custom",
          message: `${feldname}: bitte Datum und Uhrzeit vollständig angeben.`,
        });
        return z.NEVER;
      }
      return datum;
    });

export const FortbildungSchema = z
  .object({
    titel: z
      .string()
      .trim()
      .min(3, "Der Lehrgangstitel muss mindestens 3 Zeichen haben.")
      .max(200, "Der Lehrgangstitel darf höchstens 200 Zeichen haben."),

    kurztitel: z
      .string()
      .trim()
      .max(100, "Der Kurztitel darf höchstens 100 Zeichen haben.")
      .optional()
      .transform((wert) => wert || null),

    beschreibungHtml: z
      .string()
      .max(50_000, "Die Beschreibung ist zu lang.")
      .refine((html) => !istLeer(html), "Bitte eine Lehrgangsbeschreibung eingeben."),

    organisationsform: z.enum(ORGANISATIONSFORM_VALUES, {
      message: "Bitte eine Organisationsform wählen.",
    }),

    maxTn: z.coerce
      .number({ message: "Bitte eine Zahl für die maximale Teilnehmerzahl angeben." })
      .int("Die maximale Teilnehmerzahl muss eine ganze Zahl sein.")
      .min(1, "Es muss mindestens ein Platz zur Verfügung stehen.")
      .max(1000, "Mehr als 1000 Plätze sind nicht plausibel."),

    format: z.enum(FORMAT_VALUES, {
      message: "Bitte ein Veranstaltungsformat wählen.",
    }),

    beginn: datumFeld("Beginn"),
    ende: datumFeld("Ende"),

    veranstaltungsortId: z
      .string()
      .min(1, "Bitte einen Veranstaltungsort wählen.")
      .uuid("Unbekannter Veranstaltungsort."),

    schularten: z
      .array(z.enum(SCHULART_VALUES))
      .min(1, "Bitte mindestens eine Schulart auswählen."),

    fach: z
      .string()
      .trim()
      .max(100, "Das Fach darf höchstens 100 Zeichen haben.")
      .optional()
      .transform((wert) => wert || null),

    niveaustufe: z
      .enum(NIVEAUSTUFE_VALUES)
      .nullish()
      .catch(null),

    /** Codes aus DigCompKompetenz, z. B. ["1", "1.2", "3.4"] */
    kompetenzen: z.array(z.string().regex(/^\d(\.\d+)?$/)).default([]),

    /** Freie Schlagwort-Namen; Pflicht-Tags kommen in der Action dazu. */
    schlagworte: z
      .array(
        z
          .string()
          .transform(normalisiereSchlagwort)
          .pipe(
            z
              .string()
              .min(2, "Ein Schlagwort braucht mindestens 2 Zeichen.")
              .max(60, "Ein Schlagwort darf höchstens 60 Zeichen haben."),
          ),
      )
      .max(30, "Mehr als 30 Schlagworte sind nicht sinnvoll.")
      .default([])
      .transform(normalisiereSchlagwortListe),

    referenten: z.array(z.string().uuid()).default([]),

    fibsLehrgangsnummer: z
      .string()
      .trim()
      .max(50)
      .optional()
      .transform((wert) => wert || null),

    fibsUrl: z
      .string()
      .trim()
      .optional()
      .transform((wert) => wert || null)
      .refine(
        (wert) => wert === null || /^https:\/\/[^\s]+$/i.test(wert),
        "Der FIBS-Link muss mit https:// beginnen.",
      ),

    status: z.enum(STATUS_VALUES).default("ENTWURF"),
  })
  .refine((daten) => daten.ende > daten.beginn, {
    message: "Das Ende muss nach dem Beginn liegen.",
    path: ["ende"],
  })
  .refine(
    (daten) =>
      daten.ende.getTime() - daten.beginn.getTime() <= 1000 * 60 * 60 * 24 * 30,
    {
      message: "Ein Lehrgang über mehr als 30 Tage ist vermutlich ein Tippfehler.",
      path: ["ende"],
    },
  );

export type FortbildungEingabe = z.infer<typeof FortbildungSchema>;

/**
 * Zusätzliche Anforderungen an eine Fortbildung, die veröffentlicht werden soll.
 *
 * Bewusst nur beim Veröffentlichen, nicht beim Speichern: Ein Entwurf muss
 * jederzeit zwischenspeicherbar sein, sonst geht angefangene Arbeit verloren,
 * wenn eine Angabe noch fehlt. Der Wizard führt ohnehin durch alle Schritte.
 */
/**
 * Nur die Felder, auf die es beim Veröffentlichen ankommt — so lässt sich die
 * Prüfung sowohl auf ein Formular als auch auf einen Datenbankdatensatz
 * anwenden (siehe freigeben() in src/actions/freigabe.ts).
 */
export interface VeroeffentlichungsDaten {
  status: string;
  niveaustufe?: string | null;
  kompetenzen: string[];
  referenten: string[];
}

export const VEROEFFENTLICHUNGS_PFLICHTEN: Array<{
  feld: string;
  pruefe: (daten: VeroeffentlichungsDaten) => boolean;
  meldung: string;
}> = [
  {
    feld: "niveaustufe",
    pruefe: (d) => Boolean(d.niveaustufe),
    meldung: "Vor dem Veröffentlichen bitte die Niveaustufe angeben.",
  },
  {
    feld: "kompetenzen",
    pruefe: (d) => d.kompetenzen.length > 0,
    meldung:
      "Vor dem Veröffentlichen bitte mindestens eine DigCompEdu-Kompetenz zuordnen — sonst ist die Fortbildung über den Kompetenzfilter nicht auffindbar.",
  },
  {
    feld: "referenten",
    pruefe: (d) => d.referenten.length > 0,
    meldung:
      "Vor dem Veröffentlichen bitte mindestens eine Referentin oder einen Referenten zuordnen.",
  },
];

/**
 * Prüft die Veröffentlichungs-Pflichten. Gibt die Feldfehler zurück, oder
 * null, wenn alles vollständig ist.
 */
export function pruefeVeroeffentlichung(
  daten: VeroeffentlichungsDaten,
): Record<string, string> | null {
  if (daten.status === "ENTWURF") return null;

  const fehler: Record<string, string> = {};
  for (const pflicht of VEROEFFENTLICHUNGS_PFLICHTEN) {
    if (!pflicht.pruefe(daten)) fehler[pflicht.feld] = pflicht.meldung;
  }

  return Object.keys(fehler).length > 0 ? fehler : null;
}

/**
 * Meldet Referenten-IDs, die nach dem Abgleich mit der Datenbank fehlen.
 *
 * Die Auswahl aus dem Formular ist nicht vertrauenswürdig: Eine formal
 * gültige UUID kann trotzdem auf keinen Referenteneintrag zeigen. Der Abgleich
 * muss vor der Veröffentlichungsprüfung stattfinden, damit eine nicht
 * existierende ID nicht als erfüllte Referentenpflicht zählt.
 */
export function fehlendeReferentIds(
  angefragt: string[],
  vorhanden: string[],
): string[] {
  const bekannteIds = new Set(vorhanden);
  return [...new Set(angefragt)].filter((id) => !bekannteIds.has(id));
}

/**
 * Ergebnis einer Formular-Aktion.
 * `fehler` ist nach Feldnamen sortiert, damit das Formular die Meldung direkt
 * am betroffenen Feld — und den Fehler-Punkt am betroffenen Tab — anzeigen kann.
 */
export interface FormularState {
  erfolg?: boolean;
  meldung?: string;
  fehler?: Record<string, string>;
}

/** Wandelt zod-Fehler in die flache Feld → Meldung-Struktur. */
export function zuFeldFehlern(error: z.ZodError): Record<string, string> {
  const fehler: Record<string, string> = {};
  for (const issue of error.issues) {
    const feld = issue.path.join(".") || "_";
    // Nur die erste Meldung pro Feld — mehr überfordert beim Korrigieren.
    fehler[feld] ??= issue.message;
  }
  return fehler;
}

/** Liest die Formulardaten in die Struktur, die das Schema erwartet. */
export function formDataZuEingabe(formData: FormData) {
  const text = (name: string) => (formData.get(name) as string | null)?.toString() ?? "";
  const liste = (name: string) =>
    formData.getAll(name).map((wert) => wert.toString()).filter(Boolean);

  return {
    titel: text("titel"),
    kurztitel: text("kurztitel"),
    beschreibungHtml: text("beschreibungHtml"),
    organisationsform: text("organisationsform"),
    maxTn: text("maxTn"),
    format: text("format"),
    beginn: text("beginn"),
    ende: text("ende"),
    veranstaltungsortId: text("veranstaltungsortId"),
    schularten: liste("schularten"),
    fach: text("fach"),
    niveaustufe: text("niveaustufe") || null,
    kompetenzen: liste("kompetenzen"),
    schlagworte: liste("schlagworte"),
    referenten: liste("referenten"),
    fibsLehrgangsnummer: text("fibsLehrgangsnummer"),
    fibsUrl: text("fibsUrl"),
    status: text("status") || "ENTWURF",
  };
}

/**
 * Zuordnung Feld → Tab, damit das Formular am richtigen Reiter einen
 * Fehlerpunkt setzen kann. Ein Fehler in einem geschlossenen Tab wäre sonst
 * unsichtbar und das Formular ließe sich scheinbar grundlos nicht speichern.
 */
export const FELD_ZU_TAB: Record<string, string> = {
  titel: "eckdaten",
  kurztitel: "eckdaten",
  organisationsform: "eckdaten",
  maxTn: "eckdaten",
  format: "eckdaten",
  beginn: "eckdaten",
  ende: "eckdaten",
  veranstaltungsortId: "eckdaten",
  status: "eckdaten",
  fibsLehrgangsnummer: "eckdaten",
  fibsUrl: "eckdaten",
  beschreibungHtml: "beschreibung",
  schularten: "zielgruppe",
  fach: "zielgruppe",
  schlagworte: "zielgruppe",
  niveaustufe: "digcomp",
  kompetenzen: "digcomp",
  referenten: "referenten",
};

/** Auch Listenfehler wie „schlagworte.0“ gehören zum jeweiligen Abschnitt. */
export function fehlerTab(feld: string): string | undefined {
  return FELD_ZU_TAB[feld.split(".")[0]!];
}
