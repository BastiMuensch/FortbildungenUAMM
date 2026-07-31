import Link from "next/link";
import { CalendarDays, Globe, MapPin, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatDatumLang, formatZeit } from "@/lib/datetime";
import {
  formatLabel,
  organisationsformLabel,
  schulartLabel,
} from "@/constants/fortbildung";
import type { FortbildungKachel } from "@/lib/queries";

/** Ergebniskachel für Listen und Startseite. */
export function FortbildungKarte({
  fortbildung,
  maxTn,
}: {
  fortbildung: FortbildungKachel;
  maxTn?: number;
}) {
  const abgesagt = fortbildung.status === "ABGESAGT";

  return (
    <article
      className={`rounded-lg border p-5 transition-colors hover:border-foreground/20 ${
        abgesagt ? "opacity-70" : ""
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge
          variant={fortbildung.organisationsform === "SCHILF" ? "secondary" : "outline"}
        >
          {organisationsformLabel(fortbildung.organisationsform)}
        </Badge>
        <Badge variant="outline">{formatLabel(fortbildung.format)}</Badge>
        {abgesagt ? <Badge variant="destructive">Abgesagt</Badge> : null}
      </div>

      <h2 className="text-base font-semibold tracking-tight">
        <Link
          href={`/fortbildungen/${fortbildung.slug}`}
          className="underline-offset-4 hover:underline"
        >
          {fortbildung.titel}
        </Link>
      </h2>

      <dl className="mt-3 space-y-1.5 text-sm text-muted-foreground">
        <div className="flex items-start gap-2">
          <dt className="sr-only">Termin</dt>
          <CalendarDays className="mt-0.5 size-4 shrink-0" aria-hidden />
          <dd>
            {formatDatumLang(fortbildung.beginn)}, {formatZeit(fortbildung.beginn)} –{" "}
            {formatZeit(fortbildung.ende)} Uhr
          </dd>
        </div>

        <div className="flex items-start gap-2">
          <dt className="sr-only">Ort</dt>
          {fortbildung.veranstaltungsort.istOnline ? (
            <Globe className="mt-0.5 size-4 shrink-0" aria-hidden />
          ) : (
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
          )}
          <dd>{fortbildung.veranstaltungsort.name}</dd>
        </div>

        {maxTn ? (
          <div className="flex items-start gap-2">
            <dt className="sr-only">Plätze</dt>
            <Users className="mt-0.5 size-4 shrink-0" aria-hidden />
            <dd>{maxTn} Plätze</dd>
          </div>
        ) : null}
      </dl>

      <p className="mt-3 text-xs text-muted-foreground">
        {fortbildung.schularten.map(schulartLabel).join(" · ")}
      </p>
    </article>
  );
}
