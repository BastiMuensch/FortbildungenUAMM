"use client";

import { useActionState } from "react";
import Link from "next/link";
import { speichereBezirkskontakt } from "@/actions/bezirkskontakt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BezirkskontaktFormular({ bezirk }: {
  bezirk: { id: string; name: string; kuerzel: string; kontaktEmail: string | null };
}) {
  const [zustand, speichern, laeuft] = useActionState(speichereBezirkskontakt.bind(null, bezirk.id), {});
  const feldId = `kontakt-${bezirk.id}`;
  return <section className="rounded-xl border bg-card p-5">
    <h2 className="text-lg font-semibold">{bezirk.name}</h2>
    <form action={speichern} className="mt-4 space-y-4">
      <div className="space-y-2">
        <label htmlFor={feldId} className="text-sm font-medium">Öffentliche Kontaktadresse</label>
        <Input id={feldId} name="kontaktEmail" type="email" maxLength={254} defaultValue={bezirk.kontaktEmail ?? ""} aria-describedby={`${feldId}-hinweis${zustand.fehler?.kontaktEmail ? ` ${feldId}-fehler` : ""}`} aria-invalid={Boolean(zustand.fehler?.kontaktEmail)} />
        <p id={`${feldId}-hinweis`} className="text-sm text-muted-foreground">Diese dienstliche E-Mail-Adresse erscheint auf der Bezirksseite und empfängt Kontakt- und Fortbildungsanfragen. Leer lassen und speichern, um sie zu entfernen.</p>
        {zustand.fehler?.kontaktEmail ? <p id={`${feldId}-fehler`} role="alert" className="text-sm text-destructive">{zustand.fehler.kontaktEmail}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={laeuft}>{laeuft ? "Speichert …" : "Kontaktadresse speichern"}</Button>
        <Link href={`/${bezirk.kuerzel}#kontakt`} className="text-sm underline underline-offset-4">Öffentliche Bezirksseite ansehen</Link>
      </div>
      {zustand.fehler?._ || zustand.fehler?.bezirkId ? <p role="alert" className="text-sm text-destructive">{zustand.fehler._ ?? zustand.fehler.bezirkId}</p> : null}
      {zustand.meldung ? <p role="status" className="text-sm text-primary">{zustand.meldung}</p> : null}
    </form>
  </section>;
}
