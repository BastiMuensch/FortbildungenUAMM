"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { bestaetigeMfaEinrichtung, starteMfaEinrichtung, type MfaState } from "@/actions/mfa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MfaEinrichtungsFormular() {
  const [start, startAction] = useActionState<MfaState, FormData>(starteMfaEinrichtung, {});
  const [bestaetigung, bestaetigen] = useActionState<MfaState, FormData>(bestaetigeMfaEinrichtung, {});
  const fehler = bestaetigung.fehler ?? start.fehler;
  if (bestaetigung.wiederherstellungscodes) return <Codes codes={bestaetigung.wiederherstellungscodes} />;
  return <section className="space-y-4 border bg-card p-5">
    <div><h2 className="font-semibold tracking-tight">Zwei-Faktor-Authentifizierung einrichten</h2><p className="mt-1 text-sm text-muted-foreground">Für dieses Konto ist eine Authenticator-App erforderlich. Bis zur Bestätigung bleibt der übrige Redaktionsbereich gesperrt.</p></div>
    {!start.geheimnis ? <form action={startAction}><Senden label="Einrichtung starten" /></form> : <>
      <div className="space-y-1"><Label htmlFor="totp-geheimnis">Einrichtungsschlüssel</Label><Input id="totp-geheimnis" readOnly value={start.geheimnis} className="font-mono" /><p className="text-xs text-muted-foreground">In Ihrer Authenticator-App als zeitbasiertes Konto hinzufügen. Bewahren Sie den Schlüssel vertraulich auf.</p></div>
      <form action={bestaetigen} className="space-y-3"><div className="space-y-1"><Label htmlFor="code">Sechsstelliger Code</Label><Input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" required /></div><Senden label="Einrichtung bestätigen" /></form>
    </>}
    {fehler ? <p role="alert" className="text-sm text-destructive">{fehler}</p> : null}
    {start.geheimnis ? <form action={startAction}><Senden label="Einrichtung mit neuem Schlüssel starten" /></form> : null}
  </section>;
}
function Codes({ codes }: { codes: string[] }) { return <section className="space-y-3 border bg-card p-5"><h2 className="font-semibold tracking-tight">Wiederherstellungscodes</h2><p className="text-sm text-muted-foreground">Jeder Code funktioniert einmal. Speichern Sie sie außerhalb dieses Browsers; sie werden danach nicht erneut angezeigt.</p><ul className="grid grid-cols-2 gap-2 font-mono text-sm">{codes.map((code) => <li key={code}>{code}</li>)}</ul><Button nativeButton={false} render={<Link href="/admin">Codes gesichert · weiter</Link>} /></section>; }
function Senden({ label }: { label: string }) { const { pending } = useFormStatus(); return <Button type="submit" disabled={pending}>{pending ? "Wird geprüft …" : label}</Button>; }
