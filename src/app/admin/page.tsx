import Link from "next/link";
import {
  CalendarDays,
  CalendarPlus,
  Clock,
  Download,
  FileSpreadsheet,
  PencilLine,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { baueUrl, filterZuWhere, leseFilter, type SuchParameter } from "@/lib/filter";
import { aktuellesSchuljahr, schuljahrZeitraum } from "@/lib/datetime";
import { Button } from "@/components/ui/button";
import { AdminFilterLeiste } from "@/components/admin/AdminFilterLeiste";
import { FortbildungTabelle } from "@/components/admin/FortbildungTabelle";

export const metadata = { title: "Fortbildungen verwalten" };

/** Die Reiter der Listenansicht. Jeder setzt eine feste Vorfilterung. */
const REITER = [
  { id: "alle", label: "Alle", filter: {} },
  {
    id: "regional",
    label: "Fortbildung (regional)",
    filter: { organisationsform: "REGIONAL" as string | undefined },
  },
  { id: "schilf", label: "SchiLf", filter: { organisationsform: "SCHILF" } },
  { id: "entwuerfe", label: "Entwürfe", filter: { status: "ENTWURF" } },
] as const;

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<SuchParameter>;
}) {
  await requireRole("ADMIN", "REDAKTEUR");

  const params = await searchParams;
  const aktiverReiter =
    REITER.find((r) => r.id === params.reiter)?.id ?? "alle";

  const filter = leseFilter(params);
  const reiterFilter = REITER.find((r) => r.id === aktiverReiter)!.filter;
  const where = filterZuWhere({ ...filter, ...reiterFilter });

  const schuljahr = aktuellesSchuljahr();
  const { start, ende } = schuljahrZeitraum(schuljahr);
  const in30Tagen = new Date();
  in30Tagen.setDate(in30Tagen.getDate() + 30);

  const [fortbildungen, schlagworte, kennzahlen] = await Promise.all([
    prisma.fortbildung.findMany({
      where,
      orderBy: { beginn: "desc" },
      take: 300,
      select: {
        id: true,
        slug: true,
        titel: true,
        kurztitel: true,
        organisationsform: true,
        format: true,
        beginn: true,
        ende: true,
        maxTn: true,
        status: true,
        quelle: true,
        veranstaltungsort: { select: { name: true, ort: true, istOnline: true } },
        referenten: {
          select: { referent: { select: { vorname: true, nachname: true } } },
        },
      },
    }),

    prisma.schlagwort.findMany({
      orderBy: { name: "asc" },
      select: { name: true },
    }),

    Promise.all([
      prisma.fortbildung.count({ where: { beginn: { gte: start, lte: ende } } }),
      prisma.fortbildung.count({ where: { status: "ENTWURF" } }),
      prisma.fortbildung.count({
        where: {
          status: "VEROEFFENTLICHT",
          beginn: { gte: new Date(), lte: in30Tagen },
        },
      }),
    ]),
  ]);

  const [imSchuljahr, entwuerfe, naechste30Tage] = kennzahlen;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fortbildungen</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Schuljahr {schuljahr}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button nativeButton={false}
            variant="outline"
            render={<a href={exportLink(params, aktiverReiter)}>
                <FileSpreadsheet className="size-4" aria-hidden />
                Excel-Export
              </a>
            }
          />
          <Button nativeButton={false}
            render={<Link href="/admin/fortbildungen/neu">
                <CalendarPlus className="size-4" aria-hidden />
                Neue Fortbildung
              </Link>
            }
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Kachel
          wert={imSchuljahr}
          label={`Termine im Schuljahr ${schuljahr}`}
          icon={CalendarDays}
        />
        <Kachel
          wert={naechste30Tage}
          label="veröffentlicht in den nächsten 30 Tagen"
          icon={Clock}
        />
        <Kachel
          wert={entwuerfe}
          label="Entwürfe, noch nicht veröffentlicht"
          icon={PencilLine}
          hervorheben={entwuerfe > 0}
          href={baueUrl("/admin", {}, { reiter: "entwuerfe" })}
        />
      </div>

      {/* Reiter als Links: teilbar, ohne JavaScript nutzbar. */}
      <nav className="flex flex-wrap gap-1 border-b">
        {REITER.map((reiter) => {
          const aktiv = reiter.id === aktiverReiter;
          return (
            <Link
              key={reiter.id}
              href={baueUrl("/admin", params, {
                reiter: reiter.id === "alle" ? undefined : reiter.id,
              })}
              aria-current={aktiv ? "page" : undefined}
              className={
                aktiv
                  ? "-mb-px border-b-2 border-primary px-3 py-2 text-sm font-medium"
                  : "-mb-px border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              {reiter.label}
            </Link>
          );
        })}
      </nav>

      <AdminFilterLeiste
        params={params}
        schlagworte={schlagworte.map((s) => s.name)}
        // Auf den Reitern "regional"/"SchiLf"/"Entwürfe" wäre das
        // entsprechende Auswahlfeld wirkungslos — es wird ausgeblendet.
        ohne={
          aktiverReiter === "entwuerfe"
            ? ["status"]
            : aktiverReiter === "alle"
              ? []
              : ["organisationsform"]
        }
      />

      {fortbildungen.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <Download className="mx-auto mb-3 size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Keine Fortbildung gefunden. Filter anpassen oder{" "}
            <Link
              href="/admin/fortbildungen/neu"
              className="text-foreground underline underline-offset-4"
            >
              neue Fortbildung anlegen
            </Link>
            .
          </p>
        </div>
      ) : (
        <FortbildungTabelle fortbildungen={fortbildungen} />
      )}

      {fortbildungen.length === 300 ? (
        <p className="text-xs text-muted-foreground">
          Es werden die 300 neuesten Treffer angezeigt. Für mehr bitte den
          Zeitraum eingrenzen oder den Excel-Export nutzen.
        </p>
      ) : null}
    </div>
  );
}

/**
 * Kennzahl-Kachel. Ist sie verlinkt, führt der Klick zur passenden
 * Vorfilterung — eine Zahl, die man nicht weiterverfolgen kann, ist nur
 * Dekoration.
 */
function Kachel({
  wert,
  label,
  icon: Icon,
  hervorheben,
  href,
}: {
  wert: number;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  hervorheben?: boolean;
  href?: string;
}) {
  const inhalt = (
    <>
      <Icon
        className={`mb-3 size-4 ${hervorheben ? "text-primary" : "text-muted-foreground"}`}
        aria-hidden
      />
      <span className="block text-2xl font-semibold tabular-nums">{wert}</span>
      <span className="mt-0.5 block text-sm text-muted-foreground text-pretty">
        {label}
      </span>
    </>
  );

  const klassen = `rounded-xl border bg-card p-4 ${
    hervorheben ? "border-primary/30 bg-primary/5" : ""
  }`;

  return href ? (
    <Link href={href} className={`${klassen} karte block`}>
      {inhalt}
    </Link>
  ) : (
    <div className={klassen}>{inhalt}</div>
  );
}

function exportLink(params: SuchParameter, reiter: string): string {
  return baueUrl("/api/admin/export", params, {
    reiter: reiter === "alle" ? undefined : reiter,
  });
}
