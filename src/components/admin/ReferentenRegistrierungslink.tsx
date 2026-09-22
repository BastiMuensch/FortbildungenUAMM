"use client";

import { useActionState } from "react";
import { Copy, Link as LinkIcon } from "lucide-react";

import {
  generiereReferentenRegistrierungslink,
  type ReferentenRegistrierungslinkState,
} from "@/actions/referentenRegistrierung";
import { formatDatumZeit } from "@/lib/datetime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { REGISTRIERUNG_STANDARD_NUTZUNGEN } from "@/constants/registrierung";

/** Verwaltung des allgemeinen Links; der Klartext erscheint nur nach Erzeugung. */
export function ReferentenRegistrierungslink({
  bezirke,
}: {
  bezirke: Array<{ id: string; name: string }>;
}) {
  const [state, action] = useActionState<ReferentenRegistrierungslinkState, FormData>(
    generiereReferentenRegistrierungslink,
    {},
  );

  return (
    <section className="border bg-muted/20 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-medium">
            <LinkIcon className="size-4 text-primary" aria-hidden />
            Registrierungslink für einen Bezirk
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground text-pretty">
            Darüber können sich Referentinnen und Referenten für den gewählten
            Bezirk selbst anmelden. Ein neuer Link ersetzt nur den bisherigen
            Link dieses Bezirks und ist 30 Tage gültig.
          </p>
        </div>
        <form action={action} className="flex items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor="bezirkId" className="text-xs">Bezirk</Label>
            <select id="bezirkId" name="bezirkId" required className="h-9 max-w-48 border bg-background px-2 text-sm" defaultValue={bezirke.length === 1 ? bezirke[0]?.id : ""}>
              {bezirke.length !== 1 ? <option value="">Bitte wählen</option> : null}
              {bezirke.map((bezirk) => <option key={bezirk.id} value={bezirk.id}>{bezirk.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="maxNutzungen" className="text-xs">
              Registrierungen
            </Label>
            <Input
              id="maxNutzungen"
              name="maxNutzungen"
              type="number"
              min={1}
              max={100}
              defaultValue={REGISTRIERUNG_STANDARD_NUTZUNGEN}
              className="w-24"
              aria-invalid={Boolean(state.fehler?.maxNutzungen)}
            />
          </div>
          <Button type="submit" variant="outline">
            <LinkIcon className="size-3.5" aria-hidden />
            {state.link ? "Neu erzeugen" : "Link erzeugen"}
          </Button>
        </form>
      </div>

      {state.link ? (
        <div className="mt-4 space-y-2 border border-primary/30 bg-primary/5 p-3">
          <p className="text-sm font-medium">{state.meldung}</p>
          <p className="text-sm text-muted-foreground">
            Bitte jetzt kopieren und nur an vorgesehene Referent:innen weitergeben.
            Gültig bis {state.gueltigBis ? formatDatumZeit(new Date(state.gueltigBis)) : "zum Ablaufdatum"}.
          </p>
          <div className="flex gap-2">
            <Input readOnly value={state.link} className="w-full font-mono text-xs" />
            <Button
              type="button"
              variant="outline"
              onClick={() => navigator.clipboard?.writeText(state.link!)}
            >
              <Copy className="size-3.5" aria-hidden />
              Kopieren
            </Button>
          </div>
        </div>
      ) : null}

      {state.fehler?._ ? <p role="alert" className="mt-3 text-sm text-destructive">{state.fehler._}</p> : null}
      {state.fehler?.maxNutzungen ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {state.fehler.maxNutzungen}
        </p>
      ) : null}
      {state.fehler?.bezirkId ? <p role="alert" className="mt-3 text-sm text-destructive">{state.fehler.bezirkId}</p> : null}
    </section>
  );
}
