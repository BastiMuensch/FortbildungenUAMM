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
      userId: true,
      user: {
        select: { id: true, isActive: true, passwordHash: true, lastLoginAt: true },
      },
      _count: { select: { fortbildungen: true } },
    },
  });

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
          Die Administration erzeugt pro Person einen einmaligen
          Registrierungslink. Darüber setzt die Person ihr Passwort selbst.
          Anschließend kann sie eigene Fortbildungen anlegen, Teilnehmerzahlen
          melden und im Planungskalender Datum, Uhrzeit, Ort, Titel und
          Beschreibung aller Termine überblicken.
        </p>
      </div>

      <ReferentenVerwaltung
        referenten={zeilen}
        darfLoeschen={user.role === "ADMIN"}
        darfZugangVerwalten={user.role === "ADMIN"}
      />
    </div>
  );
}
