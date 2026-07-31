import type { Metadata } from "next";
import { SearchX } from "lucide-react";

import { prisma } from "@/lib/prisma";
import {
  anzahlAktiverFilter,
  filterZuWhere,
  leseFilter,
  type SuchParameter,
} from "@/lib/filter";
import { fortbildungKachelSelect, oeffentlicheFortbildungWhere } from "@/lib/queries";
import { MonatsGruppen } from "@/components/public/MonatsGruppen";
import { OeffentlicheFilterLeiste } from "@/components/public/OeffentlicheFilterLeiste";

export const metadata: Metadata = {
  title: "Alle Fortbildungen",
  description:
    "Suche und Filter über alle Fortbildungen des Schulamts Memmingen-Unterallgäu.",
};

export default async function FortbildungsListe({
  searchParams,
}: {
  searchParams: Promise<SuchParameter>;
}) {
  const params = await searchParams;
  const filter = leseFilter(params);

  // Nur "vergangene anzeigen" schaltet zurückliegende Termine frei — sonst
  // sieht man die Liste, die einen interessiert: die kommenden.
  const zeigeVergangene = params.vergangene === "1";

  const [fortbildungen, schlagworte, bereiche] = await Promise.all([
    prisma.fortbildung.findMany({
      where: {
        AND: [
          oeffentlicheFortbildungWhere(),
          filterZuWhere(filter),
          zeigeVergangene ? {} : { ende: { gte: new Date() } },
        ],
      },
      orderBy: { beginn: zeigeVergangene ? "desc" : "asc" },
      take: 200,
      select: { ...fortbildungKachelSelect, maxTn: true },
    }),

    prisma.schlagwort.findMany({
      where: { fortbildungen: { some: {} } },
      orderBy: { name: "asc" },
      select: { name: true },
    }),

    prisma.digCompKompetenz.findMany({
      where: { parentCode: null, aktiv: true },
      orderBy: { sortOrder: "asc" },
      select: { code: true, titel: true },
    }),
  ]);

  const gefiltert = anzahlAktiverFilter(filter) > 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Fortbildungen</h1>
        <p className="mt-1.5 text-muted-foreground">
          {fortbildungen.length === 0
            ? "Kein Treffer"
            : `${fortbildungen.length} ${fortbildungen.length === 1 ? "Angebot" : "Angebote"}`}
          {gefiltert ? " für die gewählten Filter" : ""}
          {zeigeVergangene ? ", inklusive vergangener Termine" : ""}
        </p>
      </header>

      <OeffentlicheFilterLeiste
        params={params}
        schlagworte={schlagworte.map((s) => s.name)}
        kompetenzbereiche={bereiche}
      />

      {fortbildungen.length === 0 ? (
        <div className="rounded-xl border border-dashed py-20 text-center">
          <SearchX
            className="mx-auto mb-3 size-7 text-muted-foreground/60"
            aria-hidden
          />
          <p className="font-medium">Dazu gibt es derzeit kein Angebot.</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground text-pretty">
            {gefiltert
              ? "Vielleicht hilft ein Filter weniger — oder ein Blick auf die vergangenen Termine."
              : "Neue Fortbildungen erscheinen hier, sobald sie veröffentlicht sind."}
          </p>
        </div>
      ) : (
        <MonatsGruppen fortbildungen={fortbildungen} />
      )}
    </div>
  );
}
