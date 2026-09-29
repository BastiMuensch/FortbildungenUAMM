"use client";

import { useActionState } from "react";
import { speichereNamensfreigabe, type NamensfreigabeState } from "@/actions/namensfreigabe";
import { NamensfreigabeAuswahl } from "@/components/registrierung/NamensfreigabeAuswahl";
import { Button } from "@/components/ui/button";

export function NamensfreigabeFormular({ name, sichtbar, stand }: { name: string; sichtbar: boolean; stand: number }) {
  const [state, action, pending] = useActionState<NamensfreigabeState, FormData>(speichereNamensfreigabe, {});
  return (
    <form action={action} className="space-y-4">
      <p className="text-sm">Bei Zustimmung erscheint der Name: <strong>{name}</strong></p>
      <input type="hidden" name="namensfreigabeStand" value={state.stand ?? stand} />
      <NamensfreigabeAuswahl
        key={state.stand ?? stand}
        vorausgewaehlt={state.sichtbar ?? sichtbar}
        fehler={state.fehler?.namensfreigabe}
      />
      <p className="text-sm text-muted-foreground">Zum Widerrufen das Häkchen entfernen und speichern. Die Organisationskennzeichnungen bleiben immer sichtbar.</p>
      {state.fehler?._ ? <p role="alert" className="text-sm text-destructive">{state.fehler._}</p> : null}
      {state.erfolg ? <p role="status" className="text-sm">{state.meldung}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "Wird gespeichert …" : "Namensanzeige speichern"}</Button>
    </form>
  );
}
