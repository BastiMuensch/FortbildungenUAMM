import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { pruefeZugangstoken } from "@/lib/zugang";
import { PasswortFormular } from "@/components/admin/PasswortFormular";

export const metadata: Metadata = {
  title: "Zugang einrichten",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ZugangSeite({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const eintrag = token ? await pruefeZugangstoken(token) : null;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        {eintrag ? (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-xl font-semibold tracking-tight">
                {eintrag.zweck === "EINLADUNG"
                  ? "Willkommen"
                  : "Neues Passwort setzen"}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground text-pretty">
                {eintrag.zweck === "EINLADUNG" ? (
                  <>
                    Für {eintrag.name ?? eintrag.email} wurde ein Zugang zum
                    Fortbildungsportal des Schulamts eingerichtet. Bitte ein
                    Passwort vergeben.
                  </>
                ) : (
                  <>Bitte ein neues Passwort für {eintrag.email} vergeben.</>
                )}
              </p>
            </div>

            <PasswortFormular token={token!} email={eintrag.email} />
          </>
        ) : (
          <div className="text-center">
            <AlertCircle
              className="mx-auto mb-4 size-7 text-muted-foreground"
              aria-hidden
            />
            <h1 className="text-xl font-semibold tracking-tight">
              Dieser Link ist nicht mehr gültig
            </h1>
            <p className="mt-2 text-sm text-muted-foreground text-pretty">
              Einladungslinks sind einmalig verwendbar und laufen nach 14 Tagen
              ab. Bitte bei der Administration des Schulamts einen neuen Link
              anfordern.
            </p>
            <p className="mt-8">
              <Link
                href="/login"
                className="text-sm underline underline-offset-4 hover:text-foreground"
              >
                Zur Anmeldung
              </Link>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
