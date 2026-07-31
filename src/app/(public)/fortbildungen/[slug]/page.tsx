import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ExternalLink,
  Globe,
  MapPin,
  Users,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import {
  oeffentlicheFortbildungSelect,
  oeffentlicheFortbildungWhere,
} from "@/lib/queries";
import { formatDatumLang, formatZeitraum } from "@/lib/datetime";
import { terminWarnung } from "@/lib/ferien";
import {
  formatLabel,
  niveaustufeLabel,
  organisationsformLabel,
  schulartLabel,
} from "@/constants/fortbildung";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatumsBlock } from "@/components/public/DatumsBlock";

async function ladeFortbildung(slug: string) {
  return prisma.fortbildung.findFirst({
    where: { AND: [{ slug }, oeffentlicheFortbildungWhere()] },
    select: oeffentlicheFortbildungSelect,
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const fortbildung = await ladeFortbildung(slug);
  if (!fortbildung) return { title: "Nicht gefunden" };

  return {
    title: fortbildung.titel,
    description: `${formatDatumLang(fortbildung.beginn)} · ${fortbildung.veranstaltungsort.name}`,
  };
}

export default async function FortbildungDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const fortbildung = await ladeFortbildung(slug);
  if (!fortbildung) notFound();

  const abgesagt = fortbildung.status === "ABGESAGT";
  const hinweis = terminWarnung(fortbildung.beginn, fortbildung.ende);

  // Kompetenzen nach Bereich gruppieren, damit "KB 3" nicht fünfmal dasteht.
  const bereiche = new Map<string, string[]>();
  for (const { kompetenz } of fortbildung.kompetenzen) {
    const bereich = kompetenz.parentCode ?? kompetenz.code;
    const liste = bereiche.get(bereich) ?? [];
    if (kompetenz.parentCode) liste.push(`${kompetenz.code} ${kompetenz.titel}`);
    bereiche.set(bereich, liste);
  }

  const schilf = fortbildung.organisationsform === "SCHILF";

  return (
    <article className="mx-auto max-w-3xl">
      <Link
        href="/fortbildungen"
        className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Zur Übersicht
      </Link>

      <header className="flex gap-5">
        <DatumsBlock
          datum={fortbildung.beginn}
          variante={schilf ? "schilf" : "regional"}
          className="size-20 rounded-2xl [&>span:nth-child(2)]:text-3xl"
        />

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
            <span
              className={`font-medium ${schilf ? "text-schilf" : "text-regional"}`}
            >
              {organisationsformLabel(fortbildung.organisationsform)}
            </span>
            <Badge variant="outline">{formatLabel(fortbildung.format)}</Badge>
            {fortbildung.niveaustufe ? (
              <Badge variant="outline">
                {niveaustufeLabel(fortbildung.niveaustufe)}
              </Badge>
            ) : null}
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-balance">
            {fortbildung.titel}
          </h1>
          {fortbildung.kurztitel ? (
            <p className="mt-1.5 text-muted-foreground">{fortbildung.kurztitel}</p>
          ) : null}
        </div>
      </header>

      {abgesagt ? (
        <p className="mt-6 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          Diese Veranstaltung wurde abgesagt.
        </p>
      ) : null}

      {hinweis && (hinweis.art === "ferien" || hinweis.art === "feiertag") ? (
        <p className="mt-6 rounded-xl bg-ferien-weich px-4 py-3 text-sm text-ferien">
          {hinweis.text}
        </p>
      ) : null}

      <dl className="mt-8 grid gap-5 rounded-2xl border bg-card p-6 sm:grid-cols-2">
        <Angabe icon={CalendarDays} label="Termin">
          {formatZeitraum(fortbildung.beginn, fortbildung.ende)}
          <span className="block text-xs">
            {formatDatumLang(fortbildung.beginn)}
          </span>
        </Angabe>

        <Angabe
          icon={fortbildung.veranstaltungsort.istOnline ? Globe : MapPin}
          label="Veranstaltungsort"
        >
          {fortbildung.veranstaltungsort.name}
          {fortbildung.veranstaltungsort.ort &&
          !fortbildung.veranstaltungsort.name.includes(
            fortbildung.veranstaltungsort.ort,
          ) ? (
            <span className="block text-xs">{fortbildung.veranstaltungsort.ort}</span>
          ) : null}
        </Angabe>

        <Angabe icon={Users} label="Plätze">
          maximal {fortbildung.maxTn} Teilnehmende
        </Angabe>

        <Angabe label="Zielgruppe">
          {fortbildung.schularten.map(schulartLabel).join(", ")}
          {fortbildung.fach ? (
            <span className="block text-xs">Fach: {fortbildung.fach}</span>
          ) : null}
        </Angabe>
      </dl>

      <div
        className="beschreibung mt-8"
        // Der Inhalt wurde beim Speichern serverseitig auf eine enge
        // Element-Allowlist gefiltert (src/lib/sanitize.ts).
        dangerouslySetInnerHTML={{ __html: fortbildung.beschreibungHtml }}
      />

      {fortbildung.referenten.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold">Leitung</h2>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {fortbildung.referenten.map(({ referent, rolle }) => (
              <li key={referent.id}>
                {referent.vorname} {referent.nachname}
                {referent.organisation ? ` · ${referent.organisation}` : ""}
                {rolle ? ` (${rolle})` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {bereiche.size > 0 ? (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold">
            Kompetenzen nach DigCompEdu Bavaria
          </h2>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {[...bereiche.entries()]
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([bereich, unter]) => (
                <li key={bereich}>
                  <Link
                    href={`/fortbildungen?kb=${bereich}`}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    Kompetenzbereich {bereich}
                  </Link>
                  {unter.length > 0 ? <> — {unter.sort().join(", ")}</> : null}
                </li>
              ))}
          </ul>
        </section>
      ) : null}

      {fortbildung.schlagworte.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold">Schlagworte</h2>
          <div className="flex flex-wrap gap-1.5">
            {fortbildung.schlagworte.map(({ schlagwort }) => (
              <Link
                key={schlagwort.id}
                href={`/fortbildungen?schlagwort=${encodeURIComponent(schlagwort.name)}`}
              >
                <Badge variant="secondary">{schlagwort.name}</Badge>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-10 flex flex-wrap items-center gap-3 border-t pt-6">
        {fortbildung.fibsUrl && !abgesagt ? (
          <Button nativeButton={false}
            render={<a href={fortbildung.fibsUrl} target="_blank" rel="noopener noreferrer">
                Zur Anmeldung in FIBS
                <ExternalLink className="size-4" aria-hidden />
              </a>
            }
          />
        ) : null}

        <Button nativeButton={false}
          variant="outline"
          render={<a href={`/api/ics?slug=${fortbildung.slug}`}>
              <CalendarPlus className="size-4" aria-hidden />
              Termin speichern (.ics)
            </a>
          }
        />

        {fortbildung.fibsLehrgangsnummer ? (
          <span className="text-sm text-muted-foreground">
            FIBS-Lehrgangsnummer: {fortbildung.fibsLehrgangsnummer}
          </span>
        ) : null}
      </div>

      {!fortbildung.fibsUrl && !abgesagt ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Für diesen Termin ist noch kein FIBS-Link hinterlegt. Die Anmeldung
          erfolgt über die Lehrgangssuche in FIBS
          {fortbildung.fibsLehrgangsnummer
            ? ` unter der Nummer ${fortbildung.fibsLehrgangsnummer}`
            : ""}
          .
        </p>
      ) : null}
    </article>
  );
}

function Angabe({
  icon: Icon,
  label,
  children,
}: {
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      {Icon ? (
        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      ) : (
        <span className="w-4 shrink-0" aria-hidden />
      )}
      <div>
        <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
        <dd className="text-sm">{children}</dd>
      </div>
    </div>
  );
}
