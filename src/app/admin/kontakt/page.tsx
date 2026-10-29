import { bezirkScope, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BezirkskontaktFormular } from "@/components/admin/BezirkskontaktFormular";

export const metadata = { title: "Kontakt & Anfragen" };

export default async function BezirkskontaktSeite() {
  const person = await requireRole("RVS", "ADMIN");
  const bezirke = await prisma.bezirk.findMany({
    where: { AND: [bezirkScope(person), { aktiv: true }] },
    select: { id: true, name: true, kuerzel: true, kontaktEmail: true },
    orderBy: { name: "asc" },
  });
  return <div className="max-w-3xl space-y-6">
    <header>
      <h1 className="text-2xl font-semibold tracking-tight">Kontakt & Fortbildungsanfragen</h1>
      <p className="mt-2 text-sm text-muted-foreground">Hinterlegen Sie für Ihre Bezirke die dienstliche Kontaktadresse. Besucherinnen und Besucher können damit eine E-Mail an den zuständigen BdB öffnen – auf Wunsch mit einer Vorlage für Fortbildungsanfragen.</p>
    </header>
    {bezirke.map((bezirk) => <BezirkskontaktFormular key={bezirk.id} bezirk={bezirk} />)}
    {bezirke.length === 0 ? <p className="text-sm text-muted-foreground">Es ist kein aktiver Schulamtsbezirk zugeordnet.</p> : null}
  </div>;
}
