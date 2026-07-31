"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import type { KompetenzBereichOption } from "./types";

/**
 * DigCompEdu Bavaria: sechs Kompetenzbereiche als Akkordeon, darin die
 * Unterkompetenzen als Checkboxen.
 *
 * Ausgewählt werden können sowohl der Bereich selbst (z. B. "3") als auch
 * einzelne Unterkompetenzen ("3.2"). Der Bereich wird automatisch mitgesetzt,
 * sobald eine seiner Unterkompetenzen gewählt ist — sonst würde eine
 * Fortbildung im Frontend-Filter "Kompetenzbereich 3" nicht auftauchen,
 * obwohl sie inhaltlich dazugehört.
 */
export function DigCompAccordion({
  bereiche,
  ausgewaehlt,
  onChange,
}: {
  bereiche: KompetenzBereichOption[];
  ausgewaehlt: string[];
  onChange: (codes: string[]) => void;
}) {
  const gesetzt = new Set(ausgewaehlt);

  function umschalten(code: string, aktiv: boolean, bereichCode: string) {
    const naechste = new Set(gesetzt);

    if (aktiv) {
      naechste.add(code);
      naechste.add(bereichCode);
    } else {
      naechste.delete(code);

      // War das die letzte Unterkompetenz des Bereichs, fällt auch die
      // Bereichsmarkierung weg — es sei denn, der Bereich war direkt gewählt.
      const bereich = bereiche.find((b) => b.code === bereichCode);
      const nochWelche = bereich?.children.some((k) => naechste.has(k.code));
      if (!nochWelche && code !== bereichCode) naechste.delete(bereichCode);
    }

    onChange([...naechste].sort());
  }

  return (
    <div className="space-y-3">
      {ausgewaehlt.map((code) => (
        <input key={code} type="hidden" name="kompetenzen" value={code} />
      ))}

      <Accordion multiple defaultValue={[]} className="rounded-lg border px-4">
        {bereiche.map((bereich) => {
          const anzahl = bereich.children.filter((k) => gesetzt.has(k.code)).length;
          const bereichGesetzt = gesetzt.has(bereich.code);

          return (
            <AccordionItem key={bereich.code} value={bereich.code}>
              <AccordionTrigger>
                <span className="flex flex-1 items-center gap-2 pr-2">
                  <span className="text-muted-foreground tabular-nums">
                    KB {bereich.code}
                  </span>
                  <span>{bereich.titel}</span>
                  {anzahl > 0 || bereichGesetzt ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {anzahl > 0 ? `${anzahl} ausgewählt` : "Bereich gewählt"}
                    </span>
                  ) : null}
                </span>
              </AccordionTrigger>

              <AccordionContent keepMounted>
                <div className="space-y-3 pb-4">
                  {bereich.beschreibung ? (
                    <p className="text-sm text-muted-foreground">
                      {bereich.beschreibung}
                    </p>
                  ) : null}

                  <label className="flex items-center gap-2.5 rounded-md bg-muted/50 px-2.5 py-2">
                    <Checkbox
                      checked={bereichGesetzt}
                      onCheckedChange={(checked) =>
                        umschalten(bereich.code, checked, bereich.code)
                      }
                    />
                    <span className="text-sm font-medium">
                      Gesamter Kompetenzbereich {bereich.code}
                    </span>
                  </label>

                  <div className="grid gap-1 sm:grid-cols-2">
                    {bereich.children.map((kompetenz) => (
                      <label
                        key={kompetenz.code}
                        className="flex items-start gap-2.5 rounded-md px-2.5 py-1.5 transition-colors hover:bg-accent/50"
                      >
                        <Checkbox
                          className="mt-0.5"
                          checked={gesetzt.has(kompetenz.code)}
                          onCheckedChange={(checked) =>
                            umschalten(kompetenz.code, checked, bereich.code)
                          }
                        />
                        <span className="text-sm">
                          <span className="text-muted-foreground tabular-nums">
                            {kompetenz.code}
                          </span>{" "}
                          {kompetenz.titel}
                          {kompetenz.istPlatzhalter ? (
                            <span
                              title="Formulierung noch mit dem offiziellen Rahmen abzugleichen"
                              className="ml-1.5 text-xs text-muted-foreground"
                            >
                              (vorläufig)
                            </span>
                          ) : null}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <p className="text-xs text-muted-foreground">
        Ausgewählt: {ausgewaehlt.length === 0 ? "keine Kompetenz" : ausgewaehlt.join(", ")}
      </p>
    </div>
  );
}
