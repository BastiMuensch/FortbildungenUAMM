"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle } from "lucide-react";

import { registriereReferent } from "@/actions/referentenRegistrierung";
import type { FormularState } from "@/lib/validation/fortbildung";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ReferentenRegistrierungsFormular({
  token,
  bezirkName,
}: {
  token: string;
  bezirkName: string;
}) {
  const [state, formAction] = useActionState<FormularState, FormData>(
    registriereReferent,
    {},
  );
  const fehler = state.fehler ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
        <p className="font-medium">Bezirk: {bezirkName}</p>
        <p className="mt-1 text-muted-foreground">
          Ihr neues Referent:innenkonto wird diesem Bezirk zugeordnet.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Feld
          id="vorname"
          label="Vorname"
          autoComplete="given-name"
          fehler={fehler.vorname}
          autoFocus
        />
        <Feld
          id="nachname"
          label="Nachname"
          autoComplete="family-name"
          fehler={fehler.nachname}
        />
      </div>

      <Feld
        id="email"
        label="E-Mail-Adresse"
        type="email"
        autoComplete="email"
        fehler={fehler.email}
      />

      <div className="space-y-1.5">
        <Label htmlFor="passwort">Passwort</Label>
        <Input
          id="passwort"
          name="passwort"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          className="w-full"
          aria-invalid={Boolean(fehler.passwort)}
        />
        {fehler.passwort ? (
          <p role="alert" className="text-sm text-destructive">{fehler.passwort}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Mindestens 12 Zeichen. Eine längere Wortfolge ist sicher und gut merkbar.
          </p>
        )}
      </div>

      <Feld
        id="wiederholung"
        label="Passwort wiederholen"
        type="password"
        autoComplete="new-password"
        fehler={fehler.wiederholung}
      />

      {fehler._ ? (
        <p
          role="alert"
          className="flex items-start gap-2 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {fehler._}
        </p>
      ) : null}

      <AbsendenKnopf />
    </form>
  );
}

function Feld({
  id,
  label,
  type = "text",
  autoComplete,
  fehler,
  autoFocus = false,
}: {
  id: "vorname" | "nachname" | "email" | "wiederholung";
  label: string;
  type?: "text" | "email" | "password";
  autoComplete: string;
  fehler?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        required
        autoFocus={autoFocus}
        className="w-full"
        aria-invalid={Boolean(fehler)}
      />
      {fehler ? <p role="alert" className="text-sm text-destructive">{fehler}</p> : null}
    </div>
  );
}

function AbsendenKnopf() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Wird registriert …" : "Als Referent:in registrieren"}
    </Button>
  );
}
