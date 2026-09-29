import { ladeSchulamt } from "@/lib/schulamt";
import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth";
import { ladeSchulamtsStartseiten } from "@/lib/bezirke";
import { Seitenleiste } from "@/components/admin/Seitenleiste";
import { DatensicherungsHinweis } from "@/components/admin/DatensicherungsHinweis";

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

  const [schulamt, schulamtsStartseiten] = await Promise.all([
    ladeSchulamt(),
    ladeSchulamtsStartseiten(user),
  ]);
  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <Seitenleiste
        name={user.name ?? user.email}
        rolle={user.role}
        schulamtName={schulamt.kurzname}
        schulamtsStartseiten={schulamtsStartseiten}
      />

      <main id="hauptinhalt" className="min-w-0 flex-1 px-4 py-7 sm:px-8 sm:py-10 lg:px-10">
        <div className="mx-auto max-w-[82.5rem] scroll-mt-6">
          {user.role === "RVS" ? <DatensicherungsHinweis /> : null}
          {children}
        </div>
      </main>
    </div>
  );
}
