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
    <div className="space-y-10">
      {/* --- Kopfbereich mit Rautentextur ---------------------------------- */}
      <section className="relative pt-8 pb-4">
        {/* Bricht aus der Inhaltsspalte aus, damit die Textur über die volle
            Fensterbreite läuft. */}
        <div
          aria-hidden
          className="rauten absolute inset-y-0 left-1/2 -top-10 w-[100vw] -translate-x-1/2 border-b border-border"
        />

        <div className="relative max-w-4xl">
          <p className="etikett zahl mb-3 text-primary">
            Schuljahr {schuljahr}
          </p>

          <h1 className="max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight text-balance sm:text-5xl">
            Fortbildungen in Memmingen und im Unterallgäu
          </h1>

          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            Passendes Angebot finden und anschließend über FIBS anmelden.
          </p>

          {/* Einfaches GET-Formular: funktioniert auch ohne JavaScript. */}
          <form action="/fortbildungen" className="mt-6 flex max-w-2xl">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                name="q"
                placeholder="Thema oder Fach"
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

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
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

        <dl className="relative mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-primary/20 pt-3">
          <Kennzahl wert={anzahlKommend} label="kommende Termine" />
          <Kennzahl wert={anzahlOnline} label="online" />
          <Kennzahl wert={anzahlSchuljahr} label={`im Schuljahr ${schuljahr}`} />
        </dl>
      </section>

      {/* --- Nächste Termine ---------------------------------------------- */}
      <section>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-foreground pb-2">
          <h2 className="text-xl font-semibold tracking-tight">Nächste Termine</h2>
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
          <div className="grid">
            {naechste.map((f) => (
              <FortbildungKarte key={f.id} fortbildung={f} maxTn={f.maxTn} />
            ))}
          </div>
        )}
      </section>

      {/* --- Kalender-Abo -------------------------------------------------- */}
      <section className="border-l-4 border-primary bg-card py-4 pr-5 pl-4">
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
    <div className="flex items-baseline gap-1.5">
      <dt className="sr-only">{label}</dt>
      <dd className="flex items-baseline gap-1.5">
        <span className="zahl text-base font-semibold">{wert}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </dd>
    </div>
  );
}
