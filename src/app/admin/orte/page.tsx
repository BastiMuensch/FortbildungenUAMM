import { Globe, Power } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { setzeOrtAktiv } from "@/actions/stammdaten";
import { OrtFormular } from "@/components/admin/OrtFormular";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Veranstaltungsorte" };

export default async function OrtePage() {
  await requireRole("ADMIN", "REDAKTEUR");

  const orte = await prisma.veranstaltungsort.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      ort: true,
      strasse: true,
      schulnummer: true,
      istOnline: true,
      aktiv: true,
      _count: { select: { fortbildungen: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Veranstaltungsorte</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Orte werden nicht gelöscht, sondern stillgelegt — an ihnen hängen
          vergangene Termine, deren Ortsangabe erhalten bleiben muss.
          Stillgelegte Orte stehen im Formular nicht mehr zur Auswahl.
        </p>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Die Liste entspricht dem Schulverzeichnis des Schulamts (Stand
          31.07.2026). Bei Umbenennungen, Zusammenlegungen oder Umzügen hier
          nachpflegen.
        </p>
      </div>

      <OrtFormular />

      <div className="overflow-x-auto border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-56">Name</TableHead>
              <TableHead>Ort</TableHead>
              <TableHead>Adresse</TableHead>
              <TableHead className="text-right">Termine</TableHead>
              <TableHead className="w-32">Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {orte.map((o) => (
              <TableRow key={o.id} className={o.aktiv ? undefined : "opacity-50"}>
                <TableCell className="font-medium">
                  <span className="flex items-center gap-1.5">
                    {o.istOnline ? (
                      <Globe className="size-3.5 text-muted-foreground" aria-hidden />
                    ) : null}
                    {o.name}
                  </span>
                  {o.schulnummer ? (
                    <span className="text-xs text-muted-foreground">
                      Schulnummer {o.schulnummer}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {o.ort ?? "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {o.strasse ?? "—"}
                </TableCell>
                <TableCell className="text-right zahl">
                  {o._count.fortbildungen}
                </TableCell>
                <TableCell>
                  {o.istOnline ? (
                    <Badge variant="secondary">immer aktiv</Badge>
                  ) : (
                    <form action={setzeOrtAktiv.bind(null, o.id, !o.aktiv)}>
                      <Button type="submit" variant="ghost" size="sm">
                        <Power className="size-3.5" aria-hidden />
                        {o.aktiv ? "stilllegen" : "aktivieren"}
                      </Button>
                    </form>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
