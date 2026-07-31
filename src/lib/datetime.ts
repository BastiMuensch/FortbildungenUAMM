/**
 * Datum und Uhrzeit — deutsch formatiert, immer in Europe/Berlin.
 *
 * In der Datenbank steht alles als UTC. Jede Anzeige und jede Eingabe läuft
 * über diese Funktionen, damit es keine Zeitzonen-Verschiebung zwischen
 * Server-Rendering und Browser gibt (der Server läuft je nach Hosting in UTC).
 */

const ZEITZONE = "Europe/Berlin";

const datumFormat = new Intl.DateTimeFormat("de-DE", {
  timeZone: ZEITZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const datumZeitFormat = new Intl.DateTimeFormat("de-DE", {
  timeZone: ZEITZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const zeitFormat = new Intl.DateTimeFormat("de-DE", {
  timeZone: ZEITZONE,
  hour: "2-digit",
  minute: "2-digit",
});

const langFormat = new Intl.DateTimeFormat("de-DE", {
  timeZone: ZEITZONE,
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const monatJahrFormat = new Intl.DateTimeFormat("de-DE", {
  timeZone: ZEITZONE,
  month: "long",
  year: "numeric",
});

/** "31.07.2026" */
export function formatDatum(date: Date): string {
  return datumFormat.format(date);
}

/** "31.07.2026, 14:30" */
export function formatDatumZeit(date: Date): string {
  return datumZeitFormat.format(date);
}

/** "14:30" */
export function formatZeit(date: Date): string {
  return zeitFormat.format(date);
}

/** "Freitag, 31. Juli 2026" */
export function formatDatumLang(date: Date): string {
  return langFormat.format(date);
}

/** "Juli 2026" */
export function formatMonatJahr(date: Date): string {
  return monatJahrFormat.format(date);
}

/**
 * Zeitraum kompakt: am selben Tag "31.07.2026, 14:30 – 17:00",
 * sonst "31.07.2026, 14:30 – 01.08.2026, 12:00".
 */
export function formatZeitraum(beginn: Date, ende: Date): string {
  const gleicherTag = formatDatum(beginn) === formatDatum(ende);
  return gleicherTag
    ? `${formatDatumZeit(beginn)} – ${formatZeit(ende)} Uhr`
    : `${formatDatumZeit(beginn)} – ${formatDatumZeit(ende)} Uhr`;
}

/**
 * Wert für `<input type="datetime-local">`: "2026-07-31T14:30".
 *
 * Das Input-Element kennt keine Zeitzonen, es zeigt exakt die Ziffern, die es
 * bekommt. Deshalb werden hier die Berliner Wanduhr-Werte gebildet, nicht
 * `toISOString()` (das wäre UTC und im Sommer zwei Stunden zu früh).
 */
export function toDatetimeLocalValue(date: Date | null | undefined): string {
  if (!date) return "";

  const teile = new Intl.DateTimeFormat("sv-SE", {
    timeZone: ZEITZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  // sv-SE liefert "2026-07-31 14:30" — das Input erwartet ein "T".
  return teile.replace(" ", "T");
}

/**
 * Gegenstück: der String aus `<input type="datetime-local">` ist Berliner
 * Ortszeit ohne Zeitzonen-Angabe und wird hier nach UTC umgerechnet.
 */
export function fromDatetimeLocalValue(value: string): Date | null {
  const treffer = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value.trim());
  if (!treffer) return null;

  return berlinNachUtc(
    Number(treffer[1]),
    Number(treffer[2]),
    Number(treffer[3]),
    Number(treffer[4]),
    Number(treffer[5]),
  );
}

/**
 * Parst deutsche Schreibweise "31.07.2026 14:30" bzw. "31.07.2026".
 * Gebraucht für den FIBS-Import und für Tabellen-Importe.
 */
export function parseDeDateTime(value: string): Date | null {
  const treffer =
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[,\s]+(\d{1,2})[:.](\d{2}))?/.exec(value.trim());
  if (!treffer) return null;

  const tag = Number(treffer[1]);
  const monat = Number(treffer[2]);
  const jahr = Number(treffer[3]);
  const stunde = treffer[4] ? Number(treffer[4]) : 0;
  const minute = treffer[5] ? Number(treffer[5]) : 0;

  if (monat < 1 || monat > 12 || tag < 1 || tag > 31) return null;
  if (stunde > 23 || minute > 59) return null;

  const datum = berlinNachUtc(jahr, monat, tag, stunde, minute);

  // Rundlauf-Prüfung fängt Eingaben wie "31.02.2026" ab, die JS sonst
  // klaglos auf den 3. März weiterdreht.
  return formatDatum(datum) ===
    `${String(tag).padStart(2, "0")}.${String(monat).padStart(2, "0")}.${jahr}`
    ? datum
    : null;
}

/**
 * Berliner Wanduhrzeit → UTC-Date.
 *
 * Der Versatz (CET/CEST) hängt vom Datum selbst ab, deshalb wird er über eine
 * Probe ermittelt: erst als UTC annehmen, dann messen, wie weit Berlin an
 * diesem Zeitpunkt davon abweicht, und korrigieren.
 */
function berlinNachUtc(
  jahr: number,
  monat: number,
  tag: number,
  stunde: number,
  minute: number,
): Date {
  const alsUtc = Date.UTC(jahr, monat - 1, tag, stunde, minute);
  const versatz = zeitzonenVersatz(new Date(alsUtc));

  // Zweiter Durchlauf: an Umstellungstagen kann der erste Versatz noch der
  // der alten Zeit sein.
  const korrigiert = alsUtc - versatz;
  const versatz2 = zeitzonenVersatz(new Date(korrigiert));

  return new Date(alsUtc - versatz2);
}

/** Versatz von Europe/Berlin gegenüber UTC in Millisekunden. */
function zeitzonenVersatz(zeitpunkt: Date): number {
  const berlin = new Date(
    zeitpunkt.toLocaleString("en-US", { timeZone: ZEITZONE }),
  );
  const utc = new Date(zeitpunkt.toLocaleString("en-US", { timeZone: "UTC" }));
  return berlin.getTime() - utc.getTime();
}

/**
 * Datum als "2026-09-15" — nach Berliner Ortszeit.
 *
 * Nicht `toISOString().slice(0,10)` verwenden: Ein Termin am 15.09. um 01:00
 * Berliner Zeit ist in UTC noch der 14.09. und landete sonst im falschen
 * Kalendertag.
 */
export function berlinIsoDatum(date: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: ZEITZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Beginn des Tages (00:00 Berliner Zeit) als UTC-Date. */
export function tagesBeginn(date: Date): Date {
  const teile = new Intl.DateTimeFormat("sv-SE", {
    timeZone: ZEITZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .split("-");

  return berlinNachUtc(
    Number(teile[0]),
    Number(teile[1]),
    Number(teile[2]),
    0,
    0,
  );
}

/**
 * Aktuelles Schuljahr in bayerischer Schreibweise, z. B. "2026/2027".
 * Wechsel zum 1. August.
 */
export function aktuellesSchuljahr(heute: Date = new Date()): string {
  const jahr = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: ZEITZONE, year: "numeric" }).format(
      heute,
    ),
  );
  const monat = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: ZEITZONE, month: "numeric" }).format(
      heute,
    ),
  );

  return monat >= 8 ? `${jahr}/${jahr + 1}` : `${jahr - 1}/${jahr}`;
}

/** Zeitraum eines Schuljahres: 1. August bis 31. Juli. */
export function schuljahrZeitraum(schuljahr: string): { start: Date; ende: Date } {
  const start = Number(schuljahr.slice(0, 4));
  return {
    start: berlinNachUtc(start, 8, 1, 0, 0),
    ende: berlinNachUtc(start + 1, 7, 31, 23, 59),
  };
}
