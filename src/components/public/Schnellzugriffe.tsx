"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { X } from "lucide-react";

import {
  baueUrl,
  ohneFilter,
  type FilterChip,
  type SuchParameter,
} from "@/lib/filter";
import { cn } from "@/lib/utils";

export interface Schnellzugriff {
  id: string;
  label: string;
  /** Die Suchparameter, die dieser Zugriff setzt. */
  werte: Record<string, string>;
}

/**
 * Schnellzugriffe und aktive Filter als Chip-Reihen.
 *
 * Die Fragen, mit denen Lehrkräfte auf die Seite kommen, sind fast immer
 * dieselben — „was ist bald?", „was geht online?", „was passt zu meiner
 * Schulart?". Ein Klick ist der richtige Aufwand dafür; drei Auswahllisten in
 * einem zugeklappten Feld sind es nicht.
 *
 * Darunter stehen die tatsächlich gesetzten Filter. Ohne sie sieht man nur
 * eine kleine Trefferzahl und weiß nicht, warum.
 */
export function Schnellzugriffe({
  params,
  zugriffe,
  aktiveFilter,
}: {
  params: SuchParameter;
  zugriffe: Schnellzugriff[];
  aktiveFilter: FilterChip[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [laeuft, starte] = useTransition();

  const wert = (name: string): string => {
    const v = params[name];
    return (Array.isArray(v) ? v[0] : v) ?? "";
  };

  function gehe(aenderungen: Record<string, string | undefined>) {
    starte(() => {
      router.push(baueUrl(pathname, params, aenderungen), { scroll: false });
    });
  }

  function entferne(param: string) {
    starte(() => {
      const rest = ohneFilter(params, param);
      const query = new URLSearchParams(
        Object.entries(rest).flatMap(([k, v]) => {
          const text = Array.isArray(v) ? v[0] : v;
          return text ? [[k, text] as [string, string]] : [];
        }),
      ).toString();
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  return (
    <div className={cn("space-y-3", laeuft && "opacity-60")}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Schnell finden:</span>

        {zugriffe.map((zugriff) => {
          // Aktiv ist ein Zugriff nur, wenn all seine Werte gesetzt sind.
          const aktiv = Object.entries(zugriff.werte).every(
            ([name, sollwert]) => wert(name) === sollwert,
          );

          return (
            <button
              key={zugriff.id}
              type="button"
              aria-pressed={aktiv}
              onClick={() =>
                gehe(
                  aktiv
                    ? Object.fromEntries(
                        Object.keys(zugriff.werte).map((name) => [name, undefined]),
                      )
                    : zugriff.werte,
                )
              }
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                aktiv
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/25 hover:bg-accent hover:text-foreground",
              )}
            >
              {zugriff.label}
            </button>
          );
        })}
      </div>

      {aktiveFilter.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Gesetzt:</span>

          {aktiveFilter.map((chip) => (
            <button
              key={chip.param}
              type="button"
              onClick={() => entferne(chip.param)}
              title={`${chip.art}: ${chip.wert} entfernen`}
              className="group flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm transition-colors hover:bg-destructive/10"
            >
              <span className="text-muted-foreground">{chip.art}:</span>
              <span className="font-medium">{chip.wert}</span>
              <X
                className="size-3.5 text-muted-foreground group-hover:text-destructive"
                aria-hidden
              />
            </button>
          ))}

          {aktiveFilter.length > 1 ? (
            <button
              type="button"
              onClick={() =>
                starte(() => router.push(pathname, { scroll: false }))
              }
              className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              alle entfernen
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
