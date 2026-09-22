"use client";

import { useActionState } from "react";

import { erzeugeBdbZugangslink, speichereBdb, speichereBezirk } from "@/actions/bezirke";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Bezirk = { id: string; name: string; aktiv: boolean; pflichtSchlagworte: string[] };
type Bdb = { id: string; name: string | null; email: string; role: string; isActive: boolean; bezirke: Array<{ id: string; name: string }> };

export function BezirksVerwaltung({ bezirke, bdbs }: { bezirke: Bezirk[]; bdbs: Bdb[] }) {
  const [bezirkState, bezirkAction, bezirkPending] = useActionState(speichereBezirk.bind(null, null), {});
  const [bdbState, bdbAction, bdbPending] = useActionState(speichereBdb.bind(null, null), {});
  return <div className="grid gap-6 lg:grid-cols-2">
    <section className="border p-5">
      <h2 className="font-semibold">Schulamtsbezirk anlegen</h2>
      <form action={bezirkAction} className="mt-4 space-y-3">
        <label className="block space-y-1 text-sm" htmlFor="neuer-bezirk-name">Name des Schulamtsbezirks<Input id="neuer-bezirk-name" name="name" required placeholder="z. B. Memmingen-Unterallgäu" /></label>
        <label className="block space-y-1 text-sm" htmlFor="neuer-bezirk-schlagworte">Pflichtschlagworte<Input id="neuer-bezirk-schlagworte" name="pflichtSchlagworte" placeholder="Durch Komma getrennt" /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="aktiv" defaultChecked /> Aktiv</label>
        <Button type="submit" disabled={bezirkPending}>{bezirkPending ? "Speichert …" : "Bezirk speichern"}</Button>
      </form>
      {bezirkState.fehler?._ ? <p className="mt-3 text-sm text-destructive">{bezirkState.fehler._}</p> : null}
      {bezirkState.meldung ? <p className="mt-3 text-sm text-primary">{bezirkState.meldung}</p> : null}
      <div className="mt-5 divide-y border-t text-sm">
        {bezirke.map((bezirk) => <BezirkZeile key={bezirk.id} bezirk={bezirk} />)}
      </div>
    </section>
    <section className="border p-5">
      <h2 className="font-semibold">BdB einladen</h2>
      <p className="mt-1 text-sm text-muted-foreground">BdBs verwalten nur die hier zugeordneten Bezirke.</p>
      <form action={bdbAction} className="mt-4 space-y-3">
        <label className="block space-y-1 text-sm" htmlFor="neuer-bdb-name">Name<Input id="neuer-bdb-name" name="name" required placeholder="Vor- und Nachname" /></label>
        <label className="block space-y-1 text-sm" htmlFor="neuer-bdb-email">E-Mail-Adresse<Input id="neuer-bdb-email" name="email" required type="email" placeholder="name@schule.bayern.de" /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="aktiv" defaultChecked /> Konto aktiv</label>
        <fieldset><legend className="mb-2 text-sm font-medium">Zuständige Bezirke</legend><div className="space-y-2">
          {bezirke.filter((bezirk) => bezirk.aktiv).map((bezirk) => <label className="flex items-center gap-2 text-sm" key={bezirk.id}><input name="bezirkIds" value={bezirk.id} type="checkbox" />{bezirk.name}</label>)}
        </div></fieldset>
        <Button type="submit" disabled={bdbPending}>{bdbPending ? "Wird angelegt …" : "BdB einladen"}</Button>
      </form>
      {bdbState.fehler?._ ? <p className="mt-3 text-sm text-destructive">{bdbState.fehler._}</p> : null}
      {bdbState.fehler?.email ? <p className="mt-3 text-sm text-destructive">{bdbState.fehler.email}</p> : null}
      {bdbState.link ? <div className="mt-3 rounded border border-primary/30 bg-primary/5 p-3 text-sm"><p>{bdbState.meldung}</p><Input className="mt-2 font-mono text-xs" readOnly value={bdbState.link} /></div> : null}
      <div className="mt-6 divide-y border-t">
        {bdbs.map((bdb) => <BdbZeile key={bdb.id} bdb={bdb} bezirke={bezirke} />)}
      </div>
    </section>
  </div>;
}

function BezirkZeile({ bezirk }: { bezirk: Bezirk }) {
  const [state, action, pending] = useActionState(speichereBezirk.bind(null, bezirk.id), {});
  return <form action={action} className="space-y-2 py-3">
    <Input name="name" required defaultValue={bezirk.name} aria-label={`Name für ${bezirk.name}`} />
    <Input name="pflichtSchlagworte" defaultValue={bezirk.pflichtSchlagworte.join(", ")} aria-label={`Pflichtschlagworte für ${bezirk.name}`} />
    <div className="flex items-center gap-3"><label className="flex items-center gap-2"><input type="checkbox" name="aktiv" defaultChecked={bezirk.aktiv} /> Aktiv</label><Button type="submit" size="sm" variant="outline" disabled={pending}>{pending ? "Speichert …" : "Änderungen speichern"}</Button></div>
    {state.fehler?._ || state.fehler?.name ? <p className="text-destructive">{state.fehler._ ?? state.fehler.name}</p> : null}
  </form>;
}

function BdbZeile({ bdb, bezirke }: { bdb: Bdb; bezirke: Bezirk[] }) {
  const [state, action, pending] = useActionState(speichereBdb.bind(null, bdb.id), {});
  const [linkState, linkAction, linkPending] = useActionState(() => erzeugeBdbZugangslink(bdb.id), {});
  const zugeordnet = new Set(bdb.bezirke.map((bezirk) => bezirk.id));
  return <details className="py-3 text-sm">
    <summary className="cursor-pointer"><span className="font-medium">{bdb.name ?? bdb.email}</span> · {bdb.role === "ADMIN" ? "BdB" : "Redaktion"}{!bdb.isActive ? " · deaktiviert" : ""}<span className="text-muted-foreground"> · {bdb.bezirke.map((bezirk) => bezirk.name).join(", ") || "ohne Bezirk"}</span></summary>
    <form action={action} className="mt-3 space-y-2">
      <Input name="name" required defaultValue={bdb.name ?? ""} aria-label={`Name von ${bdb.email}`} />
      <Input name="email" required type="email" defaultValue={bdb.email} aria-label={`E-Mail von ${bdb.email}`} />
      <label className="flex items-center gap-2"><input type="checkbox" name="aktiv" defaultChecked={bdb.isActive} /> Konto aktiv</label>
      <div className="space-y-1">{bezirke.filter((bezirk) => bezirk.aktiv).map((bezirk) => <label className="flex items-center gap-2" key={bezirk.id}><input name="bezirkIds" value={bezirk.id} type="checkbox" defaultChecked={zugeordnet.has(bezirk.id)} />{bezirk.name}</label>)}</div>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>{pending ? "Speichert …" : "Zuständigkeiten speichern"}</Button>
    </form>
    <form action={linkAction} className="mt-2"><Button type="submit" size="sm" variant="outline" disabled={linkPending}>{linkPending ? "Erzeugt …" : "Neuen Zugangslink erzeugen"}</Button></form>
    {state.fehler?._ || state.fehler?.email ? <p className="mt-2 text-destructive">{state.fehler._ ?? state.fehler.email}</p> : null}
    {linkState.link ? <Input className="mt-2 font-mono text-xs" readOnly value={linkState.link} /> : null}
    {linkState.fehler?._ ? <p className="mt-2 text-destructive">{linkState.fehler._}</p> : null}
  </details>;
}
