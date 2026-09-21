import { ladeSchulamt } from "@/lib/schulamt";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  Globe,
  Search,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { fortbildungKachelSelect, oeffentlicheFortbildungWhere } from "@/lib/queries";
import { aktuellesSchuljahr, schuljahrZeitraum } from "@/lib/datetime";
import { FortbildungKarte } from "@/components/public/FortbildungKarte";

// Die Seite liest bei jedem Aufruf aus der Datenbank. Ohne diese Zeile
// würde Next die Inhalte beim Bauen einfrieren.
export const dynamic = "force-dynamic";

export default async function Startseite() {
  const schulamt = await ladeSchulamt();
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
    <div className="space-y-14">
      <section className="rounded-2xl border border-border/80 bg-[linear-gradient(135deg,var(--card)_0%,var(--card)_62%,var(--secondary)_100%)] px-5 py-10 shadow-sm sm:px-10 sm:py-14">
        <div className="max-w-4xl">
          <p className="mb-4 text-sm font-medium text-primary">
            {schulamt.region}
          </p>

          <h1 className="max-w-3xl text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
            {schulamt.startTitel}
          </h1>

          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            {schulamt.startText}
          </p>

          {/* Einfaches GET-Formular: funktioniert auch ohne JavaScript. */}
          <form action="/fortbildungen" className="mt-7 flex max-w-2xl flex-col gap-2 sm:flex-row sm:gap-0">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                name="q"
                placeholder="Thema oder Fach"
                aria-label="Fortbildungen durchsuchen"
                className="h-13 w-full rounded-xl border border-input bg-card pr-4 pl-11 text-base shadow-sm outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:rounded-r-none"
              />
            </div>
            <button
              type="submit"
              className="h-13 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:rounded-l-none"
            >
              Suchen
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link
              href="/fortbildungen?format=ESESSION"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <Globe className="size-3.5 text-primary" aria-hidden />
              Online-Angebote
            </Link>
            <Link
              href="/kalender"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <CalendarDays className="size-3.5 text-primary" aria-hidden />
              Kalenderansicht
            </Link>
          </div>
        </div>

        <dl className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-4">
          <Kennzahl wert={anzahlKommend} label="kommende Termine" />
          <Kennzahl wert={anzahlOnline} label="online" />
          <Kennzahl wert={anzahlSchuljahr} label={`im Schuljahr ${schuljahr}`} />
        </dl>
      </section>

      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-1 text-sm font-medium text-primary">Im Blick behalten</p>
            <h2 className="text-2xl font-semibold tracking-tight">Nächste Termine</h2>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <Link
              href="/fortbildungen"
              className="group flex items-center gap-1.5 text-primary"
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
          <div className="border border-dashed py-16 text-center">
            <CalendarDays
              className="mx-auto mb-3 size-7 text-muted-foreground/60"
              aria-hidden
            />
            <p className="font-semibold">Derzeit ist nichts ausgeschrieben.</p>
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

      <section className="rounded-2xl border border-border bg-secondary/55 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <CalendarPlus className="size-5 shrink-0 text-primary" aria-hidden />

          <div className="flex-1">
            <p className="text-sm">
              <strong className="font-semibold">Kalender abonnieren:</strong>{" "}
              Neue veröffentlichte Termine automatisch in Outlook, Apple
              Kalender oder Thunderbird erhalten.
            </p>
          </div>

          <a
            href="/api/ics"
            className="shrink-0 rounded-lg border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Kalender abonnieren
          </a>
        </div>
      </section>
    </div>
  );
}

function Kennzahl({ wert, label }: { wert: number; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="sr-only">{label}</dt>
      <dd className="flex items-baseline gap-1.5">
        <span className="zahl text-lg font-semibold">{wert}</span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </dd>
    </div>
  );
}
