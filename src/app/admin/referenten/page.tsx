import { prisma } from "@/lib/prisma";
import { bezirkScope, fortbildungScope, referentScope, requireRole } from "@/lib/auth";
import { ladeBezirke } from "@/lib/bezirke";
import { ReferentenVerwaltung } from "@/components/admin/ReferentenVerwaltung";
import { ReferentenRegistrierungslink } from "@/components/admin/ReferentenRegistrierungslink";

export const metadata = { title: "Referenten" };

export default async function ReferentenPage() {
  const user = await requireRole("RVS", "ADMIN", "REDAKTEUR");

  const [referenten, bezirke] = await Promise.all([prisma.referent.findMany({
    where: referentScope(user),
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
      userId: true,
      bezirke: { where: bezirkScope(user), select: { id: true, name: true }, orderBy: { name: "asc" } },
      user: {
        select: { id: true, isActive: true, passwordHash: true, lastLoginAt: true, role: true },
      },
      _count: { select: { fortbildungen: { where: { fortbildung: fortbildungScope(user) } } } },
    },
  }), ladeBezirke(user)]);

  // Der Passwort-Hash darf den Server nicht verlassen — für die Anzeige
  // genügt die Information, ob überhaupt schon eines gesetzt wurde.
  const zeilen = referenten.map(({ user, ...rest }) => ({
    ...rest,
    zugang: user
      ? {
          userId: user.id,
          aktiv: user.isActive,
          passwortGesetzt: user.passwordHash !== null,
          lastLoginAt: user.lastLoginAt,
          rolle: user.role,
        }
      : null,
  }));

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
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Für bereits eingetragene Personen kann die Administration einen
          einmaligen Zugangslink erzeugen. Neue Personen registrieren sich über
          den allgemeinen, zeitlich begrenzten Link unten selbst. Anschließend
          können sie eigene Fortbildungen anlegen, Teilnehmerzahlen für eigene
          SchiLf nachtragen und alle Termine im Planungskalender überblicken.
        </p>
      </div>

      <ReferentenRegistrierungslink bezirke={bezirke} />
      <ReferentenVerwaltung
        referenten={zeilen}
        bezirke={bezirke}
        darfLoeschen={user.role === "RVS" || user.role === "ADMIN"}
        darfZugangVerwalten={user.role === "RVS"}
        darfZuAdministrationHochstufen={user.role === "RVS"}
      />
    </div>
  );
}
