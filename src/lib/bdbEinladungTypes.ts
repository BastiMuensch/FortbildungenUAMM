/** Der zuletzt gespeicherte Zugangslink eines BdB-Kontos für die RvS-Verwaltung. */
export type BdbEinladung = {
  status: "OFFEN" | "VERWENDET" | "ABGELAUFEN" | "DEAKTIVIERT" | "NICHT_ANZEIGBAR";
  link: string | null;
  gueltigBis: string;
  erstelltAm: string;
  verwendetAm: string | null;
  zweck: "EINLADUNG" | "PASSWORT_RESET";
};
