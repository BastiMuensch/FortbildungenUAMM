import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { ERFASSER, fortbildungScope, requireRole } from "@/lib/auth";
import { TeilnehmerMeldung } from "@/components/admin/TeilnehmerMeldung";

export const metadata = { title: "Nachbereitung" };
export const dynamic = "force-dynamic";

/** Termine dieses Alters sind erledigt und verschwinden aus der offenen Liste. */
const RUECKBLICK_TAGE = 400;

export default async function NachbereitungSeite() {
  const user = await requireRole(...ERFASSER);

  const jetzt = new Date();
  const grenze = new Date(jetzt.getTime() - RUECKBLICK_TAGE * 24 * 60 * 60 * 1000);

  const vergangen = {
    AND: [
      fortbildungScope(user),
      { ende: { lt: jetzt, gte: grenze } },
      // Abgesagte Veranstaltungen haben keine Teilnehmer zu melden.
      { status: { not: "ABGESAGT" } },
    ],
  };

  const [offen, gemeldet] = await Promise.all([
    prisma.fortbildung.findMany({
      where: { AND: [vergangen, { tnTatsaechlich: null }] },
      orderBy: { beginn: "desc" },
      select: auswahl,
    }),
    prisma.fortbildung.findMany({
      where: { AND: [vergangen, { tnTatsaechlich: { not: null } }] },
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
          gemeldet. Sie fließt in den Excel- und PDF-Export ein und ist die
          Grundlage für die Berichterstattung des Schulamts.
          {user.role === "REFERENT"
            ? " Sie sehen ausschließlich Ihre eigenen Veranstaltungen."
            : ""}
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold">
          Offen{" "}
          <span className="font-normal text-muted-foreground">
            ({offen.length})
          </span>
        </h2>

        {offen.length === 0 ? (
          <div className="rounded-xl border border-dashed py-14 text-center">
            <CheckCircle2
              className="mx-auto mb-3 size-7 text-muted-foreground/60"
              aria-hidden
            />
            <p className="font-medium">Alles gemeldet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Für keine vergangene Veranstaltung fehlt eine Teilnehmerzahl.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {offen.map((f) => (
              <TeilnehmerMeldung key={f.id} fortbildung={f} />
            ))}
          </div>
        )}
      </section>

      {gemeldet.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold">
            Bereits gemeldet{" "}
            <span className="font-normal text-muted-foreground">
              ({gemeldet.length})
            </span>
          </h2>

          <div className="space-y-3">
            {gemeldet.map((f) => (
              <TeilnehmerMeldung key={f.id} fortbildung={f} />
            ))}
          </div>
        </section>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Angezeigt werden Veranstaltungen der letzten {RUECKBLICK_TAGE} Tage.
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
} as const;
