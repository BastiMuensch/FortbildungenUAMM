import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { BestehendesKontoFormular } from "@/components/registrierung/BestehendesKontoFormular";
import { ReferentenRegistrierungsFormular } from "@/components/registrierung/ReferentenRegistrierungsFormular";
import { getSessionUser } from "@/lib/auth";
import { ladeReferentenRegistrierungslink } from "@/lib/referentenRegistrierung";

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
  const registrierungslink = token
    ? await ladeReferentenRegistrierungslink(token)
    : null;
  const angemeldetePerson = await getSessionUser();
  const weiter = token
    ? `/referenten-registrierung?token=${encodeURIComponent(token)}`
    : "/referenten-registrierung";

  return (
    <div className="flex flex-1 items-center justify-center py-6">
      <div className="w-full max-w-md">
        {registrierungslink ? (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-xl font-semibold tracking-tight">Als Referent:in registrieren</h1>
              <p className="mt-1.5 text-sm text-muted-foreground text-pretty">
                {angemeldetePerson
                  ? "Lösen Sie den Einladungslink für Ihr bestehendes Konto ein."
                  : "Bitte legen Sie Ihren Zugang zum Fortbildungsportal des Schulamts an. Nach der Registrierung können Sie eigene Fortbildungen einreichen und den Planungskalender nutzen."}
              </p>
            </div>
            {angemeldetePerson ? (
              <BestehendesKontoFormular
                token={token!}
                bezirkName={registrierungslink.bezirkName}
              />
            ) : (
              <>
                <ReferentenRegistrierungsFormular
                  token={token!}
                  bezirkName={registrierungslink.bezirkName}
                />
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  Sie haben bereits ein Konto?{" "}
                  <Link
                    href={`/login?weiter=${encodeURIComponent(weiter)}`}
                    className="underline underline-offset-4 hover:text-foreground"
                  >
                    Anmelden und Bezirk hinzufügen
                  </Link>
                </p>
              </>
            )}
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
