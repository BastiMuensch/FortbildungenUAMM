"use client";

import { useActionState, useState } from "react";
import { Clock } from "lucide-react";
import { korrigiereDauer } from "@/actions/dauer";
import { formatDatumZeitEingabe, formatZeitraum } from "@/lib/datetime";
import type { FormularState } from "@/lib/validation/fortbildung";
import { DatumZeitAuswahl } from "@/components/admin/FortbildungForm/DatumZeitAuswahl";
import { Button } from "@/components/ui/button";

export function DauerKorrektur({ id, beginn, ende }: { id: string; beginn: Date; ende: Date }) {
  const [offen, setOffen] = useState(false);

  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Clock className="size-4 text-muted-foreground" aria-hidden />
            Tatsächliche Dauer
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{formatZeitraum(beginn, ende)}</p>
        </div>
        <Button type="button" variant="outline" size="sm" aria-expanded={offen} onClick={() => setOffen(!offen)}>
          {offen ? "Schließen" : "Dauer korrigieren"}
        </Button>
      </div>
      {offen ? <DauerFormular id={id} ende={ende} /> : null}
    </section>
  );
}

function DauerFormular({ id, ende }: { id: string; ende: Date }) {
  const [wert, setWert] = useState(formatDatumZeitEingabe(ende));
  const [state, formAction, ausstehend] = useActionState<FormularState, FormData>(korrigiereDauer.bind(null, id), {});

  return (
    <form action={formAction} className="mt-4 space-y-3 border-t pt-4">
      <p className="text-sm text-muted-foreground">
        Hat die Fortbildung länger oder kürzer gedauert? Tragen Sie die tatsächliche
        Endzeit ein. Sie ersetzt die bisherige Endzeit und wird für Auswertungen
        und Exporte verwendet. Ein Eintrag in FIBS wird dadurch nicht geändert.
      </p>
      <input type="hidden" name="bisherigesEnde" value={ende.toISOString()} />
      <fieldset disabled={ausstehend} className="space-y-2">
        <legend className="mb-2 text-sm font-medium">Tatsächliches Ende</legend>
        <DatumZeitAuswahl name="ende" label="Tatsächliches Ende" wert={wert} onChange={setWert} ungueltig={Boolean(state.fehler?.ende)} />
        <p className="text-xs text-muted-foreground">Datum und Uhrzeit in Deutschland, z. B. 30.09.2026 17:30.</p>
      </fieldset>
      {Object.entries(state.fehler ?? {}).map(([feld, meldung]) => (
        <p key={feld} role="alert" className="text-sm text-destructive">{meldung}</p>
      ))}
      {state.erfolg ? <p role="status" className="text-sm text-primary">{state.meldung}</p> : null}
      <Button type="submit" size="sm" disabled={ausstehend}>
        {ausstehend ? "Wird gespeichert …" : "Endzeit speichern"}
      </Button>
    </form>
  );
}
