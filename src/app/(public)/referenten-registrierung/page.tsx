import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { ReferentenRegistrierungsFormular } from "@/components/registrierung/ReferentenRegistrierungsFormular";
import { pruefeReferentenRegistrierungslink } from "@/lib/referentenRegistrierung";

export const metadata: Metadata = {
  title: "Als Referent:in registrieren",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ReferentenRegistrierungSeite({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const gueltig = token ? await pruefeReferentenRegistrierungslink(token) : false;

  return (
    <div className="flex flex-1 items-center justify-center py-6">
      <div className="w-full max-w-md">
        {gueltig ? (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-xl font-semibold tracking-tight">Als Referent:in registrieren</h1>
              <p className="mt-1.5 text-sm text-muted-foreground text-pretty">
                Bitte legen Sie Ihren Zugang zum Fortbildungsportal des Schulamts an.
                Nach der Registrierung können Sie eigene Fortbildungen einreichen und
                den Planungskalender nutzen.
              </p>
            </div>
            <ReferentenRegistrierungsFormular token={token!} />
          </>
        ) : (
          <div className="text-center">
            <AlertCircle className="mx-auto mb-4 size-7 text-muted-foreground" aria-hidden />
            <h1 className="text-xl font-semibold tracking-tight">Dieser Link ist nicht mehr gültig</h1>
            <p className="mt-2 text-sm text-muted-foreground text-pretty">
              Der Registrierungslink wurde ersetzt oder ist abgelaufen. Bitte bei der
              Redaktion einen aktuellen Link anfordern.
            </p>
            <p className="mt-8">
              <Link href="/login" className="text-sm underline underline-offset-4 hover:text-foreground">
                Zur Anmeldung
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
