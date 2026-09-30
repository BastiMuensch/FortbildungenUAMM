import type { Metadata } from "next";
import { FileSpreadsheet, FileText, SearchX } from "lucide-react";

import { ERFASSER, requireRole } from "@/lib/auth";
import { ladeBezirksUeberschrift } from "@/lib/bezirke";
import { ladeKatalog, leseKatalogFilter } from "@/lib/katalog";
import { baueUrl, type SuchParameter } from "@/lib/filter";
import { prisma } from "@/lib/prisma";
import { AdminFilterLeiste } from "@/components/admin/AdminFilterLeiste";
import { BerichteNavigation } from "@/components/admin/BerichteNavigation";
import { KatalogTabelle } from "@/components/admin/KatalogTabelle";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Fortbildungskatalog" };
export const dynamic = "force-dynamic";

export default async function KatalogSeite({
  searchParams,
}: {
  searchParams: Promise<SuchParameter>;
}) {
  const user = await requireRole(...ERFASSER);
  const params = await searchParams;
  const filter = leseKatalogFilter(params);

  const [eintraege, schlagworte, bereich] = await Promise.all([
    ladeKatalog(user, filter),
    prisma.schlagwort.findMany({
      orderBy: { name: "asc" },
      select: { name: true },
    }),
    ladeBezirksUeberschrift(user, filter.bezirk),
  ]);

  // Das aufgelöste Standard-Schuljahr reist mit, damit Liste und Downloads
  // auch am Schuljahreswechsel garantiert dieselbe Auswahl verwenden.
  const exportFilter = { schuljahr: filter.schuljahr ?? "alle" };
  const excel = baueUrl("/api/admin/katalog/export", params, exportFilter);
  const pdf = baueUrl("/api/admin/katalog/export/pdf", params, exportFilter);
  const rueckkehrUrl = baueUrl("/admin/katalog", params, exportFilter);

  return (
    <div className="space-y-5">
      <BerichteNavigation aktiveSeite="katalog" rolle={user.role} params={params} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="etikett text-primary">Wissen sichern</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Fortbildungskatalog</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            {bereich} · {filter.schuljahr ?? "Alle Schuljahre"}. Durchsuchbare Sammlung aller gehaltenen Fortbildungen.
            {user.role === "REFERENT" ? " Sie sehen Ihre eigenen Einträge." : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button nativeButton={false} variant="outline" size="sm" render={<a href={excel}><FileSpreadsheet className="size-3.5" aria-hidden /> Excel</a>} />
          <Button nativeButton={false} variant="outline" size="sm" render={<a href={pdf}><FileText className="size-3.5" aria-hidden /> PDF</a>} />
        </div>
      </div>

      <AdminFilterLeiste
        params={params}
        schlagworte={schlagworte.map((schlagwort) => schlagwort.name)}
        zeigeBezirk={false}
        ohne={["status", "fibs"]}
      />

      <p className="text-sm text-muted-foreground">
        {eintraege.length} {eintraege.length === 1 ? "Fortbildung" : "Fortbildungen"} gefunden
      </p>

      {eintraege.length > 0 ? (
        <KatalogTabelle eintraege={eintraege} rueckkehrUrl={rueckkehrUrl} />
      ) : (
        <div className="border border-l-4 border-l-primary bg-card py-16 text-center">
          <SearchX className="mx-auto mb-3 size-7 text-muted-foreground" aria-hidden />
          <p className="font-medium">Keine passende Fortbildung gefunden.</p>
          <p className="mt-1 text-sm text-muted-foreground">Filter oder Suchbegriff anpassen.</p>
        </div>
      )}
    </div>
  );
}
