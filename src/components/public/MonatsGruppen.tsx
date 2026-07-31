import { berlinIsoDatum, formatMonatJahr } from "@/lib/datetime";
import type { FortbildungKachel } from "@/lib/queries";
import { FortbildungKarte } from "./FortbildungKarte";

type MitPlaetzen = FortbildungKachel & { maxTn?: number };

/**
 * Termine nach Monat gruppiert.
 *
 * Eine durchgehende Liste von dreißig Karten liest sich wie eine Tabelle.
 * Monatsüberschriften geben der Seite Rhythmus und beantworten die Frage
 * „was steht im November an?" ohne Filter.
 */
export function MonatsGruppen({
  fortbildungen,
}: {
  fortbildungen: MitPlaetzen[];
}) {
  const gruppen = new Map<string, MitPlaetzen[]>();

  for (const f of fortbildungen) {
    const schluessel = berlinIsoDatum(f.beginn).slice(0, 7);
    const liste = gruppen.get(schluessel);
    if (liste) liste.push(f);
    else gruppen.set(schluessel, [f]);
  }

  return (
    <div className="space-y-10">
      {[...gruppen.entries()].map(([monat, termine]) => (
        <section key={monat}>
          <h2 className="mb-4 flex items-baseline gap-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            {formatMonatJahr(new Date(`${monat}-15T12:00:00Z`))}
            <span className="h-px flex-1 bg-border" aria-hidden />
            <span className="text-xs font-normal normal-case">
              {termine.length} {termine.length === 1 ? "Termin" : "Termine"}
            </span>
          </h2>

          <div className="grid gap-3">
            {termine.map((f) => (
              <FortbildungKarte key={f.id} fortbildung={f} maxTn={f.maxTn} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
