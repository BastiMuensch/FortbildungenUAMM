import Link from "next/link";
import { ArrowRight, Globe, MapPin } from "lucide-react";

import { formatDatumLang, formatZeit } from "@/lib/datetime";
import {
  ebeneKlassen,
  formatLabel,
  organisationsformKurz,
  schulartLabel,
} from "@/constants/fortbildung";
import type { FortbildungKachel } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { DatumsBlock } from "./DatumsBlock";

/**
 * Eine Zeile der Terminliste.
 *
 * Bewusst keine Karte mit Rahmen und Schatten: Ein kräftiger Balken in der
 * Farbe der Fortbildungsebene übernimmt die Trennung, dazu eine Haarlinie
 * nach unten. Das ergibt eine Liste, die man von oben nach unten liest,
 * statt einer Sammlung gleich aussehender Kästchen.
 */
export function FortbildungKarte({
  fortbildung,
  maxTn,
}: {
  fortbildung: FortbildungKachel;
  maxTn?: number;
}) {
  const ebene = ebeneKlassen(fortbildung.organisationsform);
  const abgesagt = fortbildung.status === "ABGESAGT";
  const online = fortbildung.veranstaltungsort.istOnline;

  return (
    <article className={cn("group relative", abgesagt && "opacity-60")}>
      <Link
        href={`/fortbildungen/${fortbildung.slug}`}
        className={cn(
          "zeile flex items-stretch gap-4 border-b border-l-4 bg-card py-4 pr-4 pl-3 outline-none",
          "hover:bg-accent/45 focus-visible:bg-accent/45 focus-visible:ring-2 focus-visible:ring-ring",
          ebene.kante,
        )}
      >
        <DatumsBlock
          datum={fortbildung.beginn}
          organisationsform={fortbildung.organisationsform}
        />

        <div className="min-w-0 flex-1">
          {/* Kopfzeile: Ebene als Farbfläche, Format daneben */}
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span
              className={cn("etikett px-1.5 py-0.5", ebene.flaeche)}
            >
              {organisationsformKurz(fortbildung.organisationsform)}
            </span>

            <span className="etikett flex items-center gap-1 text-muted-foreground">
              {online ? (
                <Globe className="size-3" aria-hidden />
              ) : (
                <MapPin className="size-3" aria-hidden />
              )}
              {formatLabel(fortbildung.format)}
            </span>

            {abgesagt ? (
              <span className="etikett bg-destructive px-1.5 py-0.5 text-white">
                Abgesagt
              </span>
            ) : null}
          </div>

          <h3
            className={cn(
              "text-lg leading-snug font-semibold tracking-tight text-balance",
              "transition-colors group-hover:text-primary",
              abgesagt && "line-through",
            )}
          >
            {fortbildung.titel}
          </h3>

          {/* Fakten in Monospace — untereinander lesbar */}
          <p className="zahl mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="sr-only">{formatDatumLang(fortbildung.beginn)}, </span>
            <span>
              {formatZeit(fortbildung.beginn)}–{formatZeit(fortbildung.ende)}
            </span>
            <span className="text-border" aria-hidden>
              |
            </span>
            <span className="truncate">{fortbildung.veranstaltungsort.name}</span>
            {maxTn ? (
              <>
                <span className="text-border" aria-hidden>
                  |
                </span>
                <span>{maxTn} Plätze</span>
              </>
            ) : null}
          </p>

          <p className="etikett mt-2 text-muted-foreground/80">
            {fortbildung.schularten.map(schulartLabel).join(" · ")}
          </p>
        </div>

        <ArrowRight
          className="mt-1 size-4 shrink-0 self-start text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden
        />
      </Link>
    </article>
  );
}
