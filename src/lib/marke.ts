/** Verhindert eine doppelte Benennung bei dem gemeinsamen Schwaben-Profil. */
export function fortbildungsZusatz(schulamtName: string): string {
  const name = schulamtName.trim();
  if (name.startsWith("Fortbildungen ·")) return name;
  if (name.startsWith("Fortbildungen ")) return name.replace(/^Fortbildungen\s+/, "Fortbildungen · ");
  return `Fortbildungen · ${name}`;
}
