import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth";
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

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <Seitenleiste
        name={user.name ?? user.email}
        rolle={user.role}
      />

      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
