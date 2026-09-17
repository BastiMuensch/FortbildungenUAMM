/** Nur die angeklickte Kompetenz ändern; Bereich und Unterkompetenzen sind unabhängig. */
export function kompetenzAuswahlUmschalten(auswahl: string[], code: string, aktiv: boolean): string[] {
  const naechste = new Set(auswahl);
  if (aktiv) naechste.add(code);
  else naechste.delete(code);
  return [...naechste].sort();
}

/** Mehrere Suchwörter dürfen sich auf Schulname und Ort verteilen. */
export function filtereOrte<T extends { name: string; ort: string | null }>(orte: T[], suche: string): T[] {
  const normalisiere = (text: string) => text.toLocaleLowerCase("de-DE").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss");
  const woerter = normalisiere(suche).trim().split(/\s+/).filter(Boolean);
  return orte.filter((ort) => {
    const text = normalisiere(`${ort.name} ${ort.ort ?? ""}`);
    return woerter.every((wort) => text.includes(wort));
  });
}
