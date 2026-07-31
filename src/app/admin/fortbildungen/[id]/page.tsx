import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ChevronLeft, Copy, ExternalLink } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { ladeFormularDaten } from "@/lib/formularDaten";
import { duplizieren } from "@/actions/fortbildung";
import { FortbildungForm } from "@/components/admin/FortbildungForm";
import { LoeschenKnopf } from "@/components/admin/LoeschenKnopf";
import { Button } from "@/components/ui/button";
import { STATUS_OEFFENTLICH, type FortbildungStatus } from "@/constants/fortbildung";

export const metadata = { title: "Fortbildung bearbeiten" };

export default async function FortbildungBearbeitenPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ gespeichert?: string }>;
}) {
  const user = await requireRole("ADMIN", "REDAKTEUR");
  const { id } = await params;
  const { gespeichert } = await searchParams;

  const [fortbildung, daten] = await Promise.all([
    prisma.fortbildung.findUnique({
      where: { id },
      include: {
        schlagworte: { include: { schlagwort: { select: { name: true, istPflicht: true } } } },
        kompetenzen: { select: { kompetenzCode: true } },
        referenten: { select: { referentId: true } },
      },
    }),
    ladeFormularDaten(),
  ]);

  if (!fortbildung) notFound();

  const istOeffentlich = STATUS_OEFFENTLICH.includes(
    fortbildung.status as FortbildungStatus,
  );

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
        <p className="mb-6 flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          Die Fortbildung wurde gespeichert.
        </p>
      ) : null}

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Fortbildung bearbeiten
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {fortbildung.quelle === "FIBS_IMPORT"
              ? "Aus FIBS importiert. Änderungen hier werden von einem erneuten Import nicht überschrieben."
              : "Manuell erfasst."}
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

      <FortbildungForm
        {...daten}
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
    </div>
  );
}
