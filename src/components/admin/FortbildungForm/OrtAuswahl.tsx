"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { filtereOrte } from "@/lib/formularauswahl";
import type { OrtOption } from "./types";

export function OrtAuswahl({ orte, wert, onChange, ungueltig }: {
  orte: OrtOption[];
  wert: string;
  onChange: (wert: string) => void;
  ungueltig: boolean;
}) {
  const [offen, setOffen] = useState(false);
  const [suche, setSuche] = useState("");
  const ausgewaehlt = orte.find((ort) => ort.id === wert);
  const treffer = filtereOrte(orte, suche);
  const beschriftung = (ort: OrtOption) => ort.ort && !ort.name.includes(ort.ort) ? `${ort.name}, ${ort.ort}` : ort.name;

  return (
    <>
      <input type="hidden" name="veranstaltungsortId" value={wert} />
      <Popover open={offen} onOpenChange={(naechsterWert) => { setOffen(naechsterWert); if (naechsterWert) setSuche(""); }}>
        <PopoverTrigger
          type="button"
          aria-label={`Veranstaltungsort: ${ausgewaehlt ? beschriftung(ausgewaehlt) : "Bitte wählen"}`}
          aria-invalid={ungueltig}
          className="flex min-h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-2 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive"
        >
          <span className="min-w-0 break-words">{ausgewaehlt ? beschriftung(ausgewaehlt) : "Schule oder Ort suchen …"}</span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </PopoverTrigger>
        <PopoverContent align="start" className="max-h-(--available-height) w-[min(28rem,calc(100vw-2rem))] overflow-y-auto">
          <PopoverTitle>Schule oder Veranstaltungsort wählen</PopoverTitle>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden />
            <Input aria-label="Schulen und Orte durchsuchen" placeholder="Schulname oder Ort eingeben …" value={suche} onChange={(e) => setSuche(e.target.value)} className="pl-9" />
          </div>
          <p className="text-xs text-muted-foreground" role="status">{treffer.length} Treffer</p>
          <div className="max-h-64 space-y-1 overflow-y-auto" aria-label="Veranstaltungsorte">
            {treffer.map((ort) => (
              <button key={ort.id} type="button" aria-pressed={ort.id === wert} onClick={() => { onChange(ort.id); setOffen(false); }} className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring aria-pressed:bg-accent">
                <Check className={`mt-0.5 size-4 shrink-0 ${ort.id === wert ? "opacity-100" : "opacity-0"}`} aria-hidden />
                <span className="min-w-0 break-words">{ort.name}{ort.ort && <span className="block text-xs text-muted-foreground">{ort.ort}</span>}</span>
              </button>
            ))}
            {treffer.length === 0 && <p className="px-2 py-4 text-sm text-muted-foreground">Kein passender Ort. Versuchen Sie einen kürzeren Suchbegriff.</p>}
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
