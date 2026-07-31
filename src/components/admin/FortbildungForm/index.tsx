"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { AlertCircle, CalendarOff, Info } from "lucide-react";

import { saveFortbildung } from "@/actions/fortbildung";
import {
  FELD_ZU_TAB,
  type FormularState,
} from "@/lib/validation/fortbildung";
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "@/lib/datetime";
import { terminWarnung } from "@/lib/ferien";
import {
  NIVEAUSTUFEN,
  ORGANISATIONSFORMEN,
  SCHULARTEN,
  SCHULARTEN_STANDARD,
  STATUS,
  VERANSTALTUNGSFORMATE,
} from "@/constants/fortbildung";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DigCompAccordion } from "./DigCompAccordion";
import { ReferentenPicker } from "./ReferentenPicker";
import { RichTextEditor } from "./RichTextEditor";
import { SchlagwortInput } from "./SchlagwortInput";
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

export function FortbildungForm({
  fortbildung,
  orte,
  kompetenzBereiche,
  referenten,
  schlagwortVorschlaege,
}: {
  fortbildung?: FortbildungWerte;
  orte: OrtOption[];
  kompetenzBereiche: KompetenzBereichOption[];
  referenten: ReferentOption[];
  schlagwortVorschlaege: string[];
}) {
  const action = saveFortbildung.bind(null, fortbildung?.id ?? null);
  const [state, formAction] = useActionState<FormularState, FormData>(action, {});

  const [tab, setTab] = useState<string>("eckdaten");

  // Felder, die andere Felder beeinflussen oder die kein natives Input sind,
  // liegen im State. Der Rest bleibt uncontrolled — weniger Code, und der
  // Browser behält die Eingaben beim Zurückspringen.
  const [format, setFormat] = useState(fortbildung?.format ?? "PRAESENZ");
  const [ortId, setOrtId] = useState(fortbildung?.veranstaltungsortId ?? "");
  const [organisationsform, setOrganisationsform] = useState(
    fortbildung?.organisationsform ?? "REGIONAL",
  );
  const [status, setStatus] = useState(fortbildung?.status ?? "ENTWURF");
  const [niveaustufe, setNiveaustufe] = useState(fortbildung?.niveaustufe ?? "");
  const [beschreibung, setBeschreibung] = useState(
    fortbildung?.beschreibungHtml ?? "",
  );
  const [schularten, setSchularten] = useState<string[]>(
    fortbildung?.schularten ?? SCHULARTEN_STANDARD,
  );
  const [schlagworte, setSchlagworte] = useState<string[]>(
    fortbildung?.schlagwortNamen ?? [],
  );
  const [kompetenzen, setKompetenzen] = useState<string[]>(
    fortbildung?.kompetenzCodes ?? [],
  );
  const [gewaehlteReferenten, setGewaehlteReferenten] = useState<string[]>(
    fortbildung?.referentIds ?? [],
  );

  // Beginn und Ende liegen im State, damit die Ferien-Warnung schon beim
  // Tippen erscheint und nicht erst nach dem Speichern.
  const [beginn, setBeginn] = useState(toDatetimeLocalValue(fortbildung?.beginn));
  const [ende, setEnde] = useState(toDatetimeLocalValue(fortbildung?.ende));

  // Eigenes useMemo, damit das leere Objekt nicht bei jedem Rendern neu
  // entsteht und die abhängigen Memos ständig neu rechnen lässt.
  const fehler = useMemo(() => state.fehler ?? {}, [state.fehler]);

  const terminHinweis = useMemo(() => {
    const von = fromDatetimeLocalValue(beginn);
    if (!von) return null;
    const bis = fromDatetimeLocalValue(ende) ?? von;
    return terminWarnung(von, bis < von ? von : bis);
  }, [beginn, ende]);

  /**
   * Eine eSession findet online statt, eine Präsenzveranstaltung nicht. Statt
   * die falsche Kombination erst beim Speichern abzulehnen, zeigt die Auswahl
   * gleich nur die passenden Orte. Die Server Action prüft es trotzdem.
   */
  const passendeOrte = useMemo(
    () => orte.filter((ort) => (format === "ESESSION" ? ort.istOnline : !ort.istOnline)),
    [orte, format],
  );

  function formatWechseln(neu: string) {
    setFormat(neu);
    const passt = orte.find((o) => o.id === ortId);
    if (!passt) return;
    if (neu === "ESESSION" && !passt.istOnline) {
      setOrtId(orte.find((o) => o.istOnline)?.id ?? "");
    }
    if (neu === "PRAESENZ" && passt.istOnline) {
      setOrtId("");
    }
  }

  /** Tabs, in denen mindestens ein Fehler steckt. */
  const fehlerhafteTabs = useMemo(() => {
    const menge = new Set<string>();
    for (const feld of Object.keys(fehler)) {
      const zielTab = FELD_ZU_TAB[feld];
      if (zielTab) menge.add(zielTab);
    }
    return menge;
  }, [fehler]);

  return (
    <form action={formAction} className="space-y-6">
      {/* Werte aus State, die kein sichtbares Formularfeld haben. */}
      <input type="hidden" name="beschreibungHtml" value={beschreibung} />
      <input type="hidden" name="niveaustufe" value={niveaustufe} />

      {fehler._ ? <Fehlerkasten meldung={fehler._} /> : null}

      {Object.keys(fehler).length > 0 && !fehler._ ? (
        <Fehlerkasten meldung="Bitte die markierten Felder prüfen. Die betroffenen Reiter sind mit einem Punkt gekennzeichnet." />
      ) : null}

      <Tabs value={tab} onValueChange={(wert) => setTab(String(wert))}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {TABS.map(({ id, label }) => (
            <TabsTrigger key={id} value={id}>
              {label}
              {fehlerhafteTabs.has(id) ? (
                <span
                  aria-label="enthält Fehler"
                  className="ml-1 size-1.5 rounded-full bg-destructive"
                />
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ------------------------------------------------------------- */}
        <TabsContent value="eckdaten" keepMounted className="pt-6">
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

            <Feld label="Organisationsform" pflicht fehler={fehler.organisationsform}>
              <Select
                name="organisationsform"
                value={organisationsform}
                onValueChange={(wert) => setOrganisationsform(String(wert))}
                items={ORGANISATIONSFORMEN.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
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

            <Feld
              label="Maximale Teilnehmerzahl"
              pflicht
              fehler={fehler.maxTn}
            >
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
                value={format}
                onValueChange={(wert) => formatWechseln(String(wert))}
                items={VERANSTALTUNGSFORMATE.map((f) => ({
                  value: f.value,
                  label: f.label,
                }))}
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
                format === "ESESSION"
                  ? 'eSessions finden am Ort "Online" statt.'
                  : undefined
              }
            >
              <Select
                name="veranstaltungsortId"
                value={ortId}
                onValueChange={(wert) => setOrtId(String(wert))}
                items={passendeOrte.map((o) => ({
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
                  {passendeOrte.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {ortLabel(o)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Feld>

            <Feld
              label="Beginn"
              pflicht
              fehler={fehler.beginn}
              hinweis="Format TT.MM.JJJJ HH:MM"
            >
              <Input
                name="beginn"
                type="datetime-local"
                required
                value={beginn}
                onChange={(e) => {
                  setBeginn(e.target.value);
                  // Ende sinnvoll vorbelegen: zwei Stunden später ist der
                  // typische Zuschnitt einer regionalen Fortbildung.
                  if (!ende && e.target.value) {
                    const start = fromDatetimeLocalValue(e.target.value);
                    if (start) {
                      setEnde(
                        toDatetimeLocalValue(
                          new Date(start.getTime() + 2 * 60 * 60 * 1000),
                        ),
                      );
                    }
                  }
                }}
                className="w-full"
                aria-invalid={Boolean(fehler.beginn)}
              />
            </Feld>

            <Feld label="Ende" pflicht fehler={fehler.ende} hinweis="Format TT.MM.JJJJ HH:MM">
              <Input
                name="ende"
                type="datetime-local"
                required
                value={ende}
                onChange={(e) => setEnde(e.target.value)}
                className="w-full"
                aria-invalid={Boolean(fehler.ende)}
              />
            </Feld>

            {terminHinweis ? (
              <div className="md:col-span-2">
                <TerminWarnung
                  art={terminHinweis.art}
                  text={terminHinweis.text}
                />
              </div>
            ) : null}

            <div className="md:col-span-2">
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="mb-4 flex items-center gap-2 text-sm font-medium">
                  <Info className="size-4 text-muted-foreground" aria-hidden />
                  Veröffentlichung und FIBS
                </p>

                <div className="grid gap-5 md:grid-cols-3">
                  <Feld label="Status" fehler={fehler.status}>
                    <Select
                      name="status"
                      value={status}
                      onValueChange={(wert) => setStatus(String(wert))}
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
                      {STATUS.find((s) => s.value === status)?.beschreibung}
                    </p>
                  </Feld>

                  <Feld
                    label="FIBS-Lehrgangsnummer"
                    fehler={fehler.fibsLehrgangsnummer}
                  >
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
            </div>
          </div>
        </TabsContent>

        {/* ------------------------------------------------------------- */}
        <TabsContent value="beschreibung" keepMounted className="pt-6">
          <Feld
            label="Lehrgangsbeschreibung"
            pflicht
            fehler={fehler.beschreibungHtml}
            hinweis="Worum geht es, für wen ist der Lehrgang gedacht, was wird mitgebracht?"
          >
            <RichTextEditor
              wert={beschreibung}
              onChange={setBeschreibung}
              fehlerhaft={Boolean(fehler.beschreibungHtml)}
            />
          </Feld>
        </TabsContent>

        {/* ------------------------------------------------------------- */}
        <TabsContent value="zielgruppe" keepMounted className="space-y-6 pt-6">
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
                    checked={schularten.includes(schulart.value)}
                    onCheckedChange={(checked) =>
                      setSchularten((bisher) =>
                        checked
                          ? [...bisher, schulart.value]
                          : bisher.filter((s) => s !== schulart.value),
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
              werte={schlagworte}
              onChange={setSchlagworte}
              vorschlaege={schlagwortVorschlaege}
            />
          </Feld>
        </TabsContent>

        {/* ------------------------------------------------------------- */}
        <TabsContent value="digcomp" keepMounted className="space-y-6 pt-6">
          <Feld
            label="Niveaustufe"
            fehler={fehler.niveaustufe}
            className="max-w-xs"
          >
            <Select
              value={niveaustufe}
              onValueChange={(wert) => setNiveaustufe(String(wert))}
              items={NIVEAUSTUFEN.map((n) => ({ value: n.value, label: n.label }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Keine Angabe" />
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
            fehler={fehler.kompetenzen}
            hinweis="Mehrfachauswahl. Lehrkräfte können im Frontend gezielt nach diesen Bereichen filtern."
          >
            <DigCompAccordion
              bereiche={kompetenzBereiche}
              ausgewaehlt={kompetenzen}
              onChange={setKompetenzen}
            />
          </Feld>
        </TabsContent>

        {/* ------------------------------------------------------------- */}
        <TabsContent value="referenten" keepMounted className="pt-6">
          <Feld
            label="Referentinnen und Referenten"
            fehler={fehler.referenten}
            hinweis="Im Frontend erscheinen nur Personen, die im Referentenverzeichnis zur Veröffentlichung freigegeben sind."
          >
            <ReferentenPicker
              referenten={referenten}
              ausgewaehlt={gewaehlteReferenten}
              onChange={setGewaehlteReferenten}
            />
          </Feld>
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-3 border-t pt-6">
        <Speichern neu={!fortbildung} />
        <Button nativeButton={false} variant="ghost" render={<Link href="/admin">Abbrechen</Link>} />
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------

function Speichern({ neu }: { neu: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Wird gespeichert …" : neu ? "Fortbildung anlegen" : "Änderungen speichern"}
    </Button>
  );
}

function Feld({
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
function TerminWarnung({ art, text }: { art: string; text: string }) {
  const dringend = art === "ferien" || art === "feiertag";

  return (
    <p
      className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm ${
        dringend
          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
          : "bg-muted text-muted-foreground"
      }`}
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

function Fehlerkasten({ meldung }: { meldung: string }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      {meldung}
    </p>
  );
}

function ortLabel(ort: OrtOption): string {
  return ort.ort && !ort.name.includes(ort.ort) ? `${ort.name}, ${ort.ort}` : ort.name;
}
