import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "@/components/admin/LoginForm";

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

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 border-t-2 border-primary pt-6 text-center">
          <span
            aria-hidden
            className="mx-auto mb-4 block size-4 rotate-45 bg-primary"
          />
          <h1 className="etikett text-base tracking-[0.16em]">Redaktionsbereich</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Fortbildungen des Schulamts Memmingen-Unterallgäu
          </p>
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
