import Link from "next/link";
import { ArrowRight, CalendarDays, CalendarPlus, Search } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { fortbildungKachelSelect, oeffentlicheFortbildungWhere } from "@/lib/queries";
import { aktuellesSchuljahr, schuljahrZeitraum } from "@/lib/datetime";
import { FortbildungKarte } from "@/components/public/FortbildungKarte";

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
      take: 5,
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
      {/* --- Kopfbereich mit Rautentextur ---------------------------------- */}
      <section className="relative pt-12 pb-10">
        {/* Bricht aus der Inhaltsspalte aus, damit die Textur über die volle
            Fensterbreite läuft. */}
        <div
          aria-hidden
          className="rauten absolute inset-y-0 left-1/2 -top-10 w-[100vw] -translate-x-1/2 border-b border-border"
        />

        <div className="relative">
          <p className="etikett zahl mb-4 text-primary">
            Schuljahr {schuljahr}
          </p>

          <h1 className="max-w-3xl text-5xl leading-[0.98] font-bold tracking-tight text-balance sm:text-6xl">
            Fortbildungen für Lehrkräfte in{" "}
            <span className="text-primary">Memmingen</span> und im{" "}
            <span className="text-primary">Unterallgäu</span>
          </h1>

          <p className="mt-5 max-w-2xl text-lg text-muted-foreground text-pretty">
            Regionale Fortbildungen, SchiLf und Angebote der ALP an einer
            Stelle. Die verbindliche Anmeldung läuft weiterhin über FIBS.
          </p>

          {/* Einfaches GET-Formular: funktioniert auch ohne JavaScript. */}
          <form action="/fortbildungen" className="mt-8 flex max-w-2xl">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                name="q"
                placeholder="Thema, Fach oder Schlagwort"
                aria-label="Fortbildungen durchsuchen"
                className="h-12 w-full border-2 border-primary bg-card pr-4 pl-10 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <button
              type="submit"
              className="etikett h-12 border-2 border-l-0 border-primary bg-primary px-6 text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Suchen
            </button>
          </form>

          {/* Kennzahlen als Zahlenband — Monospace, gleiche Ziffernbreite. */}
          <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-5">
            <Kennzahl wert={anzahlKommend} label="kommende Termine" />
            <Kennzahl wert={anzahlSchuljahr} label={`im Schuljahr ${schuljahr}`} />
            <Kennzahl wert={anzahlOnline} label="davon als eSession" />
          </dl>
        </div>
      </section>

      {/* --- Nächste Termine ---------------------------------------------- */}
      <section>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b-2 border-foreground pb-1.5">
          <h2 className="etikett text-base tracking-widest">
            Die nächsten Termine
          </h2>
          <div className="etikett flex items-center gap-5">
            <Link
              href="/kalender"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <CalendarDays className="size-4" aria-hidden />
              Kalender
            </Link>
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
          <div className="grid">
            {naechste.map((f) => (
              <FortbildungKarte key={f.id} fortbildung={f} maxTn={f.maxTn} />
            ))}
          </div>
        )}
      </section>

      {/* --- Kalender-Abo -------------------------------------------------- */}
      <section className="border-l-4 border-primary bg-card py-6 pr-6 pl-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <CalendarPlus className="size-7 shrink-0 text-primary" aria-hidden />

          <div className="flex-1">
            <h2 className="etikett text-sm">Termine im eigenen Kalender</h2>
            <p className="mt-1.5 text-sm text-muted-foreground text-pretty">
              Alle veröffentlichten Fortbildungen lassen sich abonnieren —
              einmal in Outlook, Apple Kalender oder Thunderbird eintragen,
              neue Termine erscheinen dann von selbst.
            </p>
          </div>

          <a
            href="/api/ics"
            className="etikett shrink-0 border-2 border-primary px-4 py-2.5 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
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
    <div>
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="zahl block text-4xl leading-none font-semibold">
          {String(wert).padStart(2, "0")}
        </span>
        <span className="etikett mt-1.5 block text-muted-foreground">{label}</span>
      </dd>
    </div>
  );
}
