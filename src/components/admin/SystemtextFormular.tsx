"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { speichereSystemtext } from "@/actions/systemtext";
import type { FormularState } from "@/lib/validation/fortbildung";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function SystemtextFormular({
  id,
  ueberschrift,
  wert,
  vorlage,
}: {
  id: string;
  ueberschrift: string;
  wert: string;
  vorlage?: string;
}) {
  const action = speichereSystemtext.bind(null, id);
  const [state, formAction, laeuft] = useActionState<FormularState, FormData>(action, {});
  const [text, setText] = useState(
    vorlage && (!wert.trim() || /Platzhalter\s*[—–-]/i.test(wert)) ? vorlage : wert,
  );
  const [meldungenSichtbar, setMeldungenSichtbar] = useState(true);

  function aendereText(wert: string) {
    setText(wert);
    setMeldungenSichtbar(false);
  }

  return (
    <form action={formAction} onSubmit={() => setMeldungenSichtbar(true)} className="border p-5">
      <h2 className="mb-3 text-sm font-semibold">{ueberschrift}</h2>

      {vorlage ? (
        <div className="mb-4 space-y-3 rounded-lg bg-muted/50 p-4 text-sm">
          <p>
            Der Entwurf für das Fortbildungsportal Schwaben berücksichtigt den
            Betrieb durch die Regierung von Schwaben bei netcup. Ergänzen Sie
            die mit [OFFEN: …] markierten Betriebsangaben vor der Veröffentlichung.
          </p>
          <Button type="button" variant="outline" className="h-auto min-h-9 whitespace-normal" disabled={laeuft || text === vorlage} onClick={() => aendereText(vorlage)}>
            Aktuellen Entwurf ins Textfeld laden
          </Button>
        </div>
      ) : null}

      <Textarea
        name="wert"
        value={text}
        onChange={(ereignis) => aendereText(ereignis.target.value)}
        readOnly={laeuft}
        rows={16}
        className="w-full font-mono text-xs"
        aria-label={ueberschrift}
      />

      <details className="mt-4 rounded-lg border p-4">
        <summary className="cursor-pointer text-sm font-medium">Vorschau des Textes</summary>
        <div className="beschreibung mt-5 min-w-0 break-words">
          <Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown>
        </div>
      </details>

      <p className="mt-3 text-xs text-muted-foreground">
        Speichern veröffentlicht den Text sofort auf der öffentlichen Seite.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <SpeichernKnopf />
        {meldungenSichtbar && !laeuft && state.erfolg ? (
          <span role="status" className="text-sm text-primary">{state.meldung}</span>
        ) : null}
        {meldungenSichtbar && !laeuft && state.fehler?._ ? (
          <span role="alert" className="text-sm text-destructive">
            {state.fehler._}
          </span>
        ) : null}
      </div>
    </form>
  );
}

function SpeichernKnopf() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Wird gespeichert …" : "Speichern und veröffentlichen"}
    </Button>
  );
}
