"use client";

import { useId, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import {
  berlinIsoDatum, formatDatum, formatDatumLang, formatDatumZeitEingabe,
  formatMonatJahr, formatZeit, kalenderMonat, kalenderTage,
  parseDatumZeitEingabe, parseDeDateTime, WOCHENTAGE_KURZ,
} from "@/lib/datetime";
import { cn } from "@/lib/utils";

/** Freie deutsche Texteingabe plus sofort nutzbarer Kalender, auch bei leerem Feld. */
export function DatumZeitAuswahl({ name, label, wert, onChange, ungueltig }: {
  name: string;
  label: string;
  wert: string;
  onChange: (wert: string) => void;
  ungueltig: boolean;
}) {
  const id = useId();
  const [offen, setOffen] = useState(false);
  const [tag, setTag] = useState<Date | null>(null);
  const [monat, setMonat] = useState<Date | null>(null);
  const [zeit, setZeit] = useState("14:00");
  const eingabe = tag ? `${formatDatum(tag)} ${zeit}` : "";
  const geprueft = parseDatumZeitEingabe(eingabe);
  // Nicht existierende Uhrzeiten während der Zeitumstellung nicht verschieben.
  const gueltig = geprueft !== null && formatDatumZeitEingabe(geprueft) === eingabe;
  const [stunde, minute] = zeit.split(":");

  function oeffnen(naechsterWert: boolean) {
    if (naechsterWert) {
      const vorhanden = parseDatumZeitEingabe(wert);
      const datum = vorhanden ?? parseDeDateTime(wert) ?? new Date();
      setTag(datum);
      setMonat(kalenderMonat(datum));
      setZeit(vorhanden ? formatZeit(vorhanden) : "14:00");
    }
    setOffen(naechsterWert);
  }

  return (
    <div className="flex min-w-0 gap-2">
      <Input name={name} aria-label={label} type="text" placeholder="TT.MM.JJJJ HH:MM" lang="de-DE" required value={wert} onChange={(e) => onChange(e.target.value)} className="min-w-0 flex-1" aria-invalid={ungueltig} />
      <Popover open={offen} onOpenChange={oeffnen}>
        <PopoverTrigger type="button" aria-label={`${label}: Datum und Uhrzeit auswählen`} title="Kalender öffnen" className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-input bg-background text-primary hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring">
          <CalendarDays className="size-5" aria-hidden />
        </PopoverTrigger>
        <PopoverContent align="end" className="max-h-(--available-height) w-[min(21rem,calc(100vw-2rem))] overflow-y-auto p-4">
          <PopoverTitle>{label} auswählen</PopoverTitle>
          {monat && tag && <>
            <div className="flex items-center justify-between gap-2">
              <button type="button" aria-label="Vorheriger Monat" className="rounded-md p-2 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring" onClick={() => setMonat(kalenderMonat(monat, -1))}><ChevronLeft className="size-4" aria-hidden /></button>
              <span className="font-medium" aria-live="polite">{formatMonatJahr(monat)}</span>
              <button type="button" aria-label="Nächster Monat" className="rounded-md p-2 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring" onClick={() => setMonat(kalenderMonat(monat, 1))}><ChevronRight className="size-4" aria-hidden /></button>
            </div>
            <div className="grid grid-cols-7 gap-1" role="group" aria-label="Kalendertag wählen">
              {WOCHENTAGE_KURZ.map((tag) => <span key={tag} className="py-1 text-center text-xs text-muted-foreground">{tag}</span>)}
              {kalenderTage(monat).map((datum) => {
                const iso = berlinIsoDatum(datum);
                return <button key={iso} type="button" aria-label={formatDatumLang(datum)} aria-pressed={iso === berlinIsoDatum(tag)} onClick={() => setTag(datum)} className={cn("aspect-square rounded-md text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring aria-pressed:bg-primary aria-pressed:text-primary-foreground", iso.slice(0, 7) !== berlinIsoDatum(monat).slice(0, 7) && "text-muted-foreground")}>
                  {Number(iso.slice(-2))}
                </button>;
              })}
            </div>
            <p className="text-sm text-muted-foreground" role="status">{formatDatumLang(tag)}</p>
            <div className="flex items-center gap-2 border-t pt-3">
              <label htmlFor={`${id}-stunde`} className="mr-auto text-sm">Uhrzeit</label>
              <select id={`${id}-stunde`} aria-label={`${label}: Stunde`} value={stunde} onChange={(e) => setZeit(`${e.target.value}:${minute}`)} className="rounded-md border bg-background px-2 py-2">
                {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map((wert) => <option key={wert}>{wert}</option>)}
              </select>
              <span aria-hidden>:</span>
              <select aria-label={`${label}: Minute`} value={minute} onChange={(e) => setZeit(`${stunde}:${e.target.value}`)} className="rounded-md border bg-background px-2 py-2">
                {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((wert) => <option key={wert}>{wert}</option>)}
              </select>
              <span className="text-xs text-muted-foreground">Uhr</span>
            </div>
            <p className="text-xs text-muted-foreground">Ortszeit Deutschland (Europe/Berlin)</p>
            {!gueltig && <p role="alert" className="text-xs text-destructive">Diese Uhrzeit existiert wegen der Zeitumstellung nicht. Bitte wählen Sie eine andere.</p>}
            <button type="button" disabled={!gueltig} onClick={() => { onChange(eingabe); setOffen(false); }} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50">Übernehmen</button>
          </>}
        </PopoverContent>
      </Popover>
    </div>
  );
}
