import { Clock } from "lucide-react";
import { formatDatumZeit } from "@/lib/datetime";

export interface ZeitAenderung {
  ende: Date;
  endeVorKorrektur: Date | null;
  dauerKorrigiertAm: Date | null;
}

/** Sichtbarer Hinweis auf die letzte nachträgliche Endzeitkorrektur. */
export function ZeitAenderungsHinweis({ fortbildung, kompakt = false }: {
  fortbildung: ZeitAenderung;
  kompakt?: boolean;
}) {
  if (!fortbildung.dauerKorrigiertAm || !fortbildung.endeVorKorrektur) return null;
  const vorher = formatDatumZeit(fortbildung.endeVorKorrektur);
  const aktuell = formatDatumZeit(fortbildung.ende);
  const geaendertAm = formatDatumZeit(fortbildung.dauerKorrigiertAm);
  const hinweis = `Ende vor der letzten Korrektur: ${vorher} Uhr. Aktuelles Ende: ${aktuell} Uhr. Geändert am ${geaendertAm} Uhr.`;

  if (kompakt) return (
    <span title={hinweis} className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-ferien/40 bg-ferien/15 px-2 py-1 text-xs font-semibold text-foreground">
      <Clock className="size-3 shrink-0" aria-hidden />Zeit geändert
    </span>
  );

  return (
    <div className="rounded-lg border border-ferien/40 border-l-4 border-l-ferien bg-ferien/10 p-3 text-sm">
      <p className="flex items-center gap-2 font-semibold"><Clock className="size-4" aria-hidden />Zeit geändert</p>
      <p className="mt-1">Ende zuvor: <span className="zahl">{vorher} Uhr</span></p>
      <p>Ende aktuell: <span className="zahl font-medium">{aktuell} Uhr</span></p>
      <p className="mt-1 text-xs text-muted-foreground">Letzte Korrektur am {geaendertAm} Uhr. Bitte bei Bedarf auch FIBS und bereits ausgestellte Teilnahmebestätigungen anpassen.</p>
    </div>
  );
}
