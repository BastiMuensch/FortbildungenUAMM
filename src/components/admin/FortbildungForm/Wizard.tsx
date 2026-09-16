"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
} from "lucide-react";

import { saveFortbildung } from "@/actions/fortbildung";
import type { FormularState } from "@/lib/validation/fortbildung";
import { formatZeitraum, parseDatumZeitEingabe } from "@/lib/datetime";
import {
  formatLabel,
  niveaustufeLabel,
  organisationsformLabel,
  schulartLabel,
  statusLabel,
  PFLICHT_SCHLAGWORTE,
} from "@/constants/fortbildung";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import {
  BeschreibungFelder,
  DigCompFelder,
  EckdatenFelder,
  ReferentenFelder,
  VeroeffentlichungFelder,
  ZielgruppeFelder,
  ortLabel,
} from "./Abschnitte";
import { SCHRITTE } from "./schritte";
import { FehlerUebersicht } from "./FehlerUebersicht";
import { schrittFehler, useFortbildungState } from "./state";
import type {
  KompetenzBereichOption,
  OrtOption,
  ReferentOption,
} from "./types";

/**
 * Schrittweises Anlegen einer Fortbildung.
 *
 * Der Wizard führt durch alle Abschnitte und prüft jeden Schritt, bevor es
 * weitergeht. Damit lässt sich keine Angabe mehr übersehen, die im
 * Reiterformular in einem geschlossenen Reiter unsichtbar geblieben wäre.
 *
 * Der letzte Schritt fasst alles zusammen. Als Entwurf lässt sich jederzeit
 * speichern — auch unvollständig, sonst ginge angefangene Arbeit verloren.
 * Vollständig sein muss erst, was veröffentlicht wird.
 */
export function FortbildungWizard({
  orte,
  kompetenzBereiche,
  referenten,
  schlagwortVorschlaege,
  darfVeroeffentlichen,
}: {
  orte: OrtOption[];
  kompetenzBereiche: KompetenzBereichOption[];
  referenten: ReferentOption[];
  schlagwortVorschlaege: string[];
  darfVeroeffentlichen: boolean;
}) {
  const action = saveFortbildung.bind(null, null);
  const [state, formAction] = useActionState<FormularState, FormData>(action, {});

  const [index, setIndex] = useState(0);
  const [lokaleFehler, setLokaleFehler] = useState<Record<string, string>>({});
  const formularRef = useRef<HTMLFormElement>(null);

  const zustand = useFortbildungState(undefined, orte);
  const serverFehler = useMemo(() => state.fehler ?? {}, [state.fehler]);
  const fehler = { ...lokaleFehler, ...serverFehler };

  const schritt = SCHRITTE[index]!;
  const letzter = index === SCHRITTE.length - 1;

  function weiter() {
    const gefunden = schrittFehler(
      schritt.pflichtfelder,
      zustand,
      formularRef.current,
    );

    if (Object.keys(gefunden).length > 0) {
      setLokaleFehler(gefunden);
      return;
    }

    setLokaleFehler({});
    setIndex((i) => Math.min(i + 1, SCHRITTE.length - 1));
    formularRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function zurueck() {
    setLokaleFehler({});
    setIndex((i) => Math.max(i - 1, 0));
  }

  /** Bereits abgeschlossene Schritte lassen sich direkt anspringen. */
  function springe(ziel: number) {
    if (ziel > index) return;
    setLokaleFehler({});
    setIndex(ziel);
  }

  const gemeinsam = { zustand, fehler, darfVeroeffentlichen };

  return (
    <form ref={formularRef} action={formAction} noValidate className="space-y-8">
      {/* Eine gemeinsame Datumsprüfung statt nativer Prüfung versteckter Felder. */}
      <input type="hidden" name="beschreibungHtml" value={zustand.beschreibung} />
      <input type="hidden" name="niveaustufe" value={zustand.niveaustufe} />

      <Fortschritt index={index} onSpringe={springe} />

      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          {index + 1}. {schritt.titel}
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground text-pretty">
          {schritt.hilfe}
        </p>
      </div>

      <FehlerUebersicht
        fehler={serverFehler}
        onAbschnitt={(abschnitt, feld) => {
          // Die Status-/FIBS-Felder stehen im Wizard im letzten Schritt.
          const ziel = ["status", "fibsUrl", "fibsLehrgangsnummer"].includes(feld)
            ? SCHRITTE.length - 1
            : SCHRITTE.findIndex((s) => s.id === abschnitt);
          if (ziel >= 0) { setLokaleFehler({}); setIndex(ziel); }
        }}
      />

      {/*
        Alle Abschnitte bleiben im DOM — sonst fehlten die Felder der noch
        nicht besuchten Schritte beim Absenden. Nur der aktuelle ist sichtbar.
      */}
      <Abschnitt sichtbar={schritt.id === "eckdaten"}>
        <EckdatenFelder {...gemeinsam} zeigeVeroeffentlichung={false} />
      </Abschnitt>

      <Abschnitt sichtbar={schritt.id === "beschreibung"}>
        <BeschreibungFelder {...gemeinsam} />
      </Abschnitt>

      <Abschnitt sichtbar={schritt.id === "zielgruppe"}>
        <ZielgruppeFelder
          {...gemeinsam}
          schlagwortVorschlaege={schlagwortVorschlaege}
        />
      </Abschnitt>

      <Abschnitt sichtbar={schritt.id === "digcomp"}>
        <DigCompFelder {...gemeinsam} kompetenzBereiche={kompetenzBereiche} />
      </Abschnitt>

      <Abschnitt sichtbar={schritt.id === "referenten"}>
        <ReferentenFelder {...gemeinsam} referenten={referenten} />
      </Abschnitt>

      <Abschnitt sichtbar={letzter}>
        <div className="space-y-6">
          <Zusammenfassung
            zustand={zustand}
            orte={orte}
            referenten={referenten}
            kompetenzBereiche={kompetenzBereiche}
          />
          <VeroeffentlichungFelder
            zustand={zustand}
            fehler={fehler}
            darfVeroeffentlichen={darfVeroeffentlichen}
          />
        </div>
      </Abschnitt>

      <div className="flex flex-wrap items-center gap-3 border-t pt-6">
        {index > 0 ? (
          <Button type="button" variant="outline" onClick={zurueck}>
            <ArrowLeft className="size-4" aria-hidden />
            Zurück
          </Button>
        ) : null}

        {letzter ? (
          <Speichern
            status={zustand.status}
            darfVeroeffentlichen={darfVeroeffentlichen}
          />
        ) : (
          <Button type="button" onClick={weiter}>
            Weiter
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        )}

        <Button
          nativeButton={false}
          variant="ghost"
          render={<Link href="/admin">Abbrechen</Link>}
        />

        <span className="ml-auto text-sm text-muted-foreground">
          Schritt {index + 1} von {SCHRITTE.length}
        </span>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------

function Abschnitt({
  sichtbar,
  children,
}: {
  sichtbar: boolean;
  children: React.ReactNode;
}) {
  return (
    <div hidden={!sichtbar} aria-hidden={!sichtbar}>
      {children}
    </div>
  );
}

function Fortschritt({
  index,
  onSpringe,
}: {
  index: number;
  onSpringe: (ziel: number) => void;
}) {
  return (
    <ol className="flex flex-wrap items-center gap-x-1 gap-y-2">
      {SCHRITTE.map((schritt, i) => {
        const erledigt = i < index;
        const aktuell = i === index;

        return (
          <li key={schritt.id} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSpringe(i)}
              disabled={i > index}
              aria-current={aktuell ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 px-2.5 py-1.5 text-sm transition-colors",
                aktuell && "bg-primary/10 font-medium text-primary",
                erledigt && "text-muted-foreground hover:bg-accent hover:text-foreground",
                i > index && "cursor-default text-muted-foreground/50",
              )}
            >
              <span
                className={cn(
                  "zahl flex size-5 shrink-0 items-center justify-center text-xs",
                  aktuell && "bg-primary text-primary-foreground",
                  erledigt && "bg-primary/15 text-primary",
                  i > index && "border border-current",
                )}
              >
                {erledigt ? <Check className="size-3" aria-hidden /> : i + 1}
              </span>
              <span className="hidden sm:inline">{schritt.titel}</span>
            </button>

            {i < SCHRITTE.length - 1 ? (
              <span className="h-px w-3 bg-border sm:w-5" aria-hidden />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function Speichern({
  status,
  darfVeroeffentlichen,
}: {
  status: string;
  darfVeroeffentlichen: boolean;
}) {
  const { pending } = useFormStatus();

  const beschriftung =
    status === "ENTWURF"
      ? "Als Entwurf speichern"
      : status === "EINGEREICHT"
        ? "Zur Freigabe einreichen"
        : darfVeroeffentlichen
          ? "Anlegen und veröffentlichen"
          : "Speichern";

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Wird gespeichert …" : beschriftung}
    </Button>
  );
}

// ---------------------------------------------------------------------------

/** Letzter Schritt: alle Angaben auf einen Blick, mit Vollständigkeitsprüfung. */
function Zusammenfassung({
  zustand,
  orte,
  referenten,
  kompetenzBereiche,
}: {
  zustand: ReturnType<typeof useFortbildungState>;
  orte: OrtOption[];
  referenten: ReferentOption[];
  kompetenzBereiche: KompetenzBereichOption[];
}) {
  const beginn = parseDatumZeitEingabe(zustand.beginn);
  const ende = parseDatumZeitEingabe(zustand.ende);
  const ort = orte.find((o) => o.id === zustand.ortId);

  const gewaehlteReferenten = referenten.filter((r) =>
    zustand.referenten.includes(r.id),
  );

  const kompetenzTitel = kompetenzBereiche
    .flatMap((b) => [
      { code: b.code, titel: b.titel },
      ...b.children.map((k) => ({ code: k.code, titel: k.titel })),
    ])
    .filter((k) => zustand.kompetenzen.includes(k.code))
    .map((k) => `${k.code} ${k.titel}`);

  /** Was fehlt, wenn direkt veröffentlicht werden soll. */
  const luecken: string[] = [];
  if (!zustand.niveaustufe) luecken.push("Niveaustufe");
  if (zustand.kompetenzen.length === 0) luecken.push("DigCompEdu-Kompetenzen");
  if (zustand.referenten.length === 0) luecken.push("Referentinnen und Referenten");

  return (
    <div className="space-y-4">
      {luecken.length > 0 ? (
        <p className="flex items-start gap-2 bg-ferien-weich px-4 py-3 text-sm text-ferien">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Es fehlt noch: {luecken.join(", ")}. Als Entwurf lässt sich die
            Fortbildung trotzdem speichern — zum Einreichen oder
            Veröffentlichen müssen die Angaben vollständig sein.
          </span>
        </p>
      ) : (
        <p className="flex items-start gap-2 bg-primary/10 px-4 py-3 text-sm text-primary">
          <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
          Alle Angaben vollständig.
        </p>
      )}

      <dl className="grid gap-x-8 gap-y-4 border bg-card p-6 sm:grid-cols-2">
        <Zeile
          label="Termin"
          wert={beginn && ende ? formatZeitraum(beginn, ende) : "—"}
        />
        <Zeile
          label="Art"
          wert={`${organisationsformLabel(zustand.organisationsform)} · ${formatLabel(zustand.format)}`}
        />
        <Zeile label="Ort" wert={ort ? ortLabel(ort) : "—"} />
        <Zeile
          label="Schularten"
          wert={
            zustand.schularten.length > 0
              ? zustand.schularten.map(schulartLabel).join(", ")
              : "—"
          }
        />
        <Zeile
          label="Niveaustufe"
          wert={zustand.niveaustufe ? niveaustufeLabel(zustand.niveaustufe) : "—"}
        />
        <Zeile
          label="Referenten"
          wert={
            gewaehlteReferenten.length > 0
              ? gewaehlteReferenten
                  .map((r) => `${r.vorname} ${r.nachname}`)
                  .join(", ")
              : "—"
          }
        />
        <Zeile
          className="sm:col-span-2"
          label="Kompetenzen"
          wert={kompetenzTitel.length > 0 ? kompetenzTitel.join(" · ") : "—"}
        />
        <Zeile
          className="sm:col-span-2"
          label="Schlagworte"
          wert={[...PFLICHT_SCHLAGWORTE, ...zustand.schlagworte].join(", ")}
        />
        <Zeile label="Status" wert={statusLabel(zustand.status)} />
      </dl>
    </div>
  );
}

function Zeile({
  label,
  wert,
  className,
}: {
  label: string;
  wert: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-pretty">{wert}</dd>
    </div>
  );
}
