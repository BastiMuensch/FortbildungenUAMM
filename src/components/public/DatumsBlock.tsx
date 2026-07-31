import { berlinIsoDatum } from "@/lib/datetime";
import { cn } from "@/lib/utils";

const WOCHENTAG = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const MONAT = [
  "Jan",
  "Feb",
  "Mär",
  "Apr",
  "Mai",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dez",
];

/**
 * Abreißkalender-Block für Terminkarten.
 *
 * Das Datum ist die Information, nach der Lehrkräfte eine Fortbildungsliste
 * überfliegen. Als eigenständiger Block ist es auf einen Blick erfassbar,
 * während es in einer Textzeile untergeht.
 */
export function DatumsBlock({
  datum,
  variante = "regional",
  className,
}: {
  datum: Date;
  variante?: "regional" | "schilf";
  className?: string;
}) {
  const iso = berlinIsoDatum(datum);
  const tag = Number(iso.slice(8, 10));
  const monat = Number(iso.slice(5, 7)) - 1;
  const wochentag = new Date(`${iso}T12:00:00Z`).getUTCDay();

  return (
    <div
      className={cn(
        "flex size-14 shrink-0 flex-col items-center justify-center rounded-xl leading-none",
        variante === "schilf"
          ? "bg-schilf-weich text-schilf"
          : "bg-regional-weich text-regional",
        className,
      )}
      // Für Screenreader steht das vollständige Datum im Fließtext der Karte.
      aria-hidden
    >
      <span className="text-[0.65rem] font-medium opacity-70">
        {WOCHENTAG[wochentag]}
      </span>
      <span className="text-xl font-semibold tabular-nums">{tag}</span>
      <span className="text-[0.65rem] font-medium opacity-70">{MONAT[monat]}</span>
    </div>
  );
}
