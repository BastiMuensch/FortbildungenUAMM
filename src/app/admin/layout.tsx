import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { fortbildungScope, getSessionUser } from "@/lib/auth";
import {
  darfFreigeben,
  NACHBEREITUNG_RUECKBLICK_TAGE,
} from "@/constants/fortbildung";
import { Seitenleiste } from "@/components/admin/Seitenleiste";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // proxy.ts hat das Cookie bereits oberflächlich geprüft. Hier wird gegen die
  // Datenbank geprüft, damit ein deaktivierter Zugang sofort greift.
  const user = await getSessionUser();
  if (!user) redirect("/login?weiter=/admin");

  const jetzt = new Date();
  const nachbereitungsGrenze = new Date(
    jetzt.getTime() - NACHBEREITUNG_RUECKBLICK_TAGE * 24 * 60 * 60 * 1000,
  );

  const [offeneMeldungen, offeneFreigaben] = await Promise.all([
    // Nachbereitung: Administration für alle Termine, Referent:innen nur für
    // eigene beziehungsweise zugeordnete SchiLf. Redaktion hat keinen Zugriff.
    user.role === "ADMIN" || user.role === "REFERENT"
      ? prisma.fortbildung.count({
          where: {
            AND: [
              fortbildungScope(user),
              ...(user.role === "REFERENT" ? [{ organisationsform: "SCHILF" }] : []),
              { ende: { lt: jetzt, gte: nachbereitungsGrenze } },
              { status: { not: "ABGESAGT" } },
              user.role === "ADMIN"
                ? {
                    OR: [
                      { tnTatsaechlich: null },
                      { teilnahmebestaetigungenReferentenVersandtAm: null },
                      { teilnahmebestaetigungenTeilnehmendeVersandtAm: null },
                    ],
                  }
                : { tnTatsaechlich: null },
            ],
          },
        })
      : Promise.resolve(0),
    // Zahl neben "Freigaben" — ausschließlich für die Administration sichtbar.
    darfFreigeben(user.role)
      ? prisma.fortbildung.count({ where: { status: "EINGEREICHT" } })
      : 0,
  ]);

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <Seitenleiste
        name={user.name ?? user.email}
        rolle={user.role}
        offeneMeldungen={offeneMeldungen}
        offeneFreigaben={offeneFreigaben}
      />

      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
