"use client";

import { useMemo, useState } from "react";
import { Lock, Plus, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { PFLICHT_SCHLAGWORTE } from "@/constants/fortbildung";

/**
 * Schlagwort-Eingabe mit Vorschlägen.
 *
 * Die Pflicht-Schlagworte des Schulamts stehen fest verankert vorn und lassen
 * sich nicht entfernen. Verlassen darf man sich darauf trotzdem nicht — die
 * Server Action hängt sie unabhängig davon noch einmal an.
 */
export function SchlagwortInput({
  werte,
  onChange,
  vorschlaege,
}: {
  werte: string[];
  onChange: (werte: string[]) => void;
  vorschlaege: string[];
}) {
  const [eingabe, setEingabe] = useState("");

  const pflicht = PFLICHT_SCHLAGWORTE as readonly string[];

  const offeneVorschlaege = useMemo(() => {
    const belegt = new Set(
      [...werte, ...pflicht].map((w) => w.toLowerCase()),
    );
    const suche = eingabe.trim().toLowerCase();

    return vorschlaege
      .filter((v) => !belegt.has(v.toLowerCase()))
      .filter((v) => (suche ? v.toLowerCase().includes(suche) : true))
      .slice(0, 8);
  }, [vorschlaege, werte, eingabe, pflicht]);

  function hinzufuegen(name: string) {
    const bereinigt = name.trim();
    if (!bereinigt) return;

    const belegt = [...werte, ...pflicht].some(
      (w) => w.toLowerCase() === bereinigt.toLowerCase(),
    );
    if (!belegt) onChange([...werte, bereinigt]);
    setEingabe("");
  }

  return (
    <div className="space-y-2">
      {/* Für jedes Schlagwort ein eigenes Feld — die Action liest sie mit getAll(). */}
      {werte.map((wert) => (
        <input key={wert} type="hidden" name="schlagworte" value={wert} />
      ))}

      <div className="flex flex-wrap gap-1.5 rounded-lg border border-input p-2">
        {pflicht.map((wert) => (
          <span
            key={wert}
            title="Pflicht-Schlagwort des Schulamts, kann nicht entfernt werden"
            className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
          >
            <Lock className="size-3" aria-hidden />
            {wert}
          </span>
        ))}

        {werte.map((wert) => (
          <span
            key={wert}
            className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium"
          >
            {wert}
            <button
              type="button"
              onClick={() => onChange(werte.filter((w) => w !== wert))}
              aria-label={`Schlagwort ${wert} entfernen`}
              className="text-muted-foreground transition-colors hover:text-destructive"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}

        <Input
          value={eingabe}
          onChange={(e) => setEingabe(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              // Enter darf hier nicht das ganze Formular absenden.
              e.preventDefault();
              hinzufuegen(eingabe);
            }
            if (e.key === "Backspace" && eingabe === "" && werte.length > 0) {
              onChange(werte.slice(0, -1));
            }
          }}
          placeholder="Schlagwort eingeben und Enter drücken"
          aria-label="Weiteres Schlagwort"
          className="h-7 min-w-52 flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
        />
      </div>

      {offeneVorschlaege.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Vorschläge:</span>
          {offeneVorschlaege.map((vorschlag) => (
            <button
              key={vorschlag}
              type="button"
              onClick={() => hinzufuegen(vorschlag)}
              className="inline-flex items-center gap-1 rounded-md border border-dashed px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-solid hover:bg-accent hover:text-foreground"
            >
              <Plus className="size-3" aria-hidden />
              {vorschlag}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
