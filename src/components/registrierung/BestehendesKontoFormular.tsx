"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { fuegeBezirkAusRegistrierungslinkHinzu } from "@/actions/referentenRegistrierung";
import type { FormularState } from "@/lib/validation/fortbildung";
import { Button } from "@/components/ui/button";

/** Löst einen Bezirkslink für eine bereits authentifizierte Person ein. */
export function BestehendesKontoFormular({
  token,
  bezirkName,
}: {
  token: string;
  bezirkName: string;
}) {
  const [state, formAction] = useActionState<FormularState, FormData>(
    fuegeBezirkAusRegistrierungslinkHinzu,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
        <p className="font-medium">Bezirk: {bezirkName}</p>
        <p className="mt-1 text-muted-foreground">
          Dieser Bezirk wird Ihrem bestehenden Referent:innenkonto hinzugefügt.
        </p>
      </div>

      {state.erfolg ? (
        <p role="status" className="flex items-start gap-2 text-sm text-primary">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.meldung}
        </p>
      ) : null}

      {state.fehler?._ ? (
        <p
          role="alert"
          className="flex items-start gap-2 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.fehler._}
        </p>
      ) : null}

      <AbsendenKnopf />
    </form>
  );
}

function AbsendenKnopf() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Bezirk wird hinzugefügt …" : "Bezirk meinem Konto hinzufügen"}
    </Button>
  );
}
