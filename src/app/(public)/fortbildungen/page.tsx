import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import {
  anzahlAktiverFilter,
  baueUrl,
  beschreibeFilter,
  filterZuWhere,
  leseFilter,
  ohneFilter,
  type SuchParameter,
} from "@/lib/filter";
import { fortbildungKachelSelect, oeffentlicheFortbildungWhere } from "@/lib/queries";
import { aktuellesSchuljahr, berlinIsoDatum } from "@/lib/datetime";
import { MonatsGruppen } from "@/components/public/MonatsGruppen";
import { OeffentlicheFilterLeiste } from "@/components/public/OeffentlicheFilterLeiste";
import {
  Schnellzugriffe,
  type Schnellzugriff,
} from "@/components/public/Schnellzugriffe";
import { LeerZustand, type Ausweg } from "@/components/public/LeerZustand";

export const metadata: Metadata = {
  title: "Alle Fortbildungen",
  description:
    "Suche und Filter über die Fortbildungsangebote des Schulamts.",
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
  const nurKuenftige = { ende: { gte: new Date() } };

  const [fortbildungen, schlagworte, bereiche, bezirke] = await Promise.all([
    prisma.fortbildung.findMany({
      where: {
        AND: [
          oeffentlicheFortbildungWhere(),
          filterZuWhere(filter),
          zeigeVergangene ? {} : nurKuenftige,
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

    prisma.bezirk.findMany({
      where: { aktiv: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const gefiltert = anzahlAktiverFilter(filter) > 0 || zeigeVergangene;
  const aktiveFilter = beschreibeFilter(params, bereiche, bezirke);

  // --- Schnellzugriffe ----------------------------------------------------
  // Die Datumsgrenzen werden hier auf dem Server gebildet: Im Browser
  // gerechnet ergäben sie beim ersten Rendern einen anderen Wert als auf dem
  // Server und React würde die Abweichung melden.
  const heute = new Date();
  const schnellzugriffe: Schnellzugriff[] = [
    {
      id: "bald",
      label: "Nächste 4 Wochen",
      werte: {
        von: berlinIsoDatum(heute),
        bis: berlinIsoDatum(new Date(heute.getTime() + 28 * 24 * 60 * 60 * 1000)),
      },
    },
    { id: "online", label: "Online", werte: { format: "ESESSION" } },
    { id: "gs", label: "Grundschule", werte: { schulart: "GRUNDSCHULE" } },
    { id: "ms", label: "Mittelschule", werte: { schulart: "MITTELSCHULE" } },
    {
      id: "schuljahr",
      label: "Noch dieses Schuljahr",
      werte: { schuljahr: aktuellesSchuljahr(heute) },
    },
  ];

  // --- Auswege für den Leerzustand ---------------------------------------
  // Nur wenn wirklich nichts gefunden wurde: dann eine Zählung je gesetztem
  // Filter, um zu zeigen, welcher einzelne im Weg steht.
  let auswege: Ausweg[] = [];

  if (fortbildungen.length === 0) {
    const zaehle = (suchparameter: SuchParameter, mitVergangenen: boolean) =>
      prisma.fortbildung.count({
        where: {
          AND: [
            oeffentlicheFortbildungWhere(),
            filterZuWhere(leseFilter(suchparameter)),
            mitVergangenen ? {} : nurKuenftige,
          ],
        },
      });

    // Für jeden gesetzten Filter: was brächte sein Wegfall?
    const wegfall = await Promise.all(
      aktiveFilter.map(async (chip) => {
        const rest = ohneFilter(params, chip.param);
        return {
          schluessel: chip.param,
          vorsatz: "ohne",
          hervorhebung: `${chip.art}: ${chip.wert}`,
          treffer: await zaehle(
            rest,
            chip.param === "vergangene" ? false : zeigeVergangene,
          ),
          href: baueUrl("/fortbildungen", rest, {}),
        };
      }),
    );

    // Und der umgekehrte Weg: den Zeitraum aufmachen. Wer nichts findet, sucht
    // oft nach etwas, das gerade erst gelaufen ist.
    const rueckblick: Ausweg[] = [];
    if (!zeigeVergangene) {
      const treffer = await zaehle(params, true);
      if (treffer > 0) {
        rueckblick.push({
          schluessel: "vergangene",
          vorsatz: "",
          hervorhebung: "auch vergangene Termine anzeigen",
          treffer,
          href: baueUrl("/fortbildungen", params, { vergangene: "1" }),
        });
      }
    }

    auswege = [...wegfall, ...rueckblick]
      .filter((a) => a.treffer > 0)
      .sort((a, b) => b.treffer - a.treffer);
  }

  return (
    <div className="space-y-7">
      <header className="rounded-2xl border border-border bg-secondary/45 px-5 py-7 sm:px-7">
        <p className="mb-2 text-sm font-medium text-primary">Fortbildungsprogramm</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Fortbildungen</h1>
        <p className="mt-2 text-muted-foreground">
          {fortbildungen.length === 0
            ? "Kein Treffer"
            : `${fortbildungen.length} ${fortbildungen.length === 1 ? "Angebot" : "Angebote"}`}
          {gefiltert ? " für die gewählte Auswahl" : ""}
          {zeigeVergangene ? ", inklusive vergangener Termine" : ""}
        </p>
      </header>

      <Schnellzugriffe
        params={params}
        zugriffe={schnellzugriffe}
        aktiveFilter={aktiveFilter}
      />

      <OeffentlicheFilterLeiste
        params={params}
        schlagworte={schlagworte.map((s) => s.name)}
        kompetenzbereiche={bereiche}
        bezirke={bezirke}
      />

      {fortbildungen.length === 0 ? (
        <LeerZustand
          auswege={auswege}
          alleZuruecksetzen="/fortbildungen"
          gefiltert={gefiltert}
        />
      ) : (
        <div className="pt-2">
          <MonatsGruppen fortbildungen={fortbildungen} />
        </div>
      )}
    </div>
  );
}
