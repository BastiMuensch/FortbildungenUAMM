import Link from "next/link";
import { CheckCircle2, Clock, Globe, MapPin } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { formatDatumZeit, formatZeitraum } from "@/lib/datetime";
import {
  formatLabel,
  niveaustufeLabel,
  organisationsformKurz,
  schulartLabel,
} from "@/constants/fortbildung";
import { FreigabeLeiste } from "@/components/admin/FreigabeLeiste";

/**
 * Alle zur administrativen Prüfung eingereichten Fortbildungen.
 *
 * Der Bereich kann als eigene Seite oder als Arbeitsbereich im Dashboard
 * dargestellt werden. Die Rollenprüfung gehört bewusst auch hierher, damit
 * die Komponente nicht versehentlich außerhalb eines geschützten Kontexts
 * verwendet werden kann.
 */
export async function FreigabenBereich({
  eingebettet = false,
}: {
  eingebettet?: boolean;
}) {
  await requireRole("ADMIN");

  const eingereicht = await prisma.fortbildung.findMany({
    where: { status: "EINGEREICHT" },
    // Am längsten wartende zuerst — niemand soll übersehen werden.
    orderBy: [{ eingereichtAm: "asc" }, { beginn: "asc" }],
    select: {
      id: true,
      titel: true,
      beschreibungText: true,
      organisationsform: true,
      format: true,
      beginn: true,
      ende: true,
      maxTn: true,
      schularten: true,
      niveaustufe: true,
      eingereichtAm: true,
      fibsLehrgangsnummer: true,
      veranstaltungsort: { select: { name: true, istOnline: true } },
      ersteller: { select: { name: true, email: true } },
      referenten: {
        select: { referent: { select: { vorname: true, nachname: true } } },
      },
      _count: { select: { kompetenzen: true } },
    },
  });

  const einleitung = eingebettet
    ? "Zur Prüfung eingereichte Fortbildungen direkt bearbeiten."
    : "Fortbildungen, die zur administrativen Freigabe eingereicht wurden. Prüfen, veröffentlichen und anschließend den tatsächlichen FIBS-Eintrag markieren darf ausschließlich die Administration.";

  return (
    <section
      aria-labelledby="freigaben-ueberschrift"
      className={
        eingebettet
          ? "space-y-5 border border-l-4 border-l-primary bg-card p-5 sm:p-6"
          : "max-w-4xl space-y-6"
      }
    >
      <div>
        {eingebettet ? (
          <h2
            id="freigaben-ueberschrift"
            className="text-xl font-semibold tracking-tight"
          >
            Freigaben
          </h2>
        ) : (
          <h1
            id="freigaben-ueberschrift"
            className="text-2xl font-semibold tracking-tight"
          >
            Freigaben
          </h1>
        )}
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground text-pretty">
          {einleitung}
        </p>
      </div>

      {eingereicht.length === 0 ? (
        <div className="border border-l-4 border-l-primary bg-card py-16 text-center">
          <CheckCircle2
            className="mx-auto mb-3 size-7 text-muted-foreground/60"
            aria-hidden
          />
          <p className="font-medium">Nichts zu tun.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Derzeit wartet keine Fortbildung auf eine Freigabe.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {eingereicht.map((f) => (
            <article
              key={f.id}
              className="border border-l-4 border-l-ferien bg-card p-5"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="bg-secondary px-2 py-0.5 font-medium">
                  {organisationsformKurz(f.organisationsform)}
                </span>
                <span className="text-muted-foreground">
                  {formatLabel(f.format)}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  {f.veranstaltungsort.istOnline ? (
                    <Globe className="size-3" aria-hidden />
                  ) : (
                    <MapPin className="size-3" aria-hidden />
                  )}
                  {f.veranstaltungsort.name}
                </span>
                {f.eingereichtAm ? (
                  <span className="ml-auto flex items-center gap-1 text-muted-foreground">
                    <Clock className="size-3" aria-hidden />
                    eingereicht am {formatDatumZeit(f.eingereichtAm)}
                  </span>
                ) : null}
              </div>

              {eingebettet ? (
                <h3 className="font-semibold tracking-tight">
                  <Link
                    href={`/admin/fortbildungen/${f.id}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {f.titel}
                  </Link>
                </h3>
              ) : (
                <h2 className="font-semibold tracking-tight">
                  <Link
                    href={`/admin/fortbildungen/${f.id}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {f.titel}
                  </Link>
                </h2>
              )}

              <p className="mt-1 text-sm text-muted-foreground zahl">
                {formatZeitraum(f.beginn, f.ende)} · {f.maxTn} Plätze
              </p>

              <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                {f.beschreibungText}
              </p>

              <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <Angabe
                  label="Eingereicht von"
                  wert={f.ersteller?.name ?? f.ersteller?.email ?? "—"}
                />
                <Angabe
                  label="Leitung"
                  wert={
                    f.referenten
                      .map((r) => `${r.referent.vorname} ${r.referent.nachname}`)
                      .join(", ") || "—"
                  }
                />
                <Angabe
                  label="Zielgruppe"
                  wert={f.schularten.map(schulartLabel).join(", ")}
                />
                <Angabe
                  label="DigCompEdu"
                  wert={`${f.niveaustufe ? niveaustufeLabel(f.niveaustufe) : "ohne Niveaustufe"} · ${f._count.kompetenzen} Kompetenz(en)`}
                />
              </dl>

              <FreigabeLeiste
                id={f.id}
                titel={f.titel}
                lehrgangsnummer={f.fibsLehrgangsnummer}
              />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Angabe({ label, wert }: { label: string; wert: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-pretty">{wert}</dd>
    </div>
  );
}
