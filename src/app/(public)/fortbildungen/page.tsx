import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import {
  anzahlAktiverFilter,
  filterZuWhere,
  leseFilter,
  type SuchParameter,
} from "@/lib/filter";
import { fortbildungKachelSelect, oeffentlicheFortbildungWhere } from "@/lib/queries";
import { FortbildungKarte } from "@/components/public/FortbildungKarte";
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Fortbildungen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {fortbildungen.length}{" "}
          {fortbildungen.length === 1 ? "Angebot" : "Angebote"}
          {anzahlAktiverFilter(filter) > 0 ? " für die gewählten Filter" : ""}
          {zeigeVergangene ? " (inklusive vergangener Termine)" : ""}
        </p>
      </div>

      <OeffentlicheFilterLeiste
        params={params}
        schlagworte={schlagworte.map((s) => s.name)}
        kompetenzbereiche={bereiche}
      />

      {fortbildungen.length === 0 ? (
        <p className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
          Für diese Suche gibt es derzeit kein Angebot. Vielleicht hilft ein
          weiterer Filter weniger.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {fortbildungen.map((f) => (
            <FortbildungKarte key={f.id} fortbildung={f} maxTn={f.maxTn} />
          ))}
        </div>
      )}
    </div>
  );
}
