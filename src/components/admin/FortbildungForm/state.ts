"use client";

import { useMemo, useState } from "react";

import { formatDatumZeitEingabe, parseDatumZeitEingabe } from "@/lib/datetime";
import { terminWarnung } from "@/lib/ferien";
import { SCHULARTEN_STANDARD } from "@/constants/fortbildung";
import type { FortbildungWerte, OrtOption } from "./types";

/**
 * Der gemeinsame Formularzustand von Wizard und Bearbeiten-Ansicht.
 *
 * Im State liegt nur, was andere Felder beeinflusst oder kein natives
 * Eingabefeld ist. Titel, Kurztitel, Fach und die FIBS-Angaben bleiben
 * uncontrolled — weniger Code, und der Browser behält die Eingaben.
 */
export function useFortbildungState(
  fortbildung: FortbildungWerte | undefined,
  orte: OrtOption[],
) {
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
  const [referenten, setReferenten] = useState<string[]>(
    fortbildung?.referentIds ?? [],
  );

  // Beginn und Ende im State, damit die Ferien-Warnung schon beim Tippen
  // erscheint und nicht erst nach dem Speichern.
  const [beginn, setBeginn] = useState(formatDatumZeitEingabe(fortbildung?.beginn));
  const [ende, setEnde] = useState(formatDatumZeitEingabe(fortbildung?.ende));

  const terminHinweis = useMemo(() => {
    const von = parseDatumZeitEingabe(beginn);
    if (!von) return null;
    const bis = parseDatumZeitEingabe(ende) ?? von;
    return terminWarnung(von, bis < von ? von : bis);
  }, [beginn, ende]);

  /**
   * Eine eSession findet online statt, eine Präsenzveranstaltung nicht. Statt
   * die falsche Kombination erst beim Speichern abzulehnen, zeigt die Auswahl
   * gleich nur die passenden Orte. Die Server Action prüft es trotzdem.
   */
  const passendeOrte = useMemo(
    () =>
      orte.filter((ort) => (format === "ESESSION" ? ort.istOnline : !ort.istOnline)),
    [orte, format],
  );

  function formatWechseln(neu: string) {
    setFormat(neu);

    if (neu === "ESESSION") {
      // Eine eSession hat genau einen möglichen Ort — der wird gesetzt, ohne
      // dass jemand ihn suchen muss. Auch dann, wenn noch gar kein Ort
      // gewählt war (neues Formular).
      setOrtId(orte.find((o) => o.istOnline)?.id ?? "");
      return;
    }

    // Zurück auf Präsenz: Der Online-Ort passt nicht mehr, ein konkreter Ort
    // muss aktiv gewählt werden.
    const bisher = orte.find((o) => o.id === ortId);
    if (bisher?.istOnline) setOrtId("");
  }

  function beginnSetzen(wert: string) {
    setBeginn(wert);
    // Ende sinnvoll vorbelegen: zwei Stunden später ist der typische
    // Zuschnitt einer regionalen Fortbildung.
    if (!ende && wert) {
      const start = parseDatumZeitEingabe(wert);
      if (start) {
        setEnde(formatDatumZeitEingabe(new Date(start.getTime() + 2 * 60 * 60 * 1000)));
      }
    }
  }

  return {
    format,
    formatWechseln,
    ortId,
    setOrtId,
    organisationsform,
    setOrganisationsform,
    status,
    setStatus,
    niveaustufe,
    setNiveaustufe,
    beschreibung,
    setBeschreibung,
    schularten,
    setSchularten,
    schlagworte,
    setSchlagworte,
    kompetenzen,
    setKompetenzen,
    referenten,
    setReferenten,
    beginn,
    beginnSetzen,
    ende,
    setEnde,
    terminHinweis,
    passendeOrte,
  };
}

export type FortbildungState = ReturnType<typeof useFortbildungState>;

/**
 * Prüft einen Wizard-Schritt clientseitig, damit „Weiter" nicht in einen
 * Schritt führt, dessen Voraussetzungen fehlen. Die Server Action prüft
 * dieselben Regeln noch einmal — das hier ist reine Bedienhilfe.
 */
export function schrittFehler(
  pflichtfelder: string[],
  zustand: FortbildungState,
  formular: HTMLFormElement | null,
): Record<string, string> {
  const fehler: Record<string, string> = {};

  const wert = (name: string): string => {
    const feld = formular?.elements.namedItem(name);
    return feld instanceof HTMLInputElement || feld instanceof HTMLTextAreaElement
      ? feld.value.trim()
      : "";
  };
  const beginn = parseDatumZeitEingabe(zustand.beginn);
  const ende = parseDatumZeitEingabe(zustand.ende);

  for (const feld of pflichtfelder) {
    switch (feld) {
      case "titel":
        if (wert("titel").length < 3) {
          fehler.titel = "Bitte einen Lehrgangstitel mit mindestens 3 Zeichen angeben.";
        }
        break;
      case "maxTn": {
        const zahl = Number(wert("maxTn"));
        if (!Number.isInteger(zahl) || zahl < 1) {
          fehler.maxTn = "Bitte eine Teilnehmerzahl von mindestens 1 angeben.";
        }
        break;
      }
      case "beginn":
        if (!beginn) {
          fehler.beginn = "Bitte Datum und Uhrzeit im Format TT.MM.JJJJ HH:MM angeben.";
        }
        break;
      case "ende":
        if (!ende) {
          fehler.ende = "Bitte Datum und Uhrzeit im Format TT.MM.JJJJ HH:MM angeben.";
        } else if (beginn && ende <= beginn) {
          fehler.ende = "Das Ende muss nach dem Beginn liegen.";
        }
        break;
      case "veranstaltungsortId":
        if (!zustand.ortId) fehler.veranstaltungsortId = "Bitte einen Ort wählen.";
        break;
      case "beschreibungHtml":
        if (zustand.beschreibung.replace(/<[^>]*>/g, "").trim().length === 0) {
          fehler.beschreibungHtml = "Bitte eine Lehrgangsbeschreibung eingeben.";
        }
        break;
      case "schularten":
        if (zustand.schularten.length === 0) {
          fehler.schularten = "Bitte mindestens eine Schulart auswählen.";
        }
        break;
      case "niveaustufe":
        if (!zustand.niveaustufe) fehler.niveaustufe = "Bitte die Niveaustufe wählen.";
        break;
      case "kompetenzen":
        if (zustand.kompetenzen.length === 0) {
          fehler.kompetenzen =
            "Bitte mindestens eine Kompetenz zuordnen — danach filtern Lehrkräfte im Frontend.";
        }
        break;
      case "referenten":
        if (zustand.referenten.length === 0) {
          fehler.referenten =
            "Bitte mindestens eine Referentin oder einen Referenten zuordnen.";
        }
        break;
      default:
        break;
    }
  }

  return fehler;
}
