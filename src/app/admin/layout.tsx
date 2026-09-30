import { ladeSchulamt } from "@/lib/schulamt";
import { redirect } from "next/navigation";

import { bezirkScope, fortbildungScope, getSessionUser } from "@/lib/auth";
import { ladeSchulamtsStartseiten } from "@/lib/bezirke";
import { Seitenleiste } from "@/components/admin/Seitenleiste";
import { DatensicherungsHinweis } from "@/components/admin/DatensicherungsHinweis";
import { AdminKontext } from "@/components/admin/AdminKontext";
import { prisma } from "@/lib/prisma";
import { aktuellesSchuljahr } from "@/lib/datetime";
import { parseSchuljahr, schuljahrBezeichnung } from "@/lib/schuljahr";

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
  const user = await getSessionUser({ mfaEinrichtungErlauben: true });
  if (!user) redirect("/login?weiter=/admin");

  if (user.mfaEinrichtungErforderlich) return <main id="hauptinhalt" className="mx-auto w-full max-w-2xl p-8">{children}</main>;

  const [schulamt, schulamtsStartseiten, bezirke, jahrgaenge] = await Promise.all([
    ladeSchulamt(),
    ladeSchulamtsStartseiten(user),
    prisma.bezirk.findMany({ where: bezirkScope(user), select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.fortbildung.findMany({ where: fortbildungScope(user), distinct: ["schuljahr"], select: { schuljahr: true }, orderBy: { schuljahr: "desc" } }),
  ]);
  const aktuell = aktuellesSchuljahr();
  const aktuellesJahr = parseSchuljahr(aktuell)!;
  const schuljahre = [...new Set([
    aktuell, schuljahrBezeichnung(aktuellesJahr - 1), schuljahrBezeichnung(aktuellesJahr + 1),
    ...jahrgaenge.map(({ schuljahr }) => schuljahrBezeichnung(schuljahr)),
  ])].sort().reverse();
  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <Seitenleiste
        name={user.name ?? user.email}
        rolle={user.role}
        schulamtName={schulamt.kurzname}
        schulamtsStartseiten={schulamtsStartseiten}
      />

      <div className="min-w-0 flex-1">
        <AdminKontext bezirke={bezirke} schuljahre={schuljahre} aktuell={aktuell} rolle={user.role} />
        <main id="hauptinhalt" className="min-w-0 px-4 py-6 sm:px-8 sm:py-8 lg:px-10">
          <div className="mx-auto max-w-[82.5rem] scroll-mt-6">
            {user.role === "RVS" ? <DatensicherungsHinweis /> : null}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
