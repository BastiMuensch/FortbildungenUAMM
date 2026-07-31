import Link from "next/link";
import { ArrowRight, CalendarDays, Search } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { fortbildungKachelSelect, oeffentlicheFortbildungWhere } from "@/lib/queries";
import { FortbildungKarte } from "@/components/public/FortbildungKarte";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Die Seite liest bei jedem Aufruf aus der Datenbank. Ohne diese Zeile
// würde Next die Inhalte beim Bauen einfrieren.
export const dynamic = "force-dynamic";


export default async function Startseite() {
  const [naechste, anzahl] = await Promise.all([
    prisma.fortbildung.findMany({
      where: {
        AND: [oeffentlicheFortbildungWhere(), { ende: { gte: new Date() } }],
      },
      orderBy: { beginn: "asc" },
      take: 6,
      select: { ...fortbildungKachelSelect, maxTn: true },
    }),
    prisma.fortbildung.count({
      where: {
        AND: [oeffentlicheFortbildungWhere(), { ende: { gte: new Date() } }],
      },
    }),
  ]);

  return (
    <div className="space-y-12">
      <section className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">
          Fortbildungen für Lehrkräfte
        </h1>
        <p className="mt-3 text-muted-foreground">
          Das Angebot des Staatlichen Schulamts im Landkreis Unterallgäu und in
          der Stadt Memmingen — regionale Fortbildungen und schulinterne
          Lehrerfortbildungen an einer Stelle. Die verbindliche Anmeldung läuft
          weiterhin über FIBS.
        </p>

        {/* Ein einfaches GET-Formular: braucht kein JavaScript. */}
        <form action="/fortbildungen" className="mt-6 flex gap-2">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              name="q"
              placeholder="Thema, Fach oder Schlagwort"
              aria-label="Fortbildungen durchsuchen"
              className="h-10 w-full pl-9"
            />
          </div>
          <Button type="submit" size="lg">
            Suchen
          </Button>
        </form>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight">
            Die nächsten Termine
          </h2>
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/kalender"
              className="flex items-center gap-1.5 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              <CalendarDays className="size-4" aria-hidden />
              Kalenderansicht
            </Link>
            <Link
              href="/fortbildungen"
              className="flex items-center gap-1 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Alle {anzahl} Angebote
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>

        {naechste.length === 0 ? (
          <p className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
            Derzeit ist keine Fortbildung ausgeschrieben.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {naechste.map((f) => (
              <FortbildungKarte key={f.id} fortbildung={f} maxTn={f.maxTn} />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-base font-semibold tracking-tight">
          Termine im eigenen Kalender
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Alle veröffentlichten Fortbildungen lassen sich als Kalender
          abonnieren. Die Adresse in Outlook, Apple Kalender oder Thunderbird
          als Abo eintragen — neue Termine erscheinen dann automatisch.
        </p>
        <p className="mt-3">
          <code className="rounded bg-muted px-2 py-1 text-xs">
            {process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/ics
          </code>
        </p>
      </section>
    </div>
  );
}
