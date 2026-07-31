import Link from "next/link";
import { ArrowRight, Clock, Globe, MapPin, Users } from "lucide-react";

import { formatDatumLang, formatZeit } from "@/lib/datetime";
import {
  formatLabel,
  organisationsformLabel,
  schulartLabel,
} from "@/constants/fortbildung";
import type { FortbildungKachel } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { DatumsBlock } from "./DatumsBlock";

/**
 * Ergebniskachel für Listen und Startseite.
 *
 * Aufbau: links das Datum als eigenständiger Block, rechts der Inhalt. Die
 * Farbe der linken Kante und des Datumsblocks unterscheidet regionale
 * Fortbildungen von SchiLf — dieselbe Zuordnung wie im Kalender, damit man
 * die Legende nur einmal lernen muss.
 */
export function FortbildungKarte({
  fortbildung,
  maxTn,
}: {
  fortbildung: FortbildungKachel;
  maxTn?: number;
}) {
  const schilf = fortbildung.organisationsform === "SCHILF";
  const abgesagt = fortbildung.status === "ABGESAGT";
  const online = fortbildung.veranstaltungsort.istOnline;

  return (
    <article
      className={cn(
        "karte group relative overflow-hidden rounded-xl border bg-card",
        abgesagt && "opacity-70",
      )}
    >
      {/* Farbige Kante als Sortiermerkmal */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          schilf ? "bg-schilf" : "bg-regional",
        )}
      />

      <Link
        href={`/fortbildungen/${fortbildung.slug}`}
        className="flex gap-4 p-5 pl-6 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <DatumsBlock
          datum={fortbildung.beginn}
          variante={schilf ? "schilf" : "regional"}
        />

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span
              className={cn(
                "font-medium",
                schilf ? "text-schilf" : "text-regional",
              )}
            >
              {organisationsformLabel(fortbildung.organisationsform)}
            </span>
            <span className="text-muted-foreground" aria-hidden>
              ·
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              {online ? (
                <Globe className="size-3" aria-hidden />
              ) : (
                <MapPin className="size-3" aria-hidden />
              )}
              {formatLabel(fortbildung.format)}
            </span>
            {abgesagt ? (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 font-medium text-destructive">
                Abgesagt
              </span>
            ) : null}
          </div>

          <h3
            className={cn(
              "font-semibold tracking-tight text-balance transition-colors group-hover:text-primary",
              abgesagt && "line-through",
            )}
          >
            {fortbildung.titel}
          </h3>

          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5 shrink-0" aria-hidden />
              <span className="sr-only">{formatDatumLang(fortbildung.beginn)}, </span>
              {formatZeit(fortbildung.beginn)} – {formatZeit(fortbildung.ende)} Uhr
            </span>
            <span className="flex min-w-0 items-center gap-1.5">
              {online ? (
                <Globe className="size-3.5 shrink-0" aria-hidden />
              ) : (
                <MapPin className="size-3.5 shrink-0" aria-hidden />
              )}
              <span className="truncate">{fortbildung.veranstaltungsort.name}</span>
            </span>
            {maxTn ? (
              <span className="flex items-center gap-1.5">
                <Users className="size-3.5 shrink-0" aria-hidden />
                {maxTn} Plätze
              </span>
            ) : null}
          </p>

          <p className="mt-2.5 text-xs text-muted-foreground">
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
