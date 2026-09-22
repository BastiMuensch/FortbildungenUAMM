import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BezirksVerwaltung } from "@/components/admin/BezirksVerwaltung";
import { ladeBdbsMitEinladung } from "@/lib/bdbVerwaltung";

export const metadata = { title: "Bezirke und BdBs" };

export default async function BezirkePage() {
  await requireRole("RVS");
  const bezirke = await prisma.bezirk.findMany({
    select: { id: true, name: true, aktiv: true, pflichtSchlagworte: true },
    orderBy: { name: "asc" },
  });
  const bdbs = await ladeBdbsMitEinladung();
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-semibold tracking-tight">Bezirke und BdBs</h1><p className="mt-1 max-w-3xl text-sm text-muted-foreground">Die Regierung von Schwaben richtet Bezirke ein und weist BdBs ihre Zuständigkeiten zu.</p></div>
    <BezirksVerwaltung bezirke={bezirke} bdbs={bdbs} />
  </div>;
}
