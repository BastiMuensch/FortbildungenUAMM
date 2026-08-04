"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle } from "lucide-react";

import { login, type LoginState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ weiter }: { weiter?: string }) {
  const [state, formAction] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={formAction} className="space-y-4">
      {weiter ? <input type="hidden" name="weiter" value={weiter} /> : null}

      <div className="space-y-1.5">
        <Label htmlFor="email">E-Mail-Adresse</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          autoFocus
          className="w-full"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="passwort">Passwort</Label>
        <Input
          id="passwort"
          name="passwort"
          type="password"
          autoComplete="current-password"
          required
          className="w-full"
        />
      </div>

      {state.fehler ? (
        <p
          role="alert"
          className="flex items-start gap-2 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.fehler}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Wird geprüft …" : "Anmelden"}
    </Button>
  );
}
