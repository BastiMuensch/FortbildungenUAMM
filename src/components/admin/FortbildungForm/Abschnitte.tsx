"use client";

import { CalendarOff, CalendarRange, Info } from "lucide-react";

import {
  NIVEAUSTUFEN,
  ORGANISATIONSFORMEN,
  SCHULARTEN,
  STATUS,
  VERANSTALTUNGSFORMATE,
} from "@/constants/fortbildung";
import { cn } from "@/lib/utils";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { DigCompAccordion } from "./DigCompAccordion";
import { ReferentenPicker } from "./ReferentenPicker";
import { RichTextEditor } from "./RichTextEditor";
import { SchlagwortInput } from "./SchlagwortInput";
import { Terminumfeld } from "./Terminumfeld";
import type { FortbildungState } from "./state";
import type {
  FortbildungWerte,
  KompetenzBereichOption,
  OrtOption,
  ReferentOption,
} from "./types";

/**
 * Die fünf Feldgruppen der Fortbildung.
 *
 * Wizard und Bearbeiten-Ansicht rendern dieselben Komponenten — nur die
 * Rahmung unterscheidet sich (Schritte gegenüber Reitern). Damit kann eine
 * Feldänderung nicht in einer der beiden Ansichten vergessen werden.
 */

interface GemeinsameProps {
  zustand: FortbildungState;
  fehler: Record<string, string>;
  fortbildung?: FortbildungWerte;
}

// ---------------------------------------------------------------------------

export function EckdatenFelder({
  zustand,
  fehler,
  fortbildung,
  zeigeVeroeffentlichung = true,
}: GemeinsameProps & { zeigeVeroeffentlichung?: boolean }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Feld
        className="md:col-span-2"
        label="Lehrgangstitel"
        pflicht
        fehler={fehler.titel}
      >
        <Input
          name="titel"
          defaultValue={fortbildung?.titel}
          maxLength={200}
          required
          className="w-full"
          aria-invalid={Boolean(fehler.titel)}
        />
      </Feld>

      <Feld
        className="md:col-span-2"
        label="Lehrgangskurztitel"
        hinweis="Optional. Wird in Listen und im Kalender angezeigt, wenn der volle Titel zu lang ist."
        fehler={fehler.kurztitel}
      >
        <Input
          name="kurztitel"
          defaultValue={fortbildung?.kurztitel ?? ""}
          maxLength={100}
          className="w-full"
        />
      </Feld>

      <Feld
        label="Organisationsform"
        pflicht
        fehler={fehler.organisationsform}
        hinweis={
          ORGANISATIONSFORMEN.find((o) => o.value === zustand.organisationsform)
            ?.beschreibung
        }
      >
        <Select
          name="organisationsform"
          value={zustand.organisationsform}
          onValueChange={(wert) => zustand.setOrganisationsform(String(wert))}
          items={ORGANISATIONSFORMEN.map((o) => ({ value: o.value, label: o.label }))}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ORGANISATIONSFORMEN.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Feld>

      <Feld label="Maximale Teilnehmerzahl" pflicht fehler={fehler.maxTn}>
        <Input
          name="maxTn"
          type="number"
          min={1}
          max={1000}
          step={1}
          defaultValue={fortbildung?.maxTn ?? 20}
          required
          className="w-full"
          aria-invalid={Boolean(fehler.maxTn)}
        />
      </Feld>

      <Feld label="Veranstaltungsformat" pflicht fehler={fehler.format}>
        <Select
          name="format"
          value={zustand.format}
          onValueChange={(wert) => zustand.formatWechseln(String(wert))}
          items={VERANSTALTUNGSFORMATE.map((f) => ({ value: f.value, label: f.label }))}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VERANSTALTUNGSFORMATE.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Feld>

      <Feld
        label="Veranstaltungsort"
        pflicht
        fehler={fehler.veranstaltungsortId}
        hinweis={
          zustand.format === "ESESSION"
            ? "Bei einer eSession ist der Ort automatisch ViKo (online)."
            : undefined
        }
      >
        <Select
          name="veranstaltungsortId"
          value={zustand.ortId}
          onValueChange={(wert) => zustand.setOrtId(String(wert))}
          items={zustand.passendeOrte.map((o) => ({
            value: o.id,
            label: ortLabel(o),
          }))}
        >
          <SelectTrigger
            className="w-full"
            aria-invalid={Boolean(fehler.veranstaltungsortId)}
          >
            <SelectValue placeholder="Bitte wählen" />
          </SelectTrigger>
          <SelectContent>
            {zustand.passendeOrte.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {ortLabel(o)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Feld>

      <Feld label="Beginn" pflicht fehler={fehler.beginn} hinweis="Format TT.MM.JJJJ HH:MM">
        <Input
          name="beginn"
          type="datetime-local"
          required
          value={zustand.beginn}
          onChange={(e) => zustand.beginnSetzen(e.target.value)}
          className="w-full"
          aria-invalid={Boolean(fehler.beginn)}
        />
      </Feld>

      <Feld label="Ende" pflicht fehler={fehler.ende} hinweis="Format TT.MM.JJJJ HH:MM">
        <Input
          name="ende"
          type="datetime-local"
          required
          value={zustand.ende}
          onChange={(e) => zustand.setEnde(e.target.value)}
          className="w-full"
          aria-invalid={Boolean(fehler.ende)}
        />
      </Feld>

      {zustand.terminHinweis ? (
        <div className="md:col-span-2">
          <TerminWarnung
            art={zustand.terminHinweis.art}
            text={zustand.terminHinweis.text}
          />
        </div>
      ) : null}

      <div className="md:col-span-2">
        <p className="mb-3 flex items-center gap-2 text-sm font-medium">
          <CalendarRange className="size-4 text-muted-foreground" aria-hidden />
          Was sonst an diesem Tag läuft
        </p>
        <Terminumfeld
          beginn={zustand.beginn}
          ende={zustand.ende}
          ortId={zustand.ortId}
          referentIds={zustand.referenten}
          eigeneId={fortbildung?.id}
        />
      </div>

      {zeigeVeroeffentlichung ? (
        <div className="md:col-span-2">
          <VeroeffentlichungFelder
            zustand={zustand}
            fehler={fehler}
            fortbildung={fortbildung}
          />
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------

export function VeroeffentlichungFelder({
  zustand,
  fehler,
  fortbildung,
}: GemeinsameProps) {
  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <p className="mb-4 flex items-center gap-2 text-sm font-medium">
        <Info className="size-4 text-muted-foreground" aria-hidden />
        Veröffentlichung und FIBS
      </p>

      <div className="grid gap-5 md:grid-cols-3">
        <Feld label="Status" fehler={fehler.status}>
          <Select
            name="status"
            value={zustand.status}
            onValueChange={(wert) => zustand.setStatus(String(wert))}
            items={STATUS.map((s) => ({ value: s.value, label: s.label }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {STATUS.find((s) => s.value === zustand.status)?.beschreibung}
          </p>
        </Feld>

        <Feld label="FIBS-Lehrgangsnummer" fehler={fehler.fibsLehrgangsnummer}>
          <Input
            name="fibsLehrgangsnummer"
            defaultValue={fortbildung?.fibsLehrgangsnummer ?? ""}
            placeholder="z. B. E123-4/56/7"
            className="w-full"
          />
        </Feld>

        <Feld
          label="FIBS-Link zur Anmeldung"
          fehler={fehler.fibsUrl}
          hinweis="Die verbindliche Anmeldung läuft über FIBS."
        >
          <Input
            name="fibsUrl"
            type="url"
            defaultValue={fortbildung?.fibsUrl ?? ""}
            placeholder="https://fibs.alp.dillingen.de/…"
            className="w-full"
            aria-invalid={Boolean(fehler.fibsUrl)}
          />
        </Feld>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

export function BeschreibungFelder({ zustand, fehler }: GemeinsameProps) {
  return (
    <Feld
      label="Lehrgangsbeschreibung"
      pflicht
      fehler={fehler.beschreibungHtml}
      hinweis="Worum geht es, für wen ist der Lehrgang gedacht, was wird mitgebracht?"
    >
      <RichTextEditor
        wert={zustand.beschreibung}
        onChange={zustand.setBeschreibung}
        fehlerhaft={Boolean(fehler.beschreibungHtml)}
      />
    </Feld>
  );
}

// ---------------------------------------------------------------------------

export function ZielgruppeFelder({
  zustand,
  fehler,
  fortbildung,
  schlagwortVorschlaege,
}: GemeinsameProps & { schlagwortVorschlaege: string[] }) {
  return (
    <div className="space-y-6">
      <Feld label="Schularten" pflicht fehler={fehler.schularten}>
        <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {SCHULARTEN.map((schulart) => (
            <label
              key={schulart.value}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 transition-colors hover:bg-accent/50"
            >
              <Checkbox
                name="schularten"
                value={schulart.value}
                checked={zustand.schularten.includes(schulart.value)}
                onCheckedChange={(checked) =>
                  zustand.setSchularten(
                    checked
                      ? [...zustand.schularten, schulart.value]
                      : zustand.schularten.filter((s) => s !== schulart.value),
                  )
                }
              />
              <span className="text-sm">{schulart.label}</span>
            </label>
          ))}
        </div>
      </Feld>

      <Feld
        label="Fach"
        hinweis="Optional, z. B. Mathematik oder Deutsch."
        fehler={fehler.fach}
        className="max-w-sm"
      >
        <Input
          name="fach"
          defaultValue={fortbildung?.fach ?? ""}
          maxLength={100}
          className="w-full"
        />
      </Feld>

      <Feld
        label="Schlagworte"
        fehler={fehler.schlagworte}
        hinweis="UAMM und Medienteam-UAMM sind fest gesetzt und werden immer mitgespeichert."
      >
        <SchlagwortInput
          werte={zustand.schlagworte}
          onChange={zustand.setSchlagworte}
          vorschlaege={schlagwortVorschlaege}
        />
      </Feld>
    </div>
  );
}

// ---------------------------------------------------------------------------

export function DigCompFelder({
  zustand,
  fehler,
  kompetenzBereiche,
}: GemeinsameProps & { kompetenzBereiche: KompetenzBereichOption[] }) {
  return (
    <div className="space-y-6">
      <Feld label="Niveaustufe" pflicht fehler={fehler.niveaustufe} className="max-w-xs">
        <Select
          value={zustand.niveaustufe}
          onValueChange={(wert) => zustand.setNiveaustufe(String(wert))}
          items={NIVEAUSTUFEN.map((n) => ({ value: n.value, label: n.label }))}
        >
          <SelectTrigger className="w-full" aria-invalid={Boolean(fehler.niveaustufe)}>
            <SelectValue placeholder="Bitte wählen" />
          </SelectTrigger>
          <SelectContent>
            {NIVEAUSTUFEN.map((n) => (
              <SelectItem key={n.value} value={n.value}>
                {n.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Feld>

      <Feld
        label="Kompetenzbereiche (DigCompEdu Bavaria)"
        pflicht
        fehler={fehler.kompetenzen}
        hinweis="Mehrfachauswahl. Lehrkräfte können im Frontend gezielt nach diesen Bereichen filtern."
      >
        <DigCompAccordion
          bereiche={kompetenzBereiche}
          ausgewaehlt={zustand.kompetenzen}
          onChange={zustand.setKompetenzen}
        />
      </Feld>
    </div>
  );
}

// ---------------------------------------------------------------------------

export function ReferentenFelder({
  zustand,
  fehler,
  referenten,
}: GemeinsameProps & { referenten: ReferentOption[] }) {
  return (
    <Feld
      label="Referentinnen und Referenten"
      pflicht
      fehler={fehler.referenten}
      hinweis="Im Frontend erscheinen nur Personen, die im Referentenverzeichnis zur Veröffentlichung freigegeben sind."
    >
      <ReferentenPicker
        referenten={referenten}
        ausgewaehlt={zustand.referenten}
        onChange={zustand.setReferenten}
      />
    </Feld>
  );
}

// ---------------------------------------------------------------------------
// Bausteine
// ---------------------------------------------------------------------------

export function Feld({
  label,
  pflicht,
  hinweis,
  fehler,
  className,
  children,
}: {
  label: string;
  pflicht?: boolean;
  hinweis?: string;
  fehler?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="flex items-center gap-1">
        {label}
        {pflicht ? (
          <span className="text-destructive" aria-label="Pflichtfeld">
            *
          </span>
        ) : null}
      </Label>

      {children}

      {fehler ? (
        <p role="alert" className="text-sm text-destructive">
          {fehler}
        </p>
      ) : hinweis ? (
        <p className="text-xs text-muted-foreground">{hinweis}</p>
      ) : null}
    </div>
  );
}

/**
 * Hinweis auf Ferien, Feiertage und Wochenenden.
 *
 * Bewusst nur ein Hinweis, keine Sperre: Eine SchiLf am Buß- und Bettag oder
 * ein Studientag in den Ferien kann gewollt sein. Der häufigere Fall ist aber
 * der Tippfehler im Datum — und den fängt der Hinweis ab, bevor der Termin
 * veröffentlicht ist.
 */
export function TerminWarnung({ art, text }: { art: string; text: string }) {
  const dringend = art === "ferien" || art === "feiertag";

  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-xl px-4 py-3 text-sm",
        dringend ? "bg-ferien-weich text-ferien" : "bg-muted text-muted-foreground",
      )}
    >
      <CalendarOff className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>
        {text}
        {dringend ? (
          <span className="block text-xs opacity-80">
            Das ist nur ein Hinweis — falls der Termin so gewollt ist, einfach
            weiter ausfüllen.
          </span>
        ) : null}
      </span>
    </p>
  );
}

export function ortLabel(ort: OrtOption): string {
  return ort.ort && !ort.name.includes(ort.ort) ? `${ort.name}, ${ort.ort}` : ort.name;
}
