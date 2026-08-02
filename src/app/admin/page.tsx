import Link from "next/link";
import {
  CalendarDays,
  CalendarPlus,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  FileText,
  Globe2,
  PencilLine,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { ERFASSER, fortbildungScope, requireRole } from "@/lib/auth";
import { darfFreigeben } from "@/constants/fortbildung";
import { baueUrl, filterZuWhere, leseFilter, type SuchParameter } from "@/lib/filter";
import { aktuellesSchuljahr, schuljahrZeitraum } from "@/lib/datetime";
import { Button } from "@/components/ui/button";
import { AdminFilterLeiste } from "@/components/admin/AdminFilterLeiste";
import { FortbildungTabelle } from "@/components/admin/FortbildungTabelle";
import { SchuljahrWahl } from "@/components/admin/SchuljahrWahl";

export const metadata = { title: "Fortbildungen verwalten" };

/**
 * Die Reiter der Listenansicht. Jeder setzt eine feste Vorfilterung.
 * Reihenfolge wie im Bericht: SchiLf, RLFB, ALP.
 */
const REITER = [
  { id: "alle", label: "Alle", filter: {} },
  {
    id: "schilf",
    label: "SchiLf",
    filter: { organisationsform: "SCHILF" as string | undefined },
  },
  { id: "regional", label: "RLFB", filter: { organisationsform: "REGIONAL" } },
  { id: "alp", label: "ALP", filter: { organisationsform: "ALP" } },
  { id: "eingereicht", label: "Zur Freigabe", filter: { status: "EINGEREICHT" } },
  { id: "entwuerfe", label: "Entwürfe", filter: { status: "ENTWURF" } },
] as const;

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<SuchParameter>;
}) {
  const user = await requireRole(...ERFASSER);

  const params = await searchParams;
  const aktiverReiter =
    REITER.find((r) => r.id === params.reiter)?.id ?? "alle";

  const filter = leseFilter(params);
  const reiterFilter = REITER.find((r) => r.id === aktiverReiter)!.filter;

  // Referentinnen und Referenten sehen ausschließlich ihre eigenen Termine.
  const scope = fortbildungScope(user);
  const freigabeberechtigt = darfFreigeben(user.role);
  const where = { AND: [scope, filterZuWhere({ ...filter, ...reiterFilter })] };

  const laufendes = aktuellesSchuljahr();
  // Die Kennzahl folgt der Auswahl; ohne Auswahl dem laufenden Schuljahr.
  const kennzahlJahr = filter.schuljahr ?? laufendes;
  const { start, ende } = schuljahrZeitraum(kennzahlJahr);

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
        tnTatsaechlich: true,
        status: true,
        inFibs: true,
        fibsLehrgangsnummer: true,
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
      prisma.fortbildung.count({
        where: { AND: [scope, { beginn: { gte: start, lte: ende } }] },
      }),
      prisma.fortbildung.count({
        where: { AND: [scope, { status: "EINGEREICHT" }] },
      }),
      // Veröffentlicht, aber noch nicht in FIBS ausgeschrieben — dort können
      // sich Lehrkräfte dann nicht anmelden.
      prisma.fortbildung.count({
        where: {
          AND: [
            scope,
            { status: "VEROEFFENTLICHT" },
            { inFibs: false },
            { ende: { gte: new Date() } },
          ],
        },
      }),
      // Offene Teilnehmermeldungen: vergangen, nicht abgesagt, keine Zahl.
      prisma.fortbildung.count({
        where: {
          AND: [
            scope,
            { ende: { lt: new Date() } },
            { status: { not: "ABGESAGT" } },
            { tnTatsaechlich: null },
          ],
        },
      }),
      // Vorhandene Jahrgänge für den Umschalter. Nur Beginn und Ende der
      // Datenreihe nötig — daraus ergibt sich die Liste.
      Promise.all([
        prisma.fortbildung.findFirst({
          where: scope,
          orderBy: { beginn: "asc" },
          select: { beginn: true },
        }),
        prisma.fortbildung.findFirst({
          where: scope,
          orderBy: { beginn: "desc" },
          select: { beginn: true },
        }),
      ]).then(([erste, letzte]) =>
        vorhandeneSchuljahre(erste?.beginn, letzte?.beginn, laufendes),
      ),
    ]),
  ]);

  const [imSchuljahr, zurFreigabe, ohneFibs, offeneMeldungen, jahrgaenge] =
    kennzahlen;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fortbildungen</h1>
          <div className="mt-2">
            <SchuljahrWahl
              params={params}
              jahrgaenge={jahrgaenge}
              aktuell={laufendes}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button nativeButton={false}
            variant="outline"
            render={<a href={exportLink("/api/admin/export", params, aktiverReiter)}>
                <FileSpreadsheet className="size-4" aria-hidden />
                Excel
              </a>
            }
          />
          <Button nativeButton={false}
            variant="outline"
            title="Bericht nach SchiLf, RLFB und ALP gegliedert"
            render={<a href={exportLink("/api/admin/export/pdf", params, aktiverReiter)}>
                <FileText className="size-4" aria-hidden />
                PDF-Bericht
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kachel
          wert={imSchuljahr}
          label={`Termine im Schuljahr ${kennzahlJahr}`}
          icon={CalendarDays}
        />
        {freigabeberechtigt ? (
          <Kachel
            wert={zurFreigabe}
            label="warten auf Freigabe"
            icon={PencilLine}
            hervorheben={zurFreigabe > 0}
            href="/admin/freigaben"
          />
        ) : null}
        <Kachel
          wert={ohneFibs}
          label="veröffentlicht, aber nicht in FIBS"
          icon={Globe2}
          hervorheben={ohneFibs > 0}
          href={baueUrl("/admin", {}, { fibs: "offen" })}
        />
        <Kachel
          wert={offeneMeldungen}
          label="Teilnehmerzahlen noch nicht gemeldet"
          icon={ClipboardCheck}
          hervorheben={offeneMeldungen > 0}
          href="/admin/nachbereitung"
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

/**
 * Alle Schuljahre zwischen dem ersten und dem letzten Termin, neueste zuerst.
 * Das laufende Schuljahr ist immer dabei, auch wenn dafür noch nichts
 * eingetragen ist — sonst ließe es sich nicht auswählen.
 */
function vorhandeneSchuljahre(
  erste: Date | undefined,
  letzte: Date | undefined,
  laufendes: string,
): string[] {
  const jahre = new Set<string>([laufendes]);

  if (erste && letzte) {
    const von = Number(aktuellesSchuljahr(erste).slice(0, 4));
    const bis = Number(aktuellesSchuljahr(letzte).slice(0, 4));
    for (let jahr = von; jahr <= bis; jahr += 1) jahre.add(`${jahr}/${jahr + 1}`);
  }

  return [...jahre].sort().reverse();
}

function exportLink(basis: string, params: SuchParameter, reiter: string): string {
  return baueUrl(basis, params, {
    reiter: reiter === "alle" ? undefined : reiter,
  });
}
