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
      {/* Auf dem Telefon ist eine Zeile mit zehn Spalten kein Arbeitsmittel.
          Die wichtigsten Angaben werden deshalb als kompakte Vorgangskarten
          gezeigt; ab Tabletbreite bleibt die informationsreiche Tabelle. */}
      <div className="grid gap-3 md:hidden">
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
                <StatusKennzeichen status={f.status} />
                <FibsKennzeichen
                  inFibs={f.inFibs}
                  lehrgangsnummer={f.fibsLehrgangsnummer}
                />
              </div>

              <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                {f.veranstaltungsort.istOnline ? (
                  <Globe className="size-3.5 shrink-0" aria-hidden />
                ) : (
                  <MapPin className="size-3.5 shrink-0" aria-hidden />
                )}
                {f.veranstaltungsort.name}
                <span aria-hidden>·</span>
                <span className="zahl">{f.tnTatsaechlich ?? "—"} / {f.maxTn} TN</span>
              </p>
            </Link>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto border md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-40">Termin</TableHead>
            <TableHead className="min-w-64">Titel</TableHead>
            <TableHead>Art</TableHead>
            <TableHead>Format</TableHead>
            <TableHead className="min-w-40">Ort</TableHead>
            <TableHead className="min-w-40">Referenten</TableHead>
            <TableHead className="text-right" title="Tatsächliche Teilnehmerzahl von geplanten Plätzen">
              TN / Plätze
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead>FIBS</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {fortbildungen.map((f) => (
            <TableRow key={f.id}>
              <TableCell className="zahl whitespace-nowrap">
                {formatDatumZeit(f.beginn)}
                <span className="zahl block text-xs text-muted-foreground">
                  bis {formatZeit(f.ende)} Uhr
                </span>
              </TableCell>

              <TableCell>
                <Link
                  href={`/admin/fortbildungen/${f.id}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {f.titel}
                </Link>
                {f.kurztitel ? (
                  <span className="block text-xs text-muted-foreground">
                    {f.kurztitel}
                  </span>
                ) : null}
                {f.quelle === "FIBS_IMPORT" ? (
                  <Badge variant="outline" className="mt-1">
                    aus FIBS
                  </Badge>
                ) : null}
              </TableCell>

              <TableCell className="whitespace-nowrap">
                {/* Dieselbe Farbzuordnung wie im Frontend und im Kalender. */}
                <span
                  className={`etikett inline-flex px-1.5 py-0.5 ${
                    ebeneKlassen(f.organisationsform).flaeche
                  }`}
                >
                  {organisationsformKurz(f.organisationsform)}
                </span>
              </TableCell>

              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                {formatLabel(f.format)}
              </TableCell>

              <TableCell className="text-sm">
                <span className="flex items-center gap-1.5">
                  {f.veranstaltungsort.istOnline ? (
                    <Globe className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  ) : (
                    <MapPin className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  )}
                  {f.veranstaltungsort.name}
                </span>
              </TableCell>

              <TableCell className="text-sm text-muted-foreground">
                {f.referenten.length === 0
                  ? "—"
                  : f.referenten
                      .map((r) => `${r.referent.vorname} ${r.referent.nachname}`)
                      .join(", ")}
              </TableCell>

              <TableCell className="zahl text-right whitespace-nowrap">
                {f.tnTatsaechlich !== null ? (
                  <span className="font-medium">{f.tnTatsaechlich}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
                <span className="text-muted-foreground"> / {f.maxTn}</span>
              </TableCell>

              <TableCell>
                <StatusKennzeichen status={f.status} />
              </TableCell>

              <TableCell>
                <FibsKennzeichen
                  inFibs={f.inFibs}
                  lehrgangsnummer={f.fibsLehrgangsnummer}
                />
              </TableCell>

              <TableCell>
                <Link
                  href={`/admin/fortbildungen/${f.id}`}
                  aria-label={`${f.titel} bearbeiten`}
                  className="flex size-7 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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
