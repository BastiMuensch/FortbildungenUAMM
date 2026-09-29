"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { bestaetigeMfaAnmeldung, type MfaState } from "@/actions/mfa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export function MfaAnmeldeFormular() { const [state, action] = useActionState<MfaState, FormData>(bestaetigeMfaAnmeldung, {}); return <form action={action} className="space-y-4"><div className="space-y-1.5"><Label htmlFor="code">Code aus der Authenticator-App</Label><Input id="code" name="code" autoFocus autoComplete="one-time-code" inputMode="numeric" required /></div><p className="text-xs text-muted-foreground">Alternativ einen Wiederherstellungscode eingeben.</p>{state.fehler ? <p role="alert" className="text-sm text-destructive">{state.fehler}</p> : null}<Senden /></form>; }
function Senden() { const { pending } = useFormStatus(); return <Button type="submit" disabled={pending} className="w-full">{pending ? "Wird geprüft …" : "Bestätigen"}</Button>; }
