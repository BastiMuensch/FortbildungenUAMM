import { berlinIsoDatum } from "@/lib/datetime";
import { ebeneKlassen } from "@/constants/fortbildung";
import { cn } from "@/lib/utils";

const WOCHENTAG = ["SO", "MO", "DI", "MI", "DO", "FR", "SA"];
const MONAT = [
  "JAN",
  "FEB",
  "MÄR",
  "APR",
  "MAI",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OKT",
  "NOV",
  "DEZ",
];

/**
 * Das Datum als eigenständiger Block mit übergroßer Ziffer.
 *
 * Danach überfliegt man eine Terminliste. In einer Textzeile geht das Datum
 * unter; als Ziffer in Monospace steht es in jeder Zeile an derselben Stelle
 * und lässt sich von oben nach unten lesen.
 */
export function DatumsBlock({
  datum,
  organisationsform,
  gross = false,
  className,
}: {
  datum: Date;
  organisationsform: string;
  gross?: boolean;
  className?: string;
}) {
  const iso = berlinIsoDatum(datum);
  const tag = Number(iso.slice(8, 10));
  const monat = Number(iso.slice(5, 7)) - 1;
  const wochentag = new Date(`${iso}T12:00:00Z`).getUTCDay();

  return (
    <div
      className={cn(
        "flex shrink-0 flex-col items-center rounded-xl bg-secondary/70 px-2 py-2 leading-none",
        gross ? "w-24" : "w-16",
        className,
      )}
      // Für Screenreader steht das vollständige Datum im Fließtext.
      aria-hidden
    >
      <span
        className={cn(
          "zahl text-muted-foreground",
          gross ? "text-sm" : "text-[0.6875rem]",
        )}
      >
        {WOCHENTAG[wochentag]}
      </span>

      <span
        className={cn(
          "zahl font-semibold",
          ebeneKlassen(organisationsform).text,
          gross ? "text-6xl" : "text-4xl",
        )}
      >
        {String(tag).padStart(2, "0")}
      </span>

      <span
        className={cn(
          "zahl text-muted-foreground",
          gross ? "text-sm" : "text-[0.6875rem]",
        )}
      >
        {MONAT[monat]}
      </span>
    </div>
  );
}
