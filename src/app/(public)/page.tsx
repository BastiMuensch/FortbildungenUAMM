import Link from "next/link";
import { ArrowRight, CalendarDays, CalendarPlus, Search } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { fortbildungKachelSelect, oeffentlicheFortbildungWhere } from "@/lib/queries";
import { aktuellesSchuljahr, schuljahrZeitraum } from "@/lib/datetime";
import { FortbildungKarte } from "@/components/public/FortbildungKarte";
import { Button } from "@/components/ui/button";

// Die Seite liest bei jedem Aufruf aus der Datenbank. Ohne diese Zeile
// würde Next die Inhalte beim Bauen einfrieren.
export const dynamic = "force-dynamic";

export default async function Startseite() {
  const jetzt = new Date();
  const schuljahr = aktuellesSchuljahr(jetzt);
  const { start, ende } = schuljahrZeitraum(schuljahr);

  const kommend = { AND: [oeffentlicheFortbildungWhere(), { ende: { gte: jetzt } }] };

  const [naechste, anzahlKommend, anzahlSchuljahr, anzahlOnline] = await Promise.all([
    prisma.fortbildung.findMany({
      where: kommend,
      orderBy: { beginn: "asc" },
      take: 4,
      select: { ...fortbildungKachelSelect, maxTn: true },
    }),
    prisma.fortbildung.count({ where: kommend }),
    prisma.fortbildung.count({
      where: {
        AND: [oeffentlicheFortbildungWhere(), { beginn: { gte: start, lte: ende } }],
      },
    }),
    prisma.fortbildung.count({
      where: { AND: [kommend, { format: "ESESSION" }] },
    }),
  ]);

  return (
    <div className="space-y-16">
      <section className="relative pt-14 pb-12">
        {/* Der Verlauf soll über die volle Fensterbreite laufen, der Text aber
            in der Spalte bleiben — deshalb ein eigenes Hintergrundelement,
            das aus dem Inhaltsbereich ausbricht. */}
        <div
          aria-hidden
          className="buehne absolute inset-y-0 left-1/2 -top-10 w-[100vw] -translate-x-1/2"
        />

        <div className="relative mx-auto max-w-3xl">
          <p className="mb-3 text-sm font-medium text-primary">
            Schuljahr {schuljahr}
          </p>

          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Fortbildungen für Lehrkräfte in Memmingen und im Unterallgäu
          </h1>

          <p className="mt-4 max-w-2xl text-lg text-muted-foreground text-pretty">
            Regionale Fortbildungen und schulinterne Lehrerfortbildungen an
            einer Stelle — mit Kalender, Suche und Filtern nach Schulart und
            digitalen Kompetenzen. Die verbindliche Anmeldung läuft weiterhin
            über FIBS.
          </p>

          {/* Einfaches GET-Formular: funktioniert auch ohne JavaScript. */}
          <form
            action="/fortbildungen"
            className="mt-8 flex flex-col gap-2 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                name="q"
                placeholder="Wonach suchen Sie? Thema, Fach oder Schlagwort"
                aria-label="Fortbildungen durchsuchen"
                className="h-12 w-full rounded-xl border border-input bg-card pr-4 pl-11 text-base shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
              />
            </div>
            <button
              type="submit"
              className="h-12 rounded-xl bg-primary px-6 font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              Suchen
            </button>
          </form>

          <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
            <Kennzahl wert={anzahlKommend} label="kommende Termine" />
            <Kennzahl wert={anzahlSchuljahr} label={`im Schuljahr ${schuljahr}`} />
            <Kennzahl wert={anzahlOnline} label="davon als eSession" />
          </dl>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h2 className="text-xl font-semibold tracking-tight">
            Die nächsten Termine
          </h2>
          <div className="flex items-center gap-5 text-sm">
            <Link
              href="/kalender"
              className="flex items-center gap-1.5 text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              <CalendarDays className="size-4" aria-hidden />
              Kalenderansicht
            </Link>
            <Link
              href="/fortbildungen"
              className="group flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
            >
              Alle {anzahlKommend} anzeigen
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </div>
        </div>

        {naechste.length === 0 ? (
          <div className="rounded-xl border border-dashed py-16 text-center">
            <CalendarDays
              className="mx-auto mb-3 size-7 text-muted-foreground/60"
              aria-hidden
            />
            <p className="font-medium">Derzeit ist nichts ausgeschrieben.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Neue Angebote erscheinen hier, sobald sie veröffentlicht sind.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {naechste.map((f) => (
              <FortbildungKarte key={f.id} fortbildung={f} maxTn={f.maxTn} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto w-full max-w-3xl">
        <div className="rounded-2xl border bg-card p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarPlus className="size-6" aria-hidden />
            </div>

            <div className="flex-1">
              <h2 className="font-semibold tracking-tight">
                Termine im eigenen Kalender
              </h2>
              <p className="mt-1 text-sm text-muted-foreground text-pretty">
                Alle veröffentlichten Fortbildungen lassen sich abonnieren —
                einmal in Outlook, Apple Kalender oder Thunderbird eintragen,
                neue Termine erscheinen dann von selbst.
              </p>
            </div>

            <Button
              nativeButton={false}
              variant="outline"
              render={<a href="/api/ics">Kalender abonnieren</a>}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function Kennzahl({ wert, label }: { wert: number; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="block text-2xl font-semibold tabular-nums">{wert}</span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </dd>
    </div>
  );
}
