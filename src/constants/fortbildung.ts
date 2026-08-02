/**
 * Zentrale Werteliste für alle aufzählbaren Felder einer Fortbildung.
 *
 * Die Datenbank speichert diese Werte als String (siehe Kommentar in
 * prisma/schema.prisma). Hier — und nur hier — werden sie gepflegt; zod,
 * Formular, Filter und Export leiten sich davon ab.
 */

/** Hilfstyp: aus einer `as const`-Liste den Union-Typ der `value`s ziehen. */
type ValueOf<T extends ReadonlyArray<{ value: string }>> = T[number]["value"];

// ---------------------------------------------------------------------------

/**
 * Die drei Ebenen der bayerischen Lehrerfortbildung.
 *
 * Der Datenbankwert `REGIONAL` bleibt aus Rücksicht auf bestehende Einträge
 * unverändert — nach außen heißt diese Ebene RLFB.
 */
export const ORGANISATIONSFORMEN = [
  {
    value: "SCHILF",
    label: "SchiLf",
    kurz: "SchiLf",
    beschreibung: "Schulinterne Lehrerfortbildung an einer einzelnen Schule.",
  },
  {
    value: "REGIONAL",
    label: "RLFB (regional)",
    kurz: "RLFB",
    beschreibung:
      "Regionale Lehrerfortbildung des Schulamts, ausgeschrieben über FIBS.",
  },
  {
    value: "ALP",
    label: "ALP Dillingen",
    kurz: "ALP",
    beschreibung:
      "Zentrale Lehrerfortbildung der Akademie für Lehrerfortbildung und Personalführung.",
  },
] as const;

export type Organisationsform = ValueOf<typeof ORGANISATIONSFORMEN>;

/** Reihenfolge für Berichte und Exporte: SchiLf, RLFB, ALP. */
export const ORGANISATIONSFORM_REIHENFOLGE: Organisationsform[] = [
  "SCHILF",
  "REGIONAL",
  "ALP",
];

/** Kurzform für Tabellen und PDF-Überschriften. */
export function organisationsformKurz(wert: string): string {
  return ORGANISATIONSFORMEN.find((o) => o.value === wert)?.kurz ?? wert;
}

/**
 * Farbklassen je Ebene.
 *
 * Als vollständige Klassennamen hinterlegt, weil Tailwind zusammengesetzte
 * Namen wie `bg-${wert}` nicht findet. Die Farben selbst stehen als Token in
 * globals.css.
 */
const EBENE_KLASSEN = {
  SCHILF: {
    text: "text-schilf",
    flaeche: "bg-schilf-weich text-schilf",
    balken: "bg-schilf",
  },
  REGIONAL: {
    text: "text-regional",
    flaeche: "bg-regional-weich text-regional",
    balken: "bg-regional",
  },
  ALP: {
    text: "text-alp",
    flaeche: "bg-alp-weich text-alp",
    balken: "bg-alp",
  },
} as const;

export function ebeneKlassen(wert: string) {
  return EBENE_KLASSEN[wert as keyof typeof EBENE_KLASSEN] ?? EBENE_KLASSEN.REGIONAL;
}

// ---------------------------------------------------------------------------

export const VERANSTALTUNGSFORMATE = [
  { value: "ESESSION", label: "eSession" },
  { value: "PRAESENZ", label: "Präsenz" },
] as const;

export type Veranstaltungsformat = ValueOf<typeof VERANSTALTUNGSFORMATE>;

// ---------------------------------------------------------------------------

/**
 * Schularten. `standard: true` wird im Formular vorausgewählt — das Schulamt
 * Memmingen-Unterallgäu ist für Grund- und Mittelschulen zuständig, alles
 * andere ist der Ausnahmefall.
 */
export const SCHULARTEN = [
  { value: "GRUNDSCHULE", label: "Grundschule", standard: true },
  { value: "MITTELSCHULE", label: "Mittelschule", standard: true },
  { value: "FOERDERSCHULE", label: "Förderschule", standard: false },
  { value: "REALSCHULE", label: "Realschule", standard: false },
  { value: "GYMNASIUM", label: "Gymnasium", standard: false },
  { value: "BERUFLICHE_SCHULE", label: "Berufliche Schule", standard: false },
  { value: "SCHULARTUEBERGREIFEND", label: "Schulartübergreifend", standard: false },
] as const;

export type Schulart = ValueOf<typeof SCHULARTEN>;

export const SCHULARTEN_STANDARD: Schulart[] = SCHULARTEN.filter(
  (s) => s.standard,
).map((s) => s.value);

// ---------------------------------------------------------------------------

export const NIVEAUSTUFEN = [
  { value: "NIVEAU_I_II", label: "Niveaustufe I/II" },
  { value: "NIVEAU_III", label: "Niveaustufe III" },
  { value: "NIVEAU_IV", label: "Niveaustufe IV" },
] as const;

export type Niveaustufe = ValueOf<typeof NIVEAUSTUFEN>;

// ---------------------------------------------------------------------------

export const STATUS = [
  {
    value: "ENTWURF",
    label: "Entwurf",
    beschreibung: "In Arbeit. Nur intern sichtbar, erscheint nicht im Frontend.",
  },
  {
    value: "EINGEREICHT",
    label: "Zur Freigabe eingereicht",
    beschreibung:
      "Wartet auf die Freigabe durch die Redaktion. Noch nicht im Frontend.",
  },
  {
    value: "VEROEFFENTLICHT",
    label: "Veröffentlicht",
    beschreibung: "Für Lehrkräfte sichtbar, im Kalender und im ICS-Feed.",
  },
  {
    value: "ABGESAGT",
    label: "Abgesagt",
    beschreibung: "Bleibt sichtbar, ist aber deutlich als abgesagt markiert.",
  },
  {
    value: "ARCHIVIERT",
    label: "Archiviert",
    beschreibung: "Aus dem Frontend genommen, im Admin weiter auffindbar.",
  },
] as const;

export type FortbildungStatus = ValueOf<typeof STATUS>;

/** Im öffentlichen Frontend sichtbare Status. */
export const STATUS_OEFFENTLICH: FortbildungStatus[] = [
  "VEROEFFENTLICHT",
  "ABGESAGT",
];

/**
 * Status, die Referentinnen und Referenten selbst setzen dürfen.
 *
 * Veröffentlichen ist ausdrücklich der Redaktion vorbehalten — eine
 * Ausschreibung auf der Seite des Schulamts soll niemand ohne Gegenlesen
 * online stellen können.
 */
export const STATUS_FUER_REFERENTEN: FortbildungStatus[] = [
  "ENTWURF",
  "EINGEREICHT",
];

/** Darf diese Rolle selbst veröffentlichen und freigeben? */
export function darfFreigeben(rolle: Rolle): boolean {
  return rolle === "ADMIN" || rolle === "REDAKTEUR";
}

// ---------------------------------------------------------------------------

export const QUELLEN = [
  { value: "MANUELL", label: "Manuell erfasst" },
  { value: "FIBS_IMPORT", label: "Aus FIBS importiert" },
] as const;

export type Quelle = ValueOf<typeof QUELLEN>;

// ---------------------------------------------------------------------------

export const ROLLEN = [
  {
    value: "ADMIN",
    label: "Administration",
    beschreibung: "Alle Rechte, inklusive Benutzerverwaltung und Systemtexten.",
  },
  {
    value: "REDAKTEUR",
    label: "Redaktion",
    beschreibung: "Darf Fortbildungen, Referenten, Orte und Schlagworte pflegen.",
  },
  {
    value: "REFERENT",
    label: "Referent",
    beschreibung:
      "Darf eigene Fortbildungen anlegen und pflegen sowie Teilnehmerzahlen melden.",
  },
] as const;

export type Rolle = ValueOf<typeof ROLLEN>;

// ---------------------------------------------------------------------------

/**
 * Schlagworte, die an jeder Fortbildung dieses Schulamts hängen müssen.
 * Werden im Formular als nicht entfernbare Chips gezeigt UND serverseitig
 * erneut angehängt — die Anzeige allein wäre manipulierbar.
 */
export const PFLICHT_SCHLAGWORTE = ["UAMM", "Medienteam-UAMM"] as const;

// ---------------------------------------------------------------------------
// Hilfsfunktionen für Labels

function labelLookup<T extends ReadonlyArray<{ value: string; label: string }>>(
  list: T,
) {
  return (value: string | null | undefined): string => {
    if (!value) return "—";
    return list.find((entry) => entry.value === value)?.label ?? value;
  };
}

export const organisationsformLabel = labelLookup(ORGANISATIONSFORMEN);
export const formatLabel = labelLookup(VERANSTALTUNGSFORMATE);
export const schulartLabel = labelLookup(SCHULARTEN);
export const niveaustufeLabel = labelLookup(NIVEAUSTUFEN);
export const statusLabel = labelLookup(STATUS);
export const rolleLabel = labelLookup(ROLLEN);

/** Reine Werte-Arrays, wie zod sie für `z.enum()` erwartet. */
export const ORGANISATIONSFORM_VALUES = ORGANISATIONSFORMEN.map((o) => o.value) as [
  Organisationsform,
  ...Organisationsform[],
];
export const FORMAT_VALUES = VERANSTALTUNGSFORMATE.map((f) => f.value) as [
  Veranstaltungsformat,
  ...Veranstaltungsformat[],
];
export const SCHULART_VALUES = SCHULARTEN.map((s) => s.value) as [
  Schulart,
  ...Schulart[],
];
export const NIVEAUSTUFE_VALUES = NIVEAUSTUFEN.map((n) => n.value) as [
  Niveaustufe,
  ...Niveaustufe[],
];
export const STATUS_VALUES = STATUS.map((s) => s.value) as [
  FortbildungStatus,
  ...FortbildungStatus[],
];
export const ROLLE_VALUES = ROLLEN.map((r) => r.value) as [Rolle, ...Rolle[]];
