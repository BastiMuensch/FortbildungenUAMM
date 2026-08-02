"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Pencil, Undo2 } from "lucide-react";

import { freigeben, zurueckweisen } from "@/actions/freigabe";
import type { FormularState } from "@/lib/validation/fortbildung";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

/**
 * Freigeben oder zurückweisen.
 *
 * Das Zurückweisen verlangt eine Begründung — eine Fortbildung kommentarlos
 * in den Entwurfsstatus zurückzuschicken, hilft der einreichenden Person
 * nicht weiter.
 */
export function FreigabeLeiste({
  id,
  titel,
  lehrgangsnummer,
}: {
  id: string;
  titel: string;
  lehrgangsnummer?: string | null;
}) {
  const [zurueckOffen, setZurueckOffen] = useState(false);
  const action = zurueckweisen.bind(null, id);
  const [state, formAction] = useActionState<FormularState, FormData>(action, {});

  return (
    <div className="mt-5 border-t pt-4">
      {zurueckOffen ? (
        <form action={formAction} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor={`notiz-${id}`}>
              Was fehlt oder soll geändert werden?
            </Label>
            <Textarea
              id={`notiz-${id}`}
              name="notiz"
              rows={3}
              required
              autoFocus
              placeholder="z. B. Bitte die Beschreibung um die technischen Voraussetzungen ergänzen."
              className="w-full"
              aria-invalid={Boolean(state.fehler?.notiz)}
            />
            <p className="text-xs text-muted-foreground">
              Der Text erscheint bei „{titel}“ als Hinweis, sobald die
              einreichende Person die Fortbildung wieder öffnet.
            </p>
            {state.fehler?.notiz ? (
              <p role="alert" className="text-sm text-destructive">
                {state.fehler.notiz}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <ZurueckKnopf />
            <Button
              type="button"
              variant="ghost"
              onClick={() => setZurueckOffen(false)}
            >
              Abbrechen
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <form action={freigeben.bind(null, id)}>
            <FreigabeKnopf />
          </form>

          <Button
            type="button"
            variant="outline"
            onClick={() => setZurueckOffen(true)}
          >
            <Undo2 className="size-4" aria-hidden />
            Zurückweisen
          </Button>

          <Button
            nativeButton={false}
            variant="ghost"
            render={
              <a href={`/admin/fortbildungen/${id}`}>
                <Pencil className="size-4" aria-hidden />
                Erst bearbeiten
              </a>
            }
          />

          {lehrgangsnummer ? (
            <span className="ml-auto text-xs text-muted-foreground">
              FIBS-Nummer bereits vermerkt: {lehrgangsnummer}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}

function FreigabeKnopf() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Check className="size-4" aria-hidden />
      {pending ? "Wird freigegeben …" : "Freigeben und veröffentlichen"}
    </Button>
  );
}

function ZurueckKnopf() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? "Wird gesendet …" : "Zurückweisen"}
    </Button>
  );
}
