/**
 * Die Schritte des Wizards.
 *
 * Dieselben Abschnitte dienen im Bearbeiten-Formular als Reiter — die
 * Zuordnung Feld → Abschnitt liegt deshalb nur einmal vor (FELD_ZU_TAB in
 * lib/validation/fortbildung.ts).
 */
export interface Schritt {
  id: string;
  titel: string;
  /** Kurze Erklärung, was in diesem Schritt gebraucht wird. */
  hilfe: string;
  /** Felder, die vor dem Weitergehen ausgefüllt sein müssen. */
  pflichtfelder: string[];
}

export const SCHRITTE: Schritt[] = [
  {
    id: "eckdaten",
    titel: "Eckdaten",
    hilfe:
      "Wann, wo und in welcher Form findet die Fortbildung statt? Diese Angaben stehen später in Kalender und Suchergebnis.",
    pflichtfelder: [
      "bezirkId", "titel",
      "organisationsform",
      "maxTn",
      "format",
      "beginn",
      "ende",
      "veranstaltungsortId",
    ],
  },
  {
    id: "beschreibung",
    titel: "Beschreibung",
    hilfe:
      "Worum geht es, für wen ist die Fortbildung gedacht, was sollen Teilnehmende mitbringen?",
    pflichtfelder: ["beschreibungHtml"],
  },
  {
    id: "zielgruppe",
    titel: "Zielgruppe",
    hilfe:
      "Schularten und Schlagworte bestimmen, wer die Fortbildung im Frontend findet.",
    pflichtfelder: ["schularten"],
  },
  {
    id: "digcomp",
    titel: "DigCompEdu",
    hilfe:
      "Niveaustufe und Kompetenzbereiche nach DigCompEdu Bavaria. Lehrkräfte filtern im Frontend gezielt danach.",
    pflichtfelder: ["niveaustufe", "kompetenzen"],
  },
  {
    id: "referenten",
    titel: "Referenten",
    hilfe: "Wer leitet die Veranstaltung?",
    pflichtfelder: ["referenten"],
  },
  {
    id: "pruefen",
    titel: "Prüfen",
    hilfe: "Alle Angaben im Überblick, bevor gespeichert wird.",
    pflichtfelder: [],
  },
];

export const SCHRITT_IDS = SCHRITTE.map((s) => s.id);
