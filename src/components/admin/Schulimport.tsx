"use client";

import { useActionState, useRef, useState } from "react";
import { pruefeSchulimport, uebernehmeSchulimport, type SchulimportStand } from "@/actions/schulimport";
import { Button } from "@/components/ui/button";

export function Schulimport() {
  const [vorschau, pruefen, prueft] = useActionState<SchulimportStand, FormData>(pruefeSchulimport, {});
  const [ergebnis, uebernehmen, importiert] = useActionState<SchulimportStand, FormData>(uebernehmeSchulimport, {});
  const [dateiGeaendert, setDateiGeaendert] = useState(false);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [laedtPrompt, setLaedtPrompt] = useState(false);
  const [promptMeldung, setPromptMeldung] = useState("");
  const promptFeld = useRef<HTMLTextAreaElement>(null);

  async function zeigePrompt() {
    setLaedtPrompt(true);
    setPromptMeldung("");
    try {
      const antwort = await fetch("/vorlagen/schulen-ki-auftrag.md");
      if (!antwort.ok) throw new Error("Vorlage nicht verfügbar");
      setPrompt(await antwort.text());
    } catch {
      setPromptMeldung("Die Promptvorlage konnte nicht geladen werden. Bitte den Download-Link verwenden oder erneut versuchen.");
    } finally {
      setLaedtPrompt(false);
    }
  }

  async function kopierePrompt() {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setPromptMeldung("Prompt kopiert. In die KI Ihrer Wahl einfügen. Das offizielle RvS-Schulverzeichnis ist bereits verlinkt.");
    } catch {
      promptFeld.current?.focus();
      promptFeld.current?.select();
      setPromptMeldung("Bitte den markierten Prompt mit Strg+C oder ⌘C kopieren.");
    }
  }
  const plan = vorschau.plan;
  const aktionen = { neu: "Neu", aktualisieren: "Aktualisieren", unveraendert: "Unverändert" };
  return <section id="schulimport" className="scroll-mt-6 space-y-4 rounded-xl border bg-card p-5">
    <div><h2 className="text-lg font-semibold">Schulen per CSV importieren</h2><p className="mt-1 text-sm text-muted-foreground">Vorlage herunterladen, mit dem Schulverzeichnis befüllen und hier prüfen. Name und Ort sind Pflicht; Schulnummer und Straße sind optional. Bis zu 500 Schulen und 128 KB pro Datei.</p></div>
    <ol className="list-decimal space-y-1 pl-5 text-sm">
      <li>CSV-Vorlage selbst befüllen oder das amtliche Schulverzeichnis mit der Promptvorlage aufbereiten lassen. Je Schulamt eine eigene Datei erstellen.</li>
      <li>CSV-Datei auswählen und die Vorschau auf neue Schulen und Änderungen prüfen.</li>
      <li>Mit „Geprüfte Schulen übernehmen“ speichern.</li>
    </ol>
    <div className="flex flex-wrap items-center gap-4 text-sm"><a className="underline underline-offset-4" href="/vorlagen/schulen.csv" download>CSV-Vorlage herunterladen</a><a className="underline underline-offset-4" href="/vorlagen/schulen-ki-auftrag.md" download>Promptvorlage herunterladen</a><Button type="button" variant="outline" size="sm" onClick={zeigePrompt} disabled={laedtPrompt || prompt !== null}>{laedtPrompt ? "Vorlage wird geladen …" : "KI-Prompt anzeigen"}</Button></div>
    {prompt !== null ? <div className="space-y-3 rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">Schulamt und gewünschte Schularten im Prompt eintragen, anschließend kopieren. Das offizielle Schulverzeichnis der Regierung von Schwaben ist bereits als Quelle hinterlegt.</p>
      <label className="block text-sm font-medium">Promptvorlage<textarea ref={promptFeld} className="mt-2 block min-h-64 w-full rounded-md border bg-background p-3 font-mono text-xs" value={prompt} onChange={(event) => { setPrompt(event.target.value); setPromptMeldung(""); }} /></label>
      <Button type="button" variant="outline" size="sm" onClick={kopierePrompt}>Prompt kopieren</Button>
    </div> : null}
    {promptMeldung ? <p role="status" className="text-sm">{promptMeldung}</p> : null}
    <p className="text-xs text-muted-foreground">Die Schulen werden als Veranstaltungsorte im gemeinsamen Verzeichnis gespeichert. Das zuständige Schulamt einer Fortbildung wird bei der Ausschreibung festgelegt.</p>
    <p className="text-xs text-muted-foreground">UTF-8, Semikolon oder Komma. Schulnummern als Text behandeln, damit führende Nullen erhalten bleiben. Nicht enthaltene Schulen bleiben bestehen, stillgelegte bleiben stillgelegt. Leere optionale Felder löschen keine vorhandenen Angaben.</p>
    <form action={(daten) => { setDateiGeaendert(false); pruefen(daten); }} className="flex flex-wrap items-end gap-3">
      <label className="block min-w-0 flex-1 text-sm font-medium">CSV-Datei<input className="mt-2 block w-full rounded-md border p-2 text-sm" name="datei" type="file" accept=".csv,text/csv" required disabled={prueft || importiert} onChange={() => setDateiGeaendert(true)} /></label>
      <Button type="submit" disabled={prueft || importiert}>{prueft ? "Wird geprüft …" : "Vorschau erstellen"}</Button>
    </form>
    {vorschau.fehler ? <p role="alert" className="text-sm text-destructive">{vorschau.fehler}</p> : null}
    {plan && !dateiGeaendert && !(ergebnis.meldung && ergebnis.pruefsumme === vorschau.pruefsumme) ? <div className="space-y-4">
      {plan.fehler.length ? <div role="alert"><p className="font-medium text-destructive">Keine Übernahme möglich. Bitte die folgenden Fehler korrigieren:</p><ul className="mt-2 list-disc pl-5 text-sm">{plan.fehler.map((fehler, index) => <li key={index}>{fehler.zeile ? `Zeile ${fehler.zeile}: ` : ""}{fehler.meldung}</li>)}</ul></div> : null}
      <p className="text-sm font-medium">{plan.zeilen.filter((zeile) => zeile.aktion === "neu").length} neu · {plan.zeilen.filter((zeile) => zeile.aktion === "aktualisieren").length} zu aktualisieren · {plan.zeilen.filter((zeile) => zeile.aktion === "unveraendert").length} unverändert</p>
      <div className="max-h-96 overflow-auto rounded-lg border"><table className="w-full text-left text-sm"><caption className="sr-only">Vorschau Schulimport</caption><thead className="sticky top-0 bg-muted"><tr>{["Zeile", "Aktion", "Schulnummer", "Schule / Ort", "Änderungen"].map((titel) => <th scope="col" className="p-3" key={titel}>{titel}</th>)}</tr></thead><tbody>{plan.zeilen.map((zeile) => <tr className="border-t" key={zeile.zeile}><td className="p-3">{zeile.zeile}</td><td className="p-3">{aktionen[zeile.aktion]}</td><td className="p-3">{zeile.daten.schulnummer || "–"}</td><td className="p-3"><p className="font-medium">{zeile.daten.name}</p><p>{zeile.daten.strasse}{zeile.daten.strasse ? ", " : ""}{zeile.daten.ort}</p>{zeile.vorher && !zeile.vorher.aktiv ? <p className="text-xs">Bleibt stillgelegt</p> : null}</td><td className="p-3">{zeile.aktion === "aktualisieren" && zeile.vorher ? <><ul className="space-y-1">{(["name", "ort", "strasse", "schulnummer"] as const).filter((feld) => (zeile.vorher![feld] ?? "") !== zeile.daten[feld]).map((feld) => <li key={feld}>{feld}: {zeile.vorher![feld] || "leer"} → {zeile.daten[feld]}</li>)}</ul>{zeile.vorher._count.fortbildungen ? <p className="mt-1 text-xs text-amber-800">Betrifft auch {zeile.vorher._count.fortbildungen} Veranstaltungen in Ihrem Bereich.</p> : null}</> : "–"}</td></tr>)}</tbody></table></div>
      {!plan.fehler.length && plan.zeilen.some((zeile) => zeile.aktion !== "unveraendert") ? <form action={uebernehmen}>
        <input type="hidden" name="csv" value={vorschau.csv} /><input type="hidden" name="pruefsumme" value={vorschau.pruefsumme} />
        <Button type="submit" disabled={prueft || importiert}>{importiert ? "Wird übernommen …" : "Geprüfte Schulen übernehmen"}</Button>
      </form> : null}
    </div> : null}
    {ergebnis.fehler ? <p role="alert" className="text-sm text-destructive">{ergebnis.fehler}</p> : null}
    {ergebnis.meldung && !dateiGeaendert && ergebnis.pruefsumme === vorschau.pruefsumme ? <p role="status" className="text-sm text-primary">{ergebnis.meldung}</p> : null}
  </section>;
}
