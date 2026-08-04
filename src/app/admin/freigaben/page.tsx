import Link from "next/link";
import { CheckCircle2, Clock, Globe, MapPin } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { REDAKTION, requireRole } from "@/lib/auth";
import { formatDatumZeit, formatZeitraum } from "@/lib/datetime";
import {
  formatLabel,
  niveaustufeLabel,
  organisationsformKurz,
  schulartLabel,
} from "@/constants/fortbildung";
import { FreigabeLeiste } from "@/components/admin/FreigabeLeiste";

export const metadata = { title: "Freigaben" };
export const dynamic = "force-dynamic";

export default async function FreigabenSeite() {
  await requireRole(...REDAKTION);

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

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Freigaben</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground text-pretty">
          Fortbildungen, die Referentinnen und Referenten zur Freigabe
          eingereicht haben. Erst nach der Freigabe erscheinen sie im Frontend
          — und erst dann sollten sie auch in FIBS eingetragen werden.
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
            <article key={f.id} className="border border-l-4 border-l-ferien bg-card p-5">
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

              <h2 className="font-semibold tracking-tight">
                <Link
                  href={`/admin/fortbildungen/${f.id}`}
                  className="underline-offset-4 hover:underline"
                >
                  {f.titel}
                </Link>
              </h2>

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
    </div>
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
