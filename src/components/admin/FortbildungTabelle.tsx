import Link from "next/link";
import { Globe, MapPin, Pencil } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDatumZeit, formatZeit } from "@/lib/datetime";
import {
  ebeneKlassen,
  formatLabel,
  organisationsformKurz,
} from "@/constants/fortbildung";
import { cn } from "@/lib/utils";
import {
  FibsKennzeichen,
  StatusKennzeichen,
} from "@/components/admin/Kennzeichen";

interface Zeile {
  id: string;
  titel: string;
  kurztitel: string | null;
  organisationsform: string;
  format: string;
  beginn: Date;
  ende: Date;
  maxTn: number;
  tnTatsaechlich: number | null;
  status: string;
  inFibs: boolean;
  fibsLehrgangsnummer: string | null;
  quelle: string;
  veranstaltungsort: { name: string; ort: string | null; istOnline: boolean };
  referenten: Array<{ referent: { vorname: string; nachname: string } }>;
}

export function FortbildungTabelle({ fortbildungen }: { fortbildungen: Zeile[] }) {
  return (
    <>
      {/* Unterhalb der Desktopbreite sind Karten besser lesbar als eine
          zusammengequetschte Tabelle. Sie enthalten dieselben Arbeitshinweise
          wie die sechs Spalten der großen Ansicht. */}
      <div className="grid gap-3 xl:hidden">
        {fortbildungen.map((f) => {
          const ebene = ebeneKlassen(f.organisationsform);
          return (
            <Link
              key={f.id}
              href={`/admin/fortbildungen/${f.id}`}
              className={cn(
                "border border-l-4 bg-card p-4 outline-none transition-colors hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring",
                ebene.kante,
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="zahl text-xs text-muted-foreground">
                    {formatDatumZeit(f.beginn)}–{formatZeit(f.ende)} Uhr
                  </p>
                  <h3 className="mt-1 font-semibold leading-snug">{f.titel}</h3>
                </div>
                <Pencil className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={cn("etikett px-1.5 py-0.5", ebene.flaeche)}>
                  {organisationsformKurz(f.organisationsform)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatLabel(f.format)}
                </span>
                {f.quelle === "FIBS_IMPORT" ? (
                  <Badge variant="outline">aus FIBS</Badge>
                ) : null}
                <StatusKennzeichen status={f.status} />
                <FibsKennzeichen
                  inFibs={f.inFibs}
                  lehrgangsnummer={f.fibsLehrgangsnummer}
                  ausfuehrlich
                />
              </div>

              <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                <p className="flex items-start gap-1.5">
                  {f.veranstaltungsort.istOnline ? (
                    <Globe className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  ) : (
                    <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  )}
                  <span>
                    {f.veranstaltungsort.name}
                    {f.veranstaltungsort.ort ? `, ${f.veranstaltungsort.ort}` : ""}
                  </span>
                </p>
                <p>
                  {f.referenten.length === 0
                    ? "Keine Referent:innen hinterlegt"
                    : f.referenten
                        .map((r) => `${r.referent.vorname} ${r.referent.nachname}`)
                        .join(", ")}
                </p>
                <p className="zahl">
                  {f.tnTatsaechlich ?? "—"} / {f.maxTn} TN
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="hidden border xl:block">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[15%]">Termin</TableHead>
            <TableHead className="w-[25%]">Fortbildung</TableHead>
            <TableHead className="w-[22%]">Ort &amp; Leitung</TableHead>
            <TableHead
              className="w-[9%] text-right"
              title="Tatsächliche Teilnehmerzahl von geplanten Plätzen"
            >
              TN / Plätze
            </TableHead>
            <TableHead className="w-[21%]">Bearbeitungsstand</TableHead>
            <TableHead className="w-12 text-right">Aktion</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {fortbildungen.map((f) => (
            <TableRow key={f.id}>
              <TableCell className="zahl whitespace-normal">
                {formatDatumZeit(f.beginn)}
                <span className="zahl block text-xs text-muted-foreground">
                  bis {formatZeit(f.ende)} Uhr
                </span>
              </TableCell>

              <TableCell className="whitespace-normal">
                <Link
                  href={`/admin/fortbildungen/${f.id}`}
                  className="font-medium leading-snug underline-offset-4 hover:underline"
                >
                  {f.titel}
                </Link>
                {f.kurztitel ? (
                  <span className="block text-xs text-muted-foreground">
                    {f.kurztitel}
                  </span>
                ) : null}
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {/* Dieselbe Farbzuordnung wie im Frontend und im Kalender. */}
                  <span
                    className={`etikett inline-flex px-1.5 py-0.5 ${ebeneKlassen(f.organisationsform).flaeche}`}
                  >
                    {organisationsformKurz(f.organisationsform)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatLabel(f.format)}
                  </span>
                  {f.quelle === "FIBS_IMPORT" ? (
                    <Badge variant="outline">aus FIBS</Badge>
                  ) : null}
                </div>
              </TableCell>

              <TableCell className="whitespace-normal text-sm">
                <div className="flex items-start gap-1.5 leading-snug">
                  {f.veranstaltungsort.istOnline ? (
                    <Globe className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  ) : (
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  )}
                  <span>
                    {f.veranstaltungsort.name}
                    {f.veranstaltungsort.ort ? `, ${f.veranstaltungsort.ort}` : ""}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-snug text-muted-foreground">
                  {f.referenten.length === 0
                    ? "Keine Referent:innen hinterlegt"
                    : f.referenten
                        .map((r) => `${r.referent.vorname} ${r.referent.nachname}`)
                        .join(", ")}
                </p>
              </TableCell>

              <TableCell className="zahl whitespace-normal text-right">
                {f.tnTatsaechlich !== null ? (
                  <span className="font-medium">{f.tnTatsaechlich}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
                <span className="text-muted-foreground"> / {f.maxTn}</span>
              </TableCell>

              <TableCell className="whitespace-normal">
                <div className="flex flex-col items-start gap-1.5">
                  <StatusKennzeichen status={f.status} />
                  <FibsKennzeichen
                    inFibs={f.inFibs}
                    lehrgangsnummer={f.fibsLehrgangsnummer}
                    ausfuehrlich
                  />
                </div>
              </TableCell>

              <TableCell className="whitespace-normal text-right">
                <Link
                  href={`/admin/fortbildungen/${f.id}`}
                  aria-label={`${f.titel} bearbeiten`}
                  className="ml-auto flex size-7 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Pencil className="size-3.5" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </>
  );
}
