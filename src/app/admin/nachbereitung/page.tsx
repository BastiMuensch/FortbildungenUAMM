import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { fortbildungScope, requireRole } from "@/lib/auth";
import { TeilnehmerMeldung } from "@/components/admin/TeilnehmerMeldung";
import { NACHBEREITUNG_RUECKBLICK_TAGE } from "@/constants/fortbildung";

export const metadata = { title: "Nachbereitung" };
export const dynamic = "force-dynamic";

export default async function NachbereitungSeite() {
  const user = await requireRole("ADMIN", "REFERENT");
  const istAdmin = user.role === "ADMIN";

  const jetzt = new Date();
  const grenze = new Date(
    jetzt.getTime() - NACHBEREITUNG_RUECKBLICK_TAGE * 24 * 60 * 60 * 1000,
  );

  const bereich = istAdmin
    ? {}
    : {
        AND: [fortbildungScope(user), { organisationsform: "SCHILF" }],
      };

  const vergangen = {
    AND: [
      bereich,
      { ende: { lt: jetzt, gte: grenze } },
      // Abgesagte Veranstaltungen haben keine Teilnehmer zu melden.
      { status: { not: "ABGESAGT" } },
    ],
  };

  const [offen, gemeldet] = await Promise.all([
    prisma.fortbildung.findMany({
      where: {
        AND: [
          vergangen,
          istAdmin
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
      orderBy: { beginn: "desc" },
      select: auswahl,
    }),
    prisma.fortbildung.findMany({
      where: {
        AND: [
          vergangen,
          istAdmin
            ? {
                tnTatsaechlich: { not: null },
                teilnahmebestaetigungenReferentenVersandtAm: { not: null },
                teilnahmebestaetigungenTeilnehmendeVersandtAm: { not: null },
              }
            : { tnTatsaechlich: { not: null } },
        ],
      },
      orderBy: { beginn: "desc" },
      take: 50,
      select: auswahl,
    }),
  ]);

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nachbereitung</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground text-pretty">
          Nach der Veranstaltung wird hier die tatsächliche Teilnehmerzahl
          gemeldet. Die Administration bestätigt anschließend getrennt den
          Versand der Teilnahmebestätigungen für Referent:innen und
          Teilnehmende in FIBS.
          {user.role === "REFERENT"
            ? " Sie können ausschließlich für Ihre eigenen oder zugeordneten SchiLf Teilnehmerzahlen nachtragen."
            : ""}
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold">
          Offen in der Nachbereitung{" "}
          <span className="font-normal text-muted-foreground">
            ({offen.length})
          </span>
        </h2>

        {offen.length === 0 ? (
          <div className="border border-l-4 border-l-primary bg-card py-14 text-center">
            <CheckCircle2
              className="mx-auto mb-3 size-7 text-muted-foreground/60"
              aria-hidden
            />
            <p className="font-medium">Alles erledigt.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {istAdmin
                ? "Für keine vergangene Veranstaltung fehlt eine Teilnehmerzahl oder Versandbestätigung."
                : "Für keine Ihrer vergangenen SchiLf fehlt eine Teilnehmerzahl."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {offen.map((f) => (
              <TeilnehmerMeldung key={f.id} fortbildung={f} darfBestaetigungen={istAdmin} />
            ))}
          </div>
        )}
      </section>

      {gemeldet.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold">
            Abgeschlossen{" "}
            <span className="font-normal text-muted-foreground">
              ({gemeldet.length})
            </span>
          </h2>

          <div className="space-y-3">
            {gemeldet.map((f) => (
              <TeilnehmerMeldung key={f.id} fortbildung={f} darfBestaetigungen={istAdmin} />
            ))}
          </div>
        </section>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Angezeigt werden Veranstaltungen der letzten {NACHBEREITUNG_RUECKBLICK_TAGE} Tage.
        Ältere lassen sich weiterhin über die{" "}
        <Link href="/admin" className="underline underline-offset-4">
          Fortbildungsübersicht
        </Link>{" "}
        aufrufen.
      </p>
    </div>
  );
}

const auswahl = {
  id: true,
  titel: true,
  organisationsform: true,
  format: true,
  beginn: true,
  ende: true,
  maxTn: true,
  tnTatsaechlich: true,
  tnBemerkung: true,
  tnGemeldetAm: true,
  veranstaltungsort: { select: { name: true, istOnline: true } },
  tnGemeldetVon: { select: { name: true, email: true } },
  teilnahmebestaetigungenReferentenVersandtAm: true,
  teilnahmebestaetigungenReferentenVersandtVon: { select: { name: true, email: true } },
  teilnahmebestaetigungenTeilnehmendeVersandtAm: true,
  teilnahmebestaetigungenTeilnehmendeVersandtVon: { select: { name: true, email: true } },
} as const;
