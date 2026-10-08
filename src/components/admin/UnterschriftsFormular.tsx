"use client";

import { useActionState, useId, useState } from "react";
import { entferneUnterschrift, speichereUnterschrift } from "@/actions/unterschriften";
import { MAX_UNTERSCHRIFT_BYTES, UNTERSCHRIFT_DATEITYPEN } from "@/lib/unterschrift";
import type { FormularState } from "@/lib/validation/fortbildung";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function UnterschriftsFormular({ userId, name, bezirke, aktiv, bild, aktualisiertAm }: {
  userId: string; name: string; bezirke: string; aktiv: boolean; bild: string | null; aktualisiertAm: string | null;
}) {
  const id = useId();
  const [speicherstand, speichern, speichert] = useActionState(speichereUnterschrift.bind(null, userId), {} as FormularState);
  const [loeschstand, entfernen, entfernt] = useActionState(entferneUnterschrift.bind(null, userId), {} as FormularState);
  const [dateifehler, setDateifehler] = useState("");
  const [letzteAktion, setLetzteAktion] = useState<"speichern" | "entfernen">("speichern");
  const stand = letzteAktion === "speichern" ? speicherstand : loeschstand;
  const beschaeftigt = speichert || entfernt;

  return (
    <section className="space-y-4 rounded-xl border bg-card p-5" aria-labelledby={`${id}-titel`} aria-busy={beschaeftigt}>
      <div>
        <h2 id={`${id}-titel`} className="font-semibold">{name}{!aktiv ? " (deaktiviert)" : ""}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{bezirke || "Kein Schulamtsbezirk zugeordnet"}</p>
      </div>
      {bild ? (
        <div>
          <div className="flex min-h-24 items-center rounded-lg border bg-white p-4">
            {/* Geschützte Bilddaten aus der Server-Seite, keine öffentliche Bildadresse. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bild} alt={`Hinterlegte Unterschrift von ${name}`} className="max-h-24 max-w-full object-contain" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Zuletzt gespeichert: {aktualisiertAm}</p>
        </div>
      ) : <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Noch keine Unterschrift hinterlegt.</p>}
      {aktiv ? (
        <form action={speichern} onSubmit={() => setLetzteAktion("speichern")} className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor={`${id}-datei`} className="text-sm font-medium">{bild ? "Unterschrift ersetzen" : "Unterschrift hochladen"}</label>
            <Input id={`${id}-datei`} name="unterschrift" type="file" accept={UNTERSCHRIFT_DATEITYPEN} required
              disabled={beschaeftigt} aria-describedby={`${id}-dateihinweis`} onChange={(ereignis) => {
                const datei = ereignis.currentTarget.files?.[0];
                const fehler = datei && datei.size > MAX_UNTERSCHRIFT_BYTES ? "Die Datei darf höchstens 750 KB groß sein." : "";
                ereignis.currentTarget.setCustomValidity(fehler);
                setDateifehler(fehler);
              }} />
            <p id={`${id}-dateihinweis`} className="text-xs text-muted-foreground">PNG oder JPEG, höchstens 750 KB und 12 Megapixel.</p>
            {dateifehler ? <p role="alert" className="text-sm text-destructive">{dateifehler}</p> : null}
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="freigabe" required disabled={beschaeftigt} className="mt-1 size-4 shrink-0 accent-primary" />
            Ich bin berechtigt, diese Unterschrift zu hinterlegen, und gebe sie für die oben beschriebenen Teilnahmebescheinigungen frei.
          </label>
          <Button type="submit" disabled={beschaeftigt || !!dateifehler}>{speichert ? "Wird gespeichert …" : "Unterschrift speichern"}</Button>
        </form>
      ) : <p className="text-sm text-muted-foreground">Unterschriften deaktivierter BdBs werden nicht in Bescheinigungen verwendet.</p>}
      {bild ? (
        <form action={entfernen} onSubmit={() => setLetzteAktion("entfernen")}>
          <Button type="submit" variant="outline" disabled={beschaeftigt}>{entfernt ? "Wird entfernt …" : "Unterschrift entfernen"}</Button>
          <p className="mt-2 text-xs text-muted-foreground">Änderungen gelten für neue Downloads. Bereits heruntergeladene PDFs bleiben unverändert.</p>
        </form>
      ) : null}
      {stand.fehler?._ ? <p role="alert" className="text-sm text-destructive">{stand.fehler._}</p> : null}
      {stand.erfolg ? <p role="status" className="text-sm text-primary">{stand.meldung}</p> : null}
    </section>
  );
}
