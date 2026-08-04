"use client";

import { useFormStatus } from "react-dom";
import { Globe2 } from "lucide-react";

import { fibsStatusSetzen } from "@/actions/freigabe";
import { formatDatumZeit } from "@/lib/datetime";
import { Button } from "@/components/ui/button";
import { FibsKennzeichen } from "./Kennzeichen";

/**
 * Schaltet die Markierung „in FIBS ausgeschrieben".
 *
 * Eigener Vorgang statt eines Formularfeldes: Der Eintrag in FIBS passiert
 * außerhalb dieser Anwendung, oft Tage nach dem Anlegen — und dann will
 * niemand das ganze Formular durchklicken, nur um ein Häkchen zu setzen.
 */
export function FibsSchalter({
  id,
  inFibs,
  lehrgangsnummer,
  eingetragenAm,
  eingetragenVon,
}: {
  id: string;
  inFibs: boolean;
  lehrgangsnummer?: string | null;
  eingetragenAm?: Date | null;
  eingetragenVon?: string | null;
}) {
  return (
    <div className="border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 font-medium">
            <Globe2 className="size-4 text-muted-foreground" aria-hidden />
            FIBS-Eintrag
          </p>

          <div className="mt-2">
            <FibsKennzeichen
              inFibs={inFibs}
              lehrgangsnummer={lehrgangsnummer}
              ausfuehrlich
            />
          </div>

          <p className="mt-2 max-w-md text-sm text-muted-foreground text-pretty">
            {inFibs ? (
              <>
                Als in FIBS ausgeschrieben markiert
                {eingetragenAm ? ` am ${formatDatumZeit(eingetragenAm)}` : ""}
                {eingetragenVon ? ` von ${eingetragenVon}` : ""}.
              </>
            ) : (
              <>
                Diese Fortbildung ist noch nicht in FIBS ausgeschrieben.
                Lehrkräfte können sich also noch nicht verbindlich anmelden.
              </>
            )}
          </p>
        </div>

        <form action={fibsStatusSetzen.bind(null, id, !inFibs)}>
          <Schalter inFibs={inFibs} />
        </form>
      </div>
    </div>
  );
}

function Schalter({ inFibs }: { inFibs: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={inFibs ? "outline" : "default"} disabled={pending}>
      {pending
        ? "Wird gespeichert …"
        : inFibs
          ? "Markierung zurücknehmen"
          : "In FIBS eingetragen"}
    </Button>
  );
}
