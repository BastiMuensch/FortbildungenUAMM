"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";

import { saveFortbildung } from "@/actions/fortbildung";
import { fehlerTab, type FormularState } from "@/lib/validation/fortbildung";
import { FehlerUebersicht } from "./FehlerUebersicht";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  BeschreibungFelder,
  DigCompFelder,
  EckdatenFelder,
  ReferentenFelder,
  ZielgruppeFelder,
} from "./Abschnitte";
import { useFortbildungState } from "./state";
import type {
  FortbildungWerte,
  KompetenzBereichOption,
  OrtOption,
  ReferentOption,
} from "./types";

const TABS = [
  { id: "eckdaten", label: "Eckdaten" },
  { id: "beschreibung", label: "Beschreibung" },
  { id: "zielgruppe", label: "Zielgruppe" },
  { id: "digcomp", label: "DigCompEdu" },
  { id: "referenten", label: "Referenten" },
] as const;

/**
 * Bearbeiten einer bestehenden Fortbildung.
 *
 * Hier bewusst Reiter statt Schritte: Wer etwas ändern will, springt gezielt
 * zu einem Abschnitt und will nicht durch sechs Schritte geführt werden. Das
 * schrittweise Anlegen übernimmt der Wizard (siehe Wizard.tsx), beide nutzen
 * dieselben Feldgruppen.
 */
export function FortbildungForm({
  fortbildung,
  orte,
  kompetenzBereiche,
  referenten,
  schlagwortVorschlaege,
  pflichtSchlagworte,
  darfVeroeffentlichen,
}: {
  fortbildung?: FortbildungWerte;
  orte: OrtOption[];
  kompetenzBereiche: KompetenzBereichOption[];
  referenten: ReferentOption[];
  schlagwortVorschlaege: string[];
  pflichtSchlagworte: string[];
  darfVeroeffentlichen: boolean;
}) {
  const action = saveFortbildung.bind(null, fortbildung?.id ?? null);
  const [state, formAction] = useActionState<FormularState, FormData>(action, {});
  const [tab, setTab] = useState<string>("eckdaten");

  const zustand = useFortbildungState(fortbildung, orte);

  // Eigenes useMemo, damit das leere Objekt nicht bei jedem Rendern neu
  // entsteht und die abhängigen Memos ständig neu rechnen lässt.
  const fehler = useMemo(() => state.fehler ?? {}, [state.fehler]);

  /** Reiter, in denen mindestens ein Fehler steckt. */
  const fehlerhafteTabs = useMemo(() => {
    const menge = new Set<string>();
    for (const feld of Object.keys(fehler)) {
      const zielTab = fehlerTab(feld);
      if (zielTab) menge.add(zielTab);
    }
    return menge;
  }, [fehler]);

  const gemeinsam = { zustand, fehler, fortbildung, darfVeroeffentlichen };

  return (
    <form action={formAction} noValidate className="space-y-6">
      {/* Verdeckte Pflichtfelder dürfen die Serverprüfung nicht lautlos blockieren. */}
      {/* Werte aus dem State, die kein sichtbares Formularfeld haben. */}
      <input type="hidden" name="beschreibungHtml" value={zustand.beschreibung} />
      <input type="hidden" name="niveaustufe" value={zustand.niveaustufe} />

      <FehlerUebersicht fehler={fehler} onAbschnitt={(abschnitt) => setTab(abschnitt)} />

      <Tabs value={tab} onValueChange={(wert) => setTab(String(wert))}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {TABS.map(({ id, label }) => (
            <TabsTrigger key={id} value={id}>
              {label}
              {fehlerhafteTabs.has(id) ? (
                <span
                  aria-label="enthält Fehler"
                  className="ml-1 size-1.5 bg-destructive"
                />
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="eckdaten" keepMounted className="pt-6">
          <EckdatenFelder {...gemeinsam} />
        </TabsContent>

        <TabsContent value="beschreibung" keepMounted className="pt-6">
          <BeschreibungFelder {...gemeinsam} />
        </TabsContent>

        <TabsContent value="zielgruppe" keepMounted className="pt-6">
          <ZielgruppeFelder
            {...gemeinsam}
            schlagwortVorschlaege={schlagwortVorschlaege}
            pflichtSchlagworte={pflichtSchlagworte}
          />
        </TabsContent>

        <TabsContent value="digcomp" keepMounted className="pt-6">
          <DigCompFelder {...gemeinsam} kompetenzBereiche={kompetenzBereiche} />
        </TabsContent>

        <TabsContent value="referenten" keepMounted className="pt-6">
          <ReferentenFelder {...gemeinsam} referenten={referenten} />
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-3 border-t pt-6">
        <Speichern />
        <Button
          nativeButton={false}
          variant="ghost"
          render={<Link href="/admin">Abbrechen</Link>}
        />
      </div>
    </form>
  );
}

function Speichern() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Wird gespeichert …" : "Änderungen speichern"}
    </Button>
  );
}
