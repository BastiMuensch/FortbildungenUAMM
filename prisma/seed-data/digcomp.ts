/**
 * DigCompEdu Bavaria — Kompetenzrahmen als Baum.
 *
 * Kompetenzbereich 1 ist mit den vom Schulamt vorgegebenen Unterkompetenzen
 * hinterlegt. Die Bereiche 2–6 tragen die Titel des DigCompEdu-Rahmens in der
 * Gliederung, die das Schulamt vorgegeben hat (2.1–2.3, 3.1–3.4, 4.1–4.3,
 * 5.1–5.3, 6.1–6.5); die genauen bayerischen Formulierungen sind noch
 * abzugleichen. Diese Einträge sind deshalb mit `istPlatzhalter: true`
 * markiert und im Formular entsprechend gekennzeichnet.
 *
 * Zum Aktualisieren: Titel hier ändern und `npm run db:seed` erneut laufen
 * lassen — der Seed arbeitet mit upsert, bestehende Zuordnungen zu
 * Fortbildungen bleiben erhalten, solange der `code` gleich bleibt.
 */

export interface KompetenzSeed {
  code: string;
  titel: string;
  beschreibung?: string;
  istPlatzhalter?: boolean;
  children: KompetenzSeed[];
}

export const DIGCOMP_BAUM: KompetenzSeed[] = [
  {
    code: "1",
    titel: "Berufsbezogenes Handeln",
    beschreibung:
      "Digitale Technologien für Kommunikation, Zusammenarbeit und die eigene professionelle Weiterentwicklung nutzen.",
    children: [
      { code: "1.1", titel: "Berufliche Kommunikation", children: [] },
      { code: "1.2", titel: "Kollegiale Zusammenarbeit", children: [] },
      { code: "1.3", titel: "Reflektiertes Handeln", children: [] },
      { code: "1.4", titel: "Kontinuierliche Weiterentwicklung", children: [] },
    ],
  },
  {
    code: "2",
    titel: "Digitale Ressourcen",
    beschreibung:
      "Digitale Materialien auswählen, erstellen, anpassen und rechtssicher teilen.",
    children: [
      {
        code: "2.1",
        titel: "Auswählen digitaler Ressourcen",
        istPlatzhalter: true,
        children: [],
      },
      {
        code: "2.2",
        titel: "Erstellen und Anpassen digitaler Ressourcen",
        istPlatzhalter: true,
        children: [],
      },
      {
        code: "2.3",
        titel: "Organisieren, Schützen und Teilen digitaler Ressourcen",
        istPlatzhalter: true,
        children: [],
      },
    ],
  },
  {
    code: "3",
    titel: "Lehren und Lernen",
    beschreibung:
      "Digitale Technologien im Unterricht didaktisch begründet einsetzen.",
    children: [
      { code: "3.1", titel: "Lehren", istPlatzhalter: true, children: [] },
      { code: "3.2", titel: "Lernbegleitung", istPlatzhalter: true, children: [] },
      {
        code: "3.3",
        titel: "Kollaboratives Lernen",
        istPlatzhalter: true,
        children: [],
      },
      {
        code: "3.4",
        titel: "Selbstgesteuertes Lernen",
        istPlatzhalter: true,
        children: [],
      },
    ],
  },
  {
    code: "4",
    titel: "Lerndiagnose und Feedback",
    beschreibung:
      "Lernstände digital erheben, auswerten und für Feedback und Planung nutzen.",
    children: [
      {
        code: "4.1",
        titel: "Lernstandserhebung",
        istPlatzhalter: true,
        children: [],
      },
      {
        code: "4.2",
        titel: "Analyse der Lernergebnisse",
        istPlatzhalter: true,
        children: [],
      },
      {
        code: "4.3",
        titel: "Feedback und Planung",
        istPlatzhalter: true,
        children: [],
      },
    ],
  },
  {
    code: "5",
    titel: "Lernendenorientierung",
    beschreibung:
      "Digitale Technologien für Teilhabe, Differenzierung und aktive Einbindung nutzen.",
    children: [
      {
        code: "5.1",
        titel: "Barrierefreiheit und Inklusion",
        istPlatzhalter: true,
        children: [],
      },
      {
        code: "5.2",
        titel: "Differenzierung und Individualisierung",
        istPlatzhalter: true,
        children: [],
      },
      {
        code: "5.3",
        titel: "Aktive Einbindung der Lernenden",
        istPlatzhalter: true,
        children: [],
      },
    ],
  },
  {
    code: "6",
    titel: "Medienkompetenz der Lernenden",
    beschreibung:
      "Schülerinnen und Schüler beim Aufbau eigener digitaler Kompetenzen begleiten.",
    children: [
      {
        code: "6.1",
        titel: "Informations- und Medienkompetenz",
        istPlatzhalter: true,
        children: [],
      },
      {
        code: "6.2",
        titel: "Kommunizieren und Kooperieren",
        istPlatzhalter: true,
        children: [],
      },
      {
        code: "6.3",
        titel: "Produzieren und Präsentieren",
        istPlatzhalter: true,
        children: [],
      },
      {
        code: "6.4",
        titel: "Analysieren und Reflektieren",
        istPlatzhalter: true,
        children: [],
      },
      {
        code: "6.5",
        titel: "Problemlösen und Handeln",
        istPlatzhalter: true,
        children: [],
      },
    ],
  },
];
