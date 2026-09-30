import Link from "next/link";
import { CalendarPlus, ChevronDown, FileSpreadsheet, FileText, SearchX } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { ERFASSER, fortbildungScope, requireRole } from "@/lib/auth";
import { ladeBezirke } from "@/lib/bezirke";
import { darfFreigeben } from "@/constants/fortbildung";
import { baueUrl, filterZuWhere, leseFilter, type SuchParameter } from "@/lib/filter";
import { Button } from "@/components/ui/button";
import { AdminFilterLeiste } from "@/components/admin/AdminFilterLeiste";
import { FortbildungTabelle } from "@/components/admin/FortbildungTabelle";
import { FortbildungsNavigation } from "@/components/admin/FortbildungsNavigation";
import { adminBereichUrl, adminSchuljahr } from "@/lib/adminNavigation";
import { parseSchuljahr, schuljahrWhere } from "@/lib/schuljahr";

export const metadata = { title: "Fortbildungen" };
export const dynamic = "force-dynamic";

type ListenAnsicht = "alle" | "entwuerfe" | "fibs";

export default async function FortbildungenSeite({
  searchParams,
}: {
  searchParams: Promise<SuchParameter>;
}) {
  const user = await requireRole(...ERFASSER);
  const params = await searchParams;
  const filter = leseFilter(params);
  const schuljahrRoh = Array.isArray(params.schuljahr) ? params.schuljahr[0] : params.schuljahr;
  const schuljahr = adminSchuljahr(schuljahrRoh);
  const schuljahrFilter = schuljahr === "alle" ? {} : schuljahrWhere(parseSchuljahr(schuljahr)!);
  const ansichtParam = Array.isArray(params.ansicht) ? params.ansicht[0] : params.ansicht;
  const ansicht: ListenAnsicht = ansichtParam === "entwuerfe" || ansichtParam === "fibs" ? ansichtParam : "alle";
  const jetzt = new Date();
  const istAdmin = darfFreigeben(user.role);
  const ansichtWhere = ansicht === "entwuerfe"
    ? { status: "ENTWURF" }
    : ansicht === "fibs"
      ? {
          status: "VEROEFFENTLICHT",
          inFibs: false,
          organisationsform: { not: "SCHILF" },
          ende: { gte: jetzt },
        }
      : {};
  const where = { AND: [fortbildungScope(user), filterZuWhere(filter), schuljahrFilter, ansichtWhere] };

  const [fortbildungen, schlagworte, bezirke] = await Promise.all([
    prisma.fortbildung.findMany({
      where,
      orderBy: [{ beginn: "asc" }, { titel: "asc" }],
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
        dauerKorrigiertAm: true,
        endeVorKorrektur: true,
        maxTn: true,
        tnTatsaechlich: true,
        status: true,
        inFibs: true,
        fibsLehrgangsnummer: true,
        quelle: true,
        bezirk: { select: { name: true } },
        veranstaltungsort: { select: { name: true, ort: true, istOnline: true } },
        referenten: { select: { referent: { select: { vorname: true, nachname: true } } } },
      },
    }),
    prisma.schlagwort.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
    ladeBezirke(user),
  ]);
  const rueckkehrUrl = baueUrl("/admin/fortbildungen", params, {});
  const exportParams: SuchParameter = { ...params, schuljahr };
  const exportAenderungen = ansicht === "entwuerfe"
    ? { ansicht: undefined, status: "ENTWURF", fibs: undefined }
    : ansicht === "fibs"
      ? { ansicht: undefined, status: "VEROEFFENTLICHT", fibs: "offen-ausschreibung" }
      : { ansicht: undefined };
  const excelExportUrl = baueUrl("/api/admin/export", exportParams, exportAenderungen);
  const pdfExportUrl = baueUrl("/api/admin/export/pdf", exportParams, exportAenderungen);

  const titel = ansicht === "entwuerfe" ? "Entwürfe" : ansicht === "fibs" ? "FIBS" : "Alle Fortbildungen";
  const beschreibung = ansicht === "entwuerfe"
    ? "Fortbildungen, die noch vorbereitet werden."
    : ansicht === "fibs"
      ? "Offene Ausschreibungen für RLFB und ALP."
      : "Angebot, Bearbeitungsstand und Planung in einer Liste.";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="etikett text-primary">Arbeitsbereich</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Fortbildungen</h1>
          <p className="mt-2 text-sm text-muted-foreground">{beschreibung}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button nativeButton={false} render={<Link href={adminBereichUrl("/admin/fortbildungen/neu", params)}><CalendarPlus className="size-4" aria-hidden />Neue Fortbildung</Link>} />
          <details className="group relative">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-xs transition-colors hover:bg-accent [&::-webkit-details-marker]:hidden">
              Export<ChevronDown className="size-3.5 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <div className="absolute right-0 z-10 mt-2 grid min-w-48 gap-1 rounded-xl border bg-popover p-1.5 text-sm shadow-lg">
              <a className="flex min-h-10 items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-accent" href={excelExportUrl}><FileSpreadsheet className="size-4" aria-hidden />Excel exportieren</a>
              <a className="flex min-h-10 items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-accent" href={pdfExportUrl}><FileText className="size-4" aria-hidden />PDF-Bericht</a>
            </div>
          </details>
        </div>
      </div>

      <FortbildungsNavigation params={params} aktiveAnsicht={ansicht} user={user} />
      <AdminFilterLeiste
        params={params}
        schlagworte={schlagworte.map((schlagwort) => schlagwort.name)}
        bezirke={bezirke}
        zeigeBezirk={false}
        ohne={ansicht === "entwuerfe" ? ["status"] : ansicht === "fibs" ? ["status", "fibs"] : []}
      />

      <section aria-labelledby="listen-ueberschrift">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 id="listen-ueberschrift" className="text-lg font-semibold tracking-tight">{titel}</h2>
          <p className="text-sm text-muted-foreground">{fortbildungen.length} Treffer</p>
        </div>
        {fortbildungen.length === 0 ? (
          <div className="border border-dashed bg-card py-14 text-center">
            <SearchX className="mx-auto mb-3 size-6 text-muted-foreground" aria-hidden />
            <p className="font-medium">Keine Fortbildung gefunden.</p>
            <p className="mt-1 text-sm text-muted-foreground">Filter anpassen oder eine neue Fortbildung anlegen.</p>
          </div>
        ) : (
          <FortbildungTabelle fortbildungen={fortbildungen} zeigeZeitAenderungen={istAdmin} rueckkehrUrl={rueckkehrUrl} />
        )}
      </section>
      {fortbildungen.length === 300 ? <p className="text-xs text-muted-foreground">Es werden die ersten 300 Treffer angezeigt. Bitte die Filter weiter eingrenzen.</p> : null}
    </div>
  );
}
