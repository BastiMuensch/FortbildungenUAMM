import { CheckSquare, Lock, Square, Trash2 } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireRole, fortbildungScope } from "@/lib/auth";
import { entferneSchlagwort, setzeFibsSuche } from "@/actions/stammdaten";
import { SchlagwortFormular } from "@/components/admin/SchlagwortFormular";
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

export const metadata = { title: "Schlagworte" };

export default async function SchlagwortePage() {
  const user = await requireRole("RVS", "ADMIN", "REDAKTEUR");

  const schlagworte = await prisma.schlagwort.findMany({
    orderBy: [{ istPflicht: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      istPflicht: true,
      fuerFibsImport: true,
      _count: { select: { fortbildungen: { where: { fortbildung: fortbildungScope(user) } } } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Schlagworte</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Pflicht-Schlagworte werden pro Bezirk festgelegt und dessen Fortbildungen automatisch angehängt. Die Häkchen in der Spalte
          „FIBS-Suche“ bestimmen, mit welchen Begriffen der FIBS-Import nach
          Lehrgängen sucht.
        </p>
      </div>

      <SchlagwortFormular />

      <div className="overflow-x-auto border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-56">Schlagwort</TableHead>
              <TableHead>FIBS-Suche</TableHead>
              <TableHead className="text-right">Verwendet in</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {schlagworte.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">
                  {s.name}
                  {s.istPflicht ? (
                    <Badge variant="secondary" className="ml-2">
                      <Lock className="size-3" aria-hidden />
                      Pflicht
                    </Badge>
                  ) : null}
                </TableCell>

                <TableCell>
                  {/* Ein Formular pro Zeile mit Server Action — der Schalter
                      funktioniert dadurch auch ohne JavaScript. */}
                  <form action={setzeFibsSuche.bind(null, s.id, !s.fuerFibsImport)}>
                    <button
                      type="submit"
                      disabled={user.role !== "RVS"}
                      aria-pressed={s.fuerFibsImport}
                      className="flex items-center gap-2 px-1.5 py-1 text-sm transition-colors hover:bg-accent"
                    >
                      {s.fuerFibsImport ? (
                        <>
                          <CheckSquare className="size-4 text-primary" aria-hidden />
                          wird gesucht
                        </>
                      ) : (
                        <>
                          <Square className="size-4 text-muted-foreground" aria-hidden />
                          <span className="text-muted-foreground">
                            nicht berücksichtigt
                          </span>
                        </>
                      )}
                    </button>
                  </form>
                </TableCell>

                <TableCell className="text-right zahl">
                  {s._count.fortbildungen}
                </TableCell>

                <TableCell>
                  {user.role === "RVS" && !s.istPflicht ? (
                    <form action={entferneSchlagwort.bind(null, s.id)}>
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Schlagwort ${s.name} löschen`}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </form>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
