import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  ChevronLeft,
  Copy,
  ExternalLink,
  History,
  Printer,
  Undo2,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { ERFASSER, fortbildungScope, requireRole } from "@/lib/auth";
import { ladeFormularDaten } from "@/lib/formularDaten";
import { duplizieren } from "@/actions/fortbildung";
import { FortbildungForm } from "@/components/admin/FortbildungForm";
import { LoeschenKnopf } from "@/components/admin/LoeschenKnopf";
import { Button } from "@/components/ui/button";
import {
  STATUS_OEFFENTLICH,
  STATUS_FUER_REFERENTEN,
  darfFreigeben,
  type FortbildungStatus,
} from "@/constants/fortbildung";
import { formatDatumZeit } from "@/lib/datetime";
import { FibsKennzeichen, StatusKennzeichen } from "@/components/admin/Kennzeichen";
import { FibsSchalter } from "@/components/admin/FibsSchalter";
import { FreigabeLeiste } from "@/components/admin/FreigabeLeiste";
import { Aenderungsverlauf } from "@/components/admin/Aenderungsverlauf";

export const metadata = { title: "Fortbildung bearbeiten" };

export default async function FortbildungBearbeitenPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ gespeichert?: string }>;
}) {
  const user = await requireRole(...ERFASSER);
  const { id } = await params;
  const { gespeichert } = await searchParams;

  const [fortbildung, daten] = await Promise.all([
    prisma.fortbildung.findFirst({
      // Referentinnen und Referenten dürfen nur eigene bzw. ihnen
      // zugeordnete Fortbildungen öffnen. Die Seitenprüfung ist zusätzlich
      // zu den Berechtigungsprüfungen in den Server Actions nötig.
      where: { AND: [{ id }, fortbildungScope(user)] },
      include: {
        schlagworte: { include: { schlagwort: { select: { name: true, istPflicht: true } } } },
        kompetenzen: { select: { kompetenzCode: true } },
        referenten: { select: { referentId: true } },
        fibsEingetragenVon: { select: { name: true, email: true } },
        freigegebenVon: { select: { name: true, email: true } },
      },
    }),
    ladeFormularDaten(),
  ]);

  if (!fortbildung) notFound();

  const istOeffentlich = STATUS_OEFFENTLICH.includes(
    fortbildung.status as FortbildungStatus,
  );
  const freigabeberechtigt = darfFreigeben(user.role);
  const darfInhaltBearbeiten =
    freigabeberechtigt ||
    STATUS_FUER_REFERENTEN.includes(fortbildung.status as never);

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Zurück zur Übersicht
      </Link>

      {gespeichert ? (
        <p className="mb-6 flex items-center gap-2 bg-primary/10 px-4 py-3 text-sm text-primary">
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          Die Fortbildung wurde gespeichert.
        </p>
      ) : null}

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Fortbildung bearbeiten
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusKennzeichen status={fortbildung.status} />
            <FibsKennzeichen
              inFibs={fortbildung.inFibs}
              lehrgangsnummer={fortbildung.fibsLehrgangsnummer}
              organisationsform={fortbildung.organisationsform}
            />
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            {fortbildung.quelle === "FIBS_IMPORT"
              ? "Aus FIBS importiert. Änderungen hier werden von einem erneuten Import nicht überschrieben."
              : "Manuell erfasst."}
            {fortbildung.freigegebenAm
              ? ` Freigegeben am ${formatDatumZeit(fortbildung.freigegebenAm)}${
                  fortbildung.freigegebenVon
                    ? ` von ${fortbildung.freigegebenVon.name ?? fortbildung.freigegebenVon.email}`
                    : ""
                }.`
              : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {istOeffentlich ? (
            <Button nativeButton={false}
              variant="outline"
              size="sm"
              render={<Link href={`/fortbildungen/${fortbildung.slug}`} target="_blank">
                  <ExternalLink className="size-3.5" aria-hidden />
                  Im Frontend ansehen
                </Link>
              }
            />
          ) : null}

          <Button
            nativeButton={false}
            variant="outline"
            size="sm"
            title="A4-Seite zum Ausdrucken und Aushängen"
            render={
              <a
                href={`/api/admin/fortbildungen/${fortbildung.id}/aushang`}
                target="_blank"
              >
                <Printer className="size-3.5" aria-hidden />
                Aushang
              </a>
            }
          />

          <form action={duplizieren.bind(null, fortbildung.id)}>
            <Button type="submit" variant="outline" size="sm">
              <Copy className="size-3.5" aria-hidden />
              Duplizieren
            </Button>
          </form>

          {user.role === "ADMIN" ? (
            <LoeschenKnopf id={fortbildung.id} titel={fortbildung.titel} />
          ) : null}
        </div>
      </div>

      {fortbildung.freigabeNotiz ? (
        <div className="mb-6 bg-ferien-weich px-4 py-3 text-sm text-ferien">
          <p className="flex items-start gap-2 font-medium">
            <Undo2 className="mt-0.5 size-4 shrink-0" aria-hidden />
            Von der Administration zurückgewiesen
          </p>
          <p className="mt-1 pl-6 text-pretty">{fortbildung.freigabeNotiz}</p>
        </div>
      ) : null}

      {freigabeberechtigt && fortbildung.status === "EINGEREICHT" ? (
        <div className="mb-6 border bg-card p-5">
          <p className="text-sm font-medium">Zur Freigabe eingereicht</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {fortbildung.eingereichtAm
              ? `Eingereicht am ${formatDatumZeit(fortbildung.eingereichtAm)}.`
              : ""}{" "}
            Nach der Freigabe erscheint die Fortbildung im Frontend.
          </p>
          <FreigabeLeiste
            id={fortbildung.id}
            titel={fortbildung.titel}
            lehrgangsnummer={fortbildung.fibsLehrgangsnummer}
          />
        </div>
      ) : null}

      {freigabeberechtigt ? (
        <div className="mb-6">
          <FibsSchalter
            id={fortbildung.id}
            inFibs={fortbildung.inFibs}
            lehrgangsnummer={fortbildung.fibsLehrgangsnummer}
            organisationsform={fortbildung.organisationsform}
            eingetragenAm={fortbildung.fibsEingetragenAm}
            eingetragenVon={
              fortbildung.fibsEingetragenVon?.name ??
              fortbildung.fibsEingetragenVon?.email ??
              null
            }
          />
        </div>
      ) : null}

      {darfInhaltBearbeiten ? (
        <FortbildungForm
          {...daten}
          darfVeroeffentlichen={freigabeberechtigt}
          fortbildung={{
          id: fortbildung.id,
          titel: fortbildung.titel,
          kurztitel: fortbildung.kurztitel,
          beschreibungHtml: fortbildung.beschreibungHtml,
          organisationsform: fortbildung.organisationsform,
          maxTn: fortbildung.maxTn,
          format: fortbildung.format,
          beginn: fortbildung.beginn,
          ende: fortbildung.ende,
          veranstaltungsortId: fortbildung.veranstaltungsortId,
          schularten: fortbildung.schularten,
          fach: fortbildung.fach,
          niveaustufe: fortbildung.niveaustufe,
          fibsLehrgangsnummer: fortbildung.fibsLehrgangsnummer,
          fibsUrl: fortbildung.fibsUrl,
          status: fortbildung.status,
          kompetenzCodes: fortbildung.kompetenzen.map((k) => k.kompetenzCode),
          // Pflicht-Schlagworte zeigt das Formular selbst an, sie kommen nicht
          // in die frei bearbeitbare Liste.
          schlagwortNamen: fortbildung.schlagworte
            .filter((s) => !s.schlagwort.istPflicht)
            .map((s) => s.schlagwort.name),
          referentIds: fortbildung.referenten.map((r) => r.referentId),
          }}
        />
      ) : (
        <div className="border-l-4 border-primary bg-primary/5 px-5 py-4">
          <p className="font-medium">Von der Administration freigegeben</p>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Veröffentlichte oder archivierte Ausschreibungen können nur noch
            von der Administration geändert werden. Die tatsächliche
            Teilnehmerzahl können Sie bei eigenen SchiLf weiterhin unter
            Nachbereitung melden.
          </p>
          <Button
            className="mt-4"
            nativeButton={false}
            variant="outline"
            render={<Link href="/admin/nachbereitung">Zur Nachbereitung</Link>}
          />
        </div>
      )}

      <section className="mt-12 border-t pt-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <History className="size-4 text-muted-foreground" aria-hidden />
          Änderungsverlauf
        </h2>
        <Aenderungsverlauf id={fortbildung.id} />
      </section>
    </div>
  );
}
