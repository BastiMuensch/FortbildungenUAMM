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
import { Anmeldestatus } from "./Anmeldestatus";

/**
 * Eine gut scanbare Karte für öffentliche Terminlisten.
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
          "zeile grid grid-cols-[4rem_minmax(0,1fr)] gap-x-4 gap-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm outline-none sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:p-5",
          "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <DatumsBlock
          datum={fortbildung.beginn}
          organisationsform={fortbildung.organisationsform}
        />

        <div className="min-w-0">
          {/* Kopfzeile: Ebene als Farbfläche, Format daneben */}
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span
              className={cn("rounded-md px-2 py-1 text-xs font-semibold", ebene.weich)}
            >
              {organisationsformKurz(fortbildung.organisationsform)}
            </span>

            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              {online ? (
                <Globe className="size-3" aria-hidden />
              ) : (
                <MapPin className="size-3" aria-hidden />
              )}
              {formatLabel(fortbildung.format)}
            </span>

            {abgesagt ? (
              <span className="rounded-md bg-destructive px-2 py-1 text-xs font-semibold text-white">
                Abgesagt
              </span>
            ) : null}
          </div>

          <h3
            className={cn(
              "text-lg leading-snug font-semibold tracking-tight text-pretty sm:text-xl",
              "transition-colors group-hover:text-primary",
              abgesagt && "line-through",
            )}
          >
            {fortbildung.titel}
          </h3>

          <p className="zahl mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="sr-only">{formatDatumLang(fortbildung.beginn)}, </span>
            <span>
              {formatZeit(fortbildung.beginn)}–{formatZeit(fortbildung.ende)}
            </span>
            <span className="text-border" aria-hidden>·</span>
            <span>{fortbildung.veranstaltungsort.name}</span>
            {maxTn ? (
              <>
                <span className="text-border" aria-hidden>·</span>
                <span>{maxTn} Plätze</span>
              </>
            ) : null}
          </p>

          <p className="mt-2 text-xs font-medium text-muted-foreground/80">
            {fortbildung.schularten.map(schulartLabel).join(" · ")}
          </p>
        </div>

        <div className="col-span-2 flex items-start justify-between gap-3 border-t border-border/70 pt-3 sm:col-auto sm:flex-col sm:items-end sm:justify-between sm:border-t-0 sm:pt-0">
          {!abgesagt ? (
            <Anmeldestatus
              fibsUrl={fortbildung.fibsUrl}
              inFibs={fortbildung.inFibs}
              organisationsform={fortbildung.organisationsform}
              kompakt
            />
          ) : null}
          <ArrowRight
            className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </div>
      </Link>
    </article>
  );
}
