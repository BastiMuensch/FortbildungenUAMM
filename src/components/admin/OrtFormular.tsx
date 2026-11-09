"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Plus } from "lucide-react";

import { speichereOrt } from "@/actions/stammdaten";
import type { FormularState } from "@/lib/validation/fortbildung";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OrtFormular({ bezirke }: { bezirke: { id: string; name: string }[] }) {
  const [state, formAction] = useActionState<FormularState, FormData>(
    speichereOrt,
    {},
  );
  const fehler = state.fehler ?? {};

  return (
    <form action={formAction} className="border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
        <Feld
          name="name"
          label="Name"
          pflicht
          platzhalter="z. B. Grundschule Erkheim"
          fehler={fehler.name}
          className="lg:col-span-2"
        />
        <Feld name="ort" label="Ort" platzhalter="z. B. Erkheim" fehler={fehler.ort} />
        <Feld
          name="strasse"
          label="Straße"
          platzhalter="optional"
          fehler={fehler.strasse}
        />
        <div className="flex gap-3">
          <Feld
            name="schulnummer"
            label="Schulnummer"
            platzhalter="optional"
            fehler={fehler.schulnummer}
            className="flex-1"
          />
        </div>
      </div>

      <label className="mt-3 block text-sm font-medium">Schulamt
        <select name="schulamtId" defaultValue="" className="mt-2 block w-full rounded-md border bg-background p-2" aria-invalid={Boolean(fehler.schulamtId)}>
          <option value="">Allgemeiner Veranstaltungsort ohne Schulamt</option>
          {bezirke.map((bezirk) => <option key={bezirk.id} value={bezirk.id}>{bezirk.name}</option>)}
        </select>
      </label>
      {fehler.schulamtId ? <p role="alert" className="text-sm text-destructive">{fehler.schulamtId}</p> : null}
      <div className="mt-3">
        <AnlegenKnopf />
      </div>

      {state.erfolg ? (
        <p className="mt-2 text-sm text-primary">{state.meldung}</p>
      ) : null}
    </form>
  );
}

function AnlegenKnopf() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Plus className="size-4" aria-hidden />
      {pending ? "Wird angelegt …" : "Ort anlegen"}
    </Button>
  );
}

function Feld({
  name,
  label,
  platzhalter,
  fehler,
  pflicht,
  className,
}: {
  name: string;
  label: string;
  platzhalter?: string;
  fehler?: string;
  pflicht?: boolean;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label htmlFor={name}>
        {label}
        {pflicht ? <span className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      <Input
        id={name}
        name={name}
        placeholder={platzhalter}
        required={pflicht}
        className="w-full"
        aria-invalid={Boolean(fehler)}
      />
      {fehler ? (
        <p role="alert" className="text-sm text-destructive">
          {fehler}
        </p>
      ) : null}
    </div>
  );
}
