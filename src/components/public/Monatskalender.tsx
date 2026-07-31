import Link from "next/link";

import { berlinIsoDatum, formatZeit } from "@/lib/datetime";
import { ferienStatus } from "@/lib/ferien";
import type { FortbildungKachel } from "@/lib/queries";
import { cn } from "@/lib/utils";

const WOCHENTAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

/**
 * Monatsraster als Server Component — kein Client-JavaScript.
 *
 * Bayerische Ferien und Feiertage sind hinterlegt und farblich markiert, damit
 * auf einen Blick erkennbar ist, warum in einer Woche nichts stattfindet.
 * Auf schmalen Bildschirmen wird das Raster zur Liste (siehe unten): Ein
 * 7-Spalten-Gitter ist auf dem Telefon nicht lesbar.
 */
export function Monatskalender({
  jahr,
  monatsIndex,
  fortbildungen,
}: {
  jahr: number;
  monatsIndex: number;
  fortbildungen: FortbildungKachel[];
}) {
  const tage = rasterTage(jahr, monatsIndex);
  const heute = berlinIsoDatum(new Date());

  // Termine je Kalendertag — mehrtägige Lehrgänge erscheinen an jedem ihrer Tage.
  const nachTag = new Map<string, FortbildungKachel[]>();
  for (const f of fortbildungen) {
    for (const tag of tageEinerFortbildung(f)) {
      const liste = nachTag.get(tag);
      if (liste) liste.push(f);
      else nachTag.set(tag, [f]);
    }
  }

  return (
    <>
      {/* Rasteransicht ab Tablet-Breite */}
      <div className="hidden overflow-hidden rounded-lg border sm:block">
        <div className="grid grid-cols-7 border-b bg-muted/40">
          {WOCHENTAGE.map((tag) => (
            <div
              key={tag}
              className="px-2 py-2 text-center text-xs font-medium text-muted-foreground"
            >
              {tag}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {tage.map((tag) => {
            const status = ferienStatus(new Date(`${tag.iso}T12:00:00Z`));
            const termine = nachTag.get(tag.iso) ?? [];

            return (
              <div
                key={tag.iso}
                className={cn(
                  "min-h-28 border-r border-b p-1.5 last:border-r-0",
                  !tag.imMonat && "bg-muted/30",
                  status.art === "ferien" && "bg-amber-500/10",
                  status.art === "feiertag" && "bg-destructive/10",
                )}
              >
                <div className="mb-1 flex items-baseline justify-between gap-1">
                  <span
                    className={cn(
                      "text-xs tabular-nums",
                      tag.imMonat ? "text-foreground" : "text-muted-foreground/60",
                      tag.iso === heute &&
                        "rounded bg-primary px-1.5 py-0.5 font-semibold text-primary-foreground",
                    )}
                  >
                    {tag.tagesZahl}
                  </span>
                  {status.label && status.art !== "wochenende" ? (
                    <span className="truncate text-[10px] text-muted-foreground">
                      {status.label}
                    </span>
                  ) : null}
                </div>

                <div className="space-y-1">
                  {termine.map((f) => (
                    <TerminChip key={f.id + tag.iso} fortbildung={f} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Listenansicht auf dem Telefon */}
      <div className="space-y-2 sm:hidden">
        {tage
          .filter((tag) => tag.imMonat && (nachTag.get(tag.iso)?.length ?? 0) > 0)
          .map((tag) => {
            const status = ferienStatus(new Date(`${tag.iso}T12:00:00Z`));
            return (
              <div key={tag.iso} className="rounded-lg border p-3">
                <p className="mb-2 text-sm font-medium">
                  {tag.tagesZahl}. {WOCHENTAGE[tag.wochentag]}
                  {status.label ? (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {status.label}
                    </span>
                  ) : null}
                </p>
                <div className="space-y-1">
                  {(nachTag.get(tag.iso) ?? []).map((f) => (
                    <TerminChip key={f.id} fortbildung={f} />
                  ))}
                </div>
              </div>
            );
          })}

        {[...nachTag.keys()].length === 0 ? (
          <p className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
            In diesem Monat ist kein Termin ausgeschrieben.
          </p>
        ) : null}
      </div>
    </>
  );
}

function TerminChip({ fortbildung }: { fortbildung: FortbildungKachel }) {
  const schilf = fortbildung.organisationsform === "SCHILF";

  return (
    <Link
      href={`/fortbildungen/${fortbildung.slug}`}
      title={fortbildung.titel}
      className={cn(
        "block truncate rounded px-1.5 py-1 text-[11px] leading-tight transition-opacity hover:opacity-80",
        schilf
          ? "bg-secondary text-secondary-foreground"
          : "bg-primary text-primary-foreground",
        fortbildung.status === "ABGESAGT" && "line-through opacity-60",
      )}
    >
      <span className="tabular-nums">{formatZeit(fortbildung.beginn)}</span>{" "}
      {fortbildung.kurztitel ?? fortbildung.titel}
    </Link>
  );
}

interface RasterTag {
  iso: string;
  tagesZahl: number;
  imMonat: boolean;
  wochentag: number;
}

/** Kalenderraster von Montag bis Sonntag, inklusive angrenzender Tage. */
function rasterTage(jahr: number, monatsIndex: number): RasterTag[] {
  const erster = new Date(Date.UTC(jahr, monatsIndex, 1));
  // getUTCDay: 0 = Sonntag. Die Woche beginnt hier am Montag.
  const versatz = (erster.getUTCDay() + 6) % 7;

  const start = new Date(erster.getTime() - versatz * 24 * 60 * 60 * 1000);
  const tage: RasterTag[] = [];

  for (let i = 0; i < 42; i += 1) {
    const datum = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const imMonat = datum.getUTCMonth() === monatsIndex;

    tage.push({
      iso: datum.toISOString().slice(0, 10),
      tagesZahl: datum.getUTCDate(),
      imMonat,
      wochentag: (datum.getUTCDay() + 6) % 7,
    });

    // Sechste Zeile nur zeigen, wenn der Monat sie braucht.
    if (i >= 34 && i % 7 === 6 && !tage.slice(-7).some((t) => t.imMonat)) {
      return tage.slice(0, -7);
    }
  }

  return tage;
}

/** Alle Kalendertage, an denen eine Fortbildung läuft. */
function tageEinerFortbildung(f: FortbildungKachel): string[] {
  const start = berlinIsoDatum(f.beginn);
  const schluss = berlinIsoDatum(f.ende);
  if (start === schluss) return [start];

  const tage: string[] = [];
  let aktuell = new Date(`${start}T12:00:00Z`);
  const grenze = new Date(`${schluss}T12:00:00Z`);

  while (aktuell <= grenze && tage.length < 60) {
    tage.push(aktuell.toISOString().slice(0, 10));
    aktuell = new Date(aktuell.getTime() + 24 * 60 * 60 * 1000);
  }

  return tage;
}
