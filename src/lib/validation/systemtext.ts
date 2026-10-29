/** Redaktionelle Markierungen dürfen nicht als fertiger Rechtstext erscheinen. */
export function hatOffeneRechtstextAngaben(text: string): boolean {
  return /Platzhalter\s*[—–-]|\[\s*OFFEN\b/i.test(text);
}
