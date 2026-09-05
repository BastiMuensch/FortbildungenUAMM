<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Projektkonventionen

- **Sprache**: Bezeichner, Kommentare und Oberfläche auf Deutsch. Fachbegriffe
  aus dem Schulbereich (SchiLf, Niveaustufe, DigCompEdu) bleiben unübersetzt.
- **Keine Prisma-Enums.** Aufzählbare Werte sind `String`-Felder mit Kommentar;
  die Werteliste steht in `src/constants/fortbildung.ts` und wird von zod
  durchgesetzt. Ein neuer Wert ist damit eine Code-Änderung, keine Migration.
- **Mutationen laufen über Server Actions** (`src/actions/`), nicht über eigene
  API-Routen. Route Handler gibt es nur für Downloads (`/api/admin/export`,
  `/api/ics`) und den Cron-Endpunkt.
- **Jede Server Action prüft die Rolle selbst** über `requireRole()`. Der Guard
  im Admin-Layout und die Prüfung in `proxy.ts` sind nur vorgelagert — Server
  Actions sind eigene Endpunkte.
- **Filter leben in `searchParams`**, nicht im Client-State. Siehe
  `src/lib/filter.ts`.
- **Eine bewusste Ausnahme von `fortbildungScope()`**: `ladeTerminumfeld()`
  (`src/actions/terminumfeld.ts`) liest über alle Veranstaltungen hinweg —
  sonst wäre Terminplanung unmöglich, weil Referenten die Termine der anderen
  nicht sähen. Im internen Planungskalender dürfen angemeldete Personen Datum,
  Uhrzeit, Ort, Titel und Beschreibung aller Termine sehen; persönliche
  Referenten-Kontaktdaten werden dort nicht ausgeliefert. Diese Ausnahme bitte
  nicht auf andere Abfragen ausweiten.
- **Nur `oeffentlicheFortbildungWhere()` entscheidet, was öffentlich sichtbar
  ist** (`src/lib/queries.ts`). Nicht in einzelnen Seiten nachbauen.
- **Datum/Uhrzeit** immer über `src/lib/datetime.ts`. In der Datenbank steht
  UTC, angezeigt wird Europe/Berlin. Kein `toISOString().slice(0,10)` für
  Kalendertage.
- **HTML aus dem Editor** immer durch `sanitizeBeschreibung()` schicken, bevor
  es gespeichert wird.
- **Keine externen Ressourcen** im Frontend (CDN, Fonts, Analytics, iframes).
  Die CSP in `next.config.ts` erlaubt sie nicht — und das ist eine
  datenschutzrechtliche Zusage, keine Stilfrage.
