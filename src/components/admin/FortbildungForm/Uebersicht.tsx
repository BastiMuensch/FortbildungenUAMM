"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { niveaustufeLabel } from "@/constants/fortbildung";
import { istLeer, sanitizeBeschreibung } from "@/lib/sanitize";
import type { KompetenzBereichOption } from "./types";

export function BeschreibungUebersicht({
  beschreibung,
  onBearbeiten,
}: {
  beschreibung: string;
  onBearbeiten: () => void;
}) {
  const html = useMemo(() => sanitizeBeschreibung(beschreibung), [beschreibung]);

  return (
    <section className="space-y-4 rounded-lg border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Lehrgangsbeschreibung</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Beschreibung bearbeiten"
          onClick={onBearbeiten}
        >
          Bearbeiten
        </Button>
      </div>
      {istLeer(html) ? (
        <p className="text-sm text-muted-foreground">Noch keine Beschreibung hinterlegt.</p>
      ) : (
        <div
          className="beschreibung break-words text-sm"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </section>
  );
}

export function DigCompUebersicht({
  niveaustufe,
  ausgewaehlt,
  bereiche,
  fehler,
  onBearbeiten,
}: {
  niveaustufe: string;
  ausgewaehlt: string[];
  bereiche: KompetenzBereichOption[];
  fehler?: Record<string, string>;
  onBearbeiten: () => void;
}) {
  const kompetenzen = bereiche.flatMap((bereich) => [bereich, ...bereich.children]);
  const meldungen = Object.entries(fehler ?? {}).filter(
    ([feld]) => feld === "niveaustufe" || feld.split(".")[0] === "kompetenzen",
  );

  return (
    <section className="space-y-4 rounded-lg border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">DigCompEdu Bavaria</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="DigCompEdu-Kompetenzen bearbeiten"
          onClick={onBearbeiten}
        >
          Bearbeiten
        </Button>
      </div>
      <p className="text-sm">
        <span className="font-medium">Niveaustufe: </span>
        {niveaustufe ? niveaustufeLabel(niveaustufe) : "Noch nicht ausgewählt"}
      </p>
      {ausgewaehlt.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Kompetenzen ausgewählt.</p>
      ) : (
        <ul aria-label="Ausgewählte DigCompEdu-Kompetenzen" className="space-y-2">
          {[...ausgewaehlt].sort((a, b) => a.localeCompare(b, "de", { numeric: true })).map((code) => {
            const kompetenz = kompetenzen.find((eintrag) => eintrag.code === code);
            const gesamterBereich = bereiche.some((bereich) => bereich.code === code);

            return (
              <li key={code} className="flex items-start gap-3 text-sm">
                <span className="zahl shrink-0 rounded bg-muted px-2 py-1 font-medium">
                  {gesamterBereich ? `KB ${code}` : code}
                </span>
                <span className="pt-1">
                  {kompetenz?.titel ?? "Bezeichnung nicht verfügbar"}
                  {gesamterBereich ? (
                    <span className="block text-xs text-muted-foreground">Gesamter Kompetenzbereich</span>
                  ) : null}
                  {kompetenz && "istPlatzhalter" in kompetenz && kompetenz.istPlatzhalter ? (
                    <span className="ml-1 text-xs text-muted-foreground">(vorläufig)</span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {meldungen.map(([feld, meldung]) => (
        <p key={feld} role="alert" className="text-sm text-destructive">{meldung}</p>
      ))}
    </section>
  );
}
