"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { bereiteTagesDatensicherungVor, bestaetigeDatensicherungsAblage, type DatensicherungsState } from "@/actions/datensicherung";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TagesDatensicherungErstellen({ konfiguriert, bereit, laeuft }: { konfiguriert: boolean; bereit: boolean; laeuft: boolean }) {
  const [stand, aktion, wartet] = useActionState<DatensicherungsState, FormData>(bereiteTagesDatensicherungVor, {});
  const router = useRouter();
  useEffect(() => {
    const aktualisieren = () => { if (document.visibilityState !== "hidden") router.refresh(); };
    const intervall = window.setInterval(aktualisieren, laeuft || wartet ? 15_000 : 5 * 60 * 1000);
    document.addEventListener("visibilitychange", aktualisieren);
    return () => { window.clearInterval(intervall); document.removeEventListener("visibilitychange", aktualisieren); };
  }, [laeuft, wartet, router]);
  return <form action={aktion} className="space-y-3">
    <div className="flex flex-wrap gap-2"><Button type="submit" className="min-h-11" disabled={!konfiguriert || bereit || wartet || laeuft}>{wartet || laeuft ? "Wird erstellt …" : bereit ? "Vollbackup bereit" : "Jetzt erstellen"}</Button><Button type="button" variant="outline" className="min-h-11" onClick={() => router.refresh()} disabled={wartet}>Aktualisieren</Button></div>
    {stand.fehler ? <p role="alert" className="text-sm text-destructive">{stand.fehler}</p> : null}
    {stand.meldung ? <p role="status" className="text-sm text-muted-foreground">{stand.meldung}</p> : null}
  </form>;
}

export function DatensicherungsAblageFormular({ id }: { id: string }) {
  const [stand, aktion, wartet] = useActionState<DatensicherungsState, FormData>(bestaetigeDatensicherungsAblage, {});
  const fehlerRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (stand.erfolg) window.dispatchEvent(new Event("datensicherung-bestaetigt"));
    if (stand.fehler) fehlerRef.current?.focus();
  }, [stand]);
  return <form action={aktion} className="mt-5 grid gap-4 border-t pt-5">
    <p className="text-sm font-semibold">Ablage auf dem Netzlaufwerk bestätigen</p>
    <input type="hidden" name="id" value={id} />
    <label className="grid gap-1 text-sm font-medium">Ablage auf dem Regierungslaufwerk
      <Input name="externeAblage" required minLength={5} maxLength={500} placeholder="Netzlaufwerk und Ordner" className="min-h-11" />
    </label>
    <label className="grid gap-1 text-sm font-medium">SHA-256-Prüfsumme der gespeicherten Kopie
      <Input name="sha256" required minLength={64} maxLength={64} pattern="[a-fA-F0-9]{64}" autoComplete="off" spellCheck={false} placeholder="SHA-256 aus der Ablageprüfung" className="min-h-11 font-mono text-xs" />
    </label>
    <p className="text-xs leading-relaxed text-muted-foreground">Die Windows-Ablagehilfe gibt diese Prüfsumme nach der Kopierprüfung aus. Einen Download allein hier bitte noch nicht bestätigen.</p>
    <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg bg-muted p-3 text-sm leading-relaxed"><input type="checkbox" name="ablageBestaetigt" required className="mt-1 size-4 shrink-0" />Ich habe die verschlüsselte Datei auf dem Regierungslaufwerk abgelegt und die Prüfsumme dieser Kopie geprüft.</label>
    <div><Button type="submit" variant="outline" className="min-h-11" disabled={wartet}>{wartet ? "Wird bestätigt …" : "Ablage bestätigen"}</Button></div>
    {stand.fehler ? <p ref={fehlerRef} tabIndex={-1} role="alert" className="scroll-mt-24 rounded-md bg-destructive/10 p-3 text-sm text-destructive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive">{stand.fehler}</p> : null}
    {stand.meldung ? <p role="status" className="text-sm text-primary">{stand.meldung}</p> : null}
  </form>;
}
