import { ladeSchulamt } from "@/lib/schulamt";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "@/components/admin/LoginForm";
import { Marke } from "@/components/Marke";
import { fortbildungsZusatz } from "@/lib/marke";

export const metadata: Metadata = {
  title: "Anmeldung",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  // In Next 16 sind searchParams ein Promise.
  searchParams: Promise<{ weiter?: string }>;
}) {
  if (await getSessionUser()) redirect("/admin");

  const { weiter } = await searchParams;
  const schulamt = await ladeSchulamt();

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16 sm:py-24">
      <div className="w-full max-w-sm">
        <div className="mb-6 rounded-2xl border border-border bg-card px-6 py-7 text-center shadow-sm">
          <Marke zusatz={fortbildungsZusatz(schulamt.kurzname)} className="mx-auto mb-5 w-fit text-left" />
          <h1 className="text-xl font-semibold tracking-tight">Verwaltungsbereich</h1>
          <p className="mt-2 text-sm text-muted-foreground">Anmeldung für die interne Verwaltung</p>
        </div>

        <LoginForm weiter={weiter} />

        <p className="mt-8 text-center text-sm text-muted-foreground">
          <Link href="/" className="underline underline-offset-4 hover:text-foreground">
            Zurück zur Fortbildungsübersicht
          </Link>
        </p>
      </div>
    </main>
  );
}
