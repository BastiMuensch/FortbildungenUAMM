import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { ReferentenVerwaltung } from "@/components/admin/ReferentenVerwaltung";

export const metadata = { title: "Referenten" };

export default async function ReferentenPage() {
  const user = await requireRole("ADMIN", "REDAKTEUR");

  const referenten = await prisma.referent.findMany({
    orderBy: [{ aktiv: "desc" }, { nachname: "asc" }, { vorname: "asc" }],
    select: {
      id: true,
      vorname: true,
      nachname: true,
      organisation: true,
      email: true,
      telefon: true,
      notiz: true,
      oeffentlichSichtbar: true,
      aktiv: true,
      _count: { select: { fortbildungen: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Referentinnen und Referenten
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          E-Mail-Adresse, Telefonnummer und Notizen sind reine Innendaten und
          erscheinen nie im öffentlichen Bereich. Ob der Name im Frontend
          genannt wird, steuert der Schalter „Öffentlich sichtbar“ — dafür
          braucht es das Einverständnis der jeweiligen Person.
        </p>
      </div>

      <ReferentenVerwaltung referenten={referenten} darfLoeschen={user.role === "ADMIN"} />
    </div>
  );
}
