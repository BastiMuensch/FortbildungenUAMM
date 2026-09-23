/** Öffentliche Identität eines Schulamts; keine Verwaltungs- oder Kontodaten. */
export type OeffentlicherBezirk = { id: string; name: string; kuerzel: string };

export function bereichsPfad(bezirk?: OeffentlicherBezirk): string {
  return bezirk ? `/${bezirk.kuerzel}` : "";
}

export function bereichsKalenderAbo(bezirk?: OeffentlicherBezirk): string {
  return bezirk ? `/api/ics?schulamt=${encodeURIComponent(bezirk.kuerzel)}` : "/api/ics";
}
