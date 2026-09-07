import { CheckCircle2, Clock3, ExternalLink, School } from "lucide-react";

import { bestimmeFibsAnmeldestatus } from "@/lib/fibs/status";

/**
 * Der Veröffentlichungsstatus und die Möglichkeit zur Anmeldung sind zwei
 * verschiedene Dinge. Das wird im öffentlichen Bereich bewusst sichtbar:
 * Lehrkräfte sollen nicht erst nach einem Klick auf FIBS erfahren, ob sie
 * sich schon verbindlich anmelden können.
 */
export function Anmeldestatus({
  fibsUrl,
  inFibs,
  organisationsform,
  kompakt = false,
}: {
  fibsUrl: string | null;
  inFibs: boolean;
  organisationsform: string;
  kompakt?: boolean;
}) {
  const status = bestimmeFibsAnmeldestatus({
    organisationsform,
    inFibs,
    fibsUrl,
  });

  if (status === "FIBS_OFFEN") {
    return (
      <span
        className={
          kompakt
            ? "anmeldestatus anmeldestatus-offen"
            : "anmeldestatus anmeldestatus-offen flex items-start gap-3 p-4"
        }
      >
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          <span className="font-semibold">Anmeldung geöffnet</span>
          {!kompakt ? (
            <span className="mt-0.5 block text-sm opacity-85">
              Die verbindliche Anmeldung ist in FIBS möglich.
            </span>
          ) : null}
        </span>
        {kompakt ? <ExternalLink className="size-3.5" aria-hidden /> : null}
      </span>
    );
  }

  if (status === "SCHILF_INTERN") {
    return (
      <span
        className={
          kompakt
            ? "anmeldestatus anmeldestatus-hinweis"
            : "anmeldestatus anmeldestatus-hinweis flex items-start gap-3 p-4"
        }
      >
        <School className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          <span className="font-semibold">Schulinterne Teilnahme</span>
          {!kompakt ? (
            <span className="mt-0.5 block text-sm opacity-85">
              Die Teilnahme wird schulintern organisiert; eine öffentliche
              Anmeldung über FIBS ist nicht vorgesehen.
            </span>
          ) : null}
        </span>
      </span>
    );
  }

  if (status === "FIBS_OHNE_LINK") {
    return (
      <span
        className={
          kompakt
            ? "anmeldestatus anmeldestatus-hinweis"
            : "anmeldestatus anmeldestatus-hinweis flex items-start gap-3 p-4"
        }
      >
        <Clock3 className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          <span className="font-semibold">In FIBS ausgeschrieben</span>
          {!kompakt ? (
            <span className="mt-0.5 block text-sm opacity-85">
              Der direkte Anmeldelink wird noch ergänzt.
            </span>
          ) : null}
        </span>
      </span>
    );
  }

  return (
    <span
      className={
        kompakt
          ? "anmeldestatus anmeldestatus-folgt"
          : "anmeldestatus anmeldestatus-folgt flex items-start gap-3 p-4"
      }
    >
      <Clock3 className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>
        <span className="font-semibold">Anmeldung folgt</span>
        {!kompakt ? (
          <span className="mt-0.5 block text-sm opacity-85">
            Diese Fortbildung wird vorbereitet; eine verbindliche Anmeldung ist
            noch nicht möglich.
          </span>
        ) : null}
      </span>
    </span>
  );
}
