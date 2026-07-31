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
import { formatLabel, organisationsformLabel } from "@/constants/fortbildung";
import { StatusBadge } from "@/components/admin/StatusBadge";

interface Zeile {
  id: string;
  titel: string;
  kurztitel: string | null;
  organisationsform: string;
  format: string;
  beginn: Date;
  ende: Date;
  maxTn: number;
  status: string;
  quelle: string;
  veranstaltungsort: { name: string; ort: string | null; istOnline: boolean };
  referenten: Array<{ referent: { vorname: string; nachname: string } }>;
}

export function FortbildungTabelle({ fortbildungen }: { fortbildungen: Zeile[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-40">Termin</TableHead>
            <TableHead className="min-w-64">Titel</TableHead>
            <TableHead>Art</TableHead>
            <TableHead>Format</TableHead>
            <TableHead className="min-w-40">Ort</TableHead>
            <TableHead className="min-w-40">Referenten</TableHead>
            <TableHead className="text-right">Plätze</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {fortbildungen.map((f) => (
            <TableRow key={f.id}>
              <TableCell className="whitespace-nowrap tabular-nums">
                {formatDatumZeit(f.beginn)}
                <span className="block text-xs text-muted-foreground">
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
                <Badge
                  variant={f.organisationsform === "SCHILF" ? "secondary" : "outline"}
                >
                  {organisationsformLabel(f.organisationsform)}
                </Badge>
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

              <TableCell className="text-right tabular-nums">{f.maxTn}</TableCell>

              <TableCell>
                <StatusBadge status={f.status} />
              </TableCell>

              <TableCell>
                <Link
                  href={`/admin/fortbildungen/${f.id}`}
                  aria-label={`${f.titel} bearbeiten`}
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Pencil className="size-3.5" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
