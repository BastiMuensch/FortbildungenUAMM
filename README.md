# Fortbildungen Schulamt Memmingen-Unterallgäu

Web-Anwendung zur Erfassung, Bewerbung und Darstellung von Lehrerfortbildungen
des Staatlichen Schulamts im Landkreis Unterallgäu und in der Stadt Memmingen.
Ersetzt die bisherige Tabellenlösung und orientiert sich an der Feldlogik von
FIBS sowie am Kompetenzrahmen DigCompEdu Bavaria.

**Wichtig zum Zuschnitt:** Die Anwendung verwaltet das Fortbildungs*angebot*.
Die verbindliche **Anmeldung läuft weiterhin über FIBS** — es werden keine
personenbezogenen Daten von teilnehmenden Lehrkräften gespeichert.

## Was die Anwendung kann

Fortbildungen sind nach den drei bayerischen Ebenen gegliedert: **SchiLf**
(schulintern), **RLFB** (regional, über FIBS ausgeschrieben) und **ALP**
(zentral, Dillingen). Diese Gliederung zieht sich durch Farbgebung, Filter
und Berichte.

**Für Lehrkräfte** (öffentlich, ohne Anmeldung):

- Übersicht der kommenden Fortbildungen
- Monatskalender mit bayerischen Ferien und Feiertagen
- Suche über Titel, Beschreibung, Fach und Ort
- Filter nach Schulart, Format, Organisationsform, Schlagwort,
  DigCompEdu-Kompetenzbereich und Niveaustufe
- Detailseiten mit Link zur Anmeldung in FIBS
- Kalender-Abo (ICS) unter `/api/ics`

**Für das Medienteam** (Redaktionsbereich unter `/admin`):

- **Wizard** zum Anlegen: sechs geprüfte Schritte, damit keine Angabe liegen
  bleibt. Bearbeitet wird danach in einer Reiteransicht
- **Terminabgleich** beim Planen: Monatskalender mit allen bereits geplanten
  Veranstaltungen und Warnung bei Überschneidungen (siehe unten)
- **Nachbereitung**: nach der Veranstaltung wird die tatsächliche
  Teilnehmerzahl gemeldet
- Listenansicht getrennt nach SchiLf, RLFB, ALP und Entwürfen
- Duplizieren wiederkehrender Formate
- **Excel-Export** und **PDF-Bericht** (nach Ebenen gegliedert, mit Summen)
- Verwaltung von Referenten, Schlagworten und Veranstaltungsorten
- Vorbereiteter FIBS-Import mit Trockenlauf

**Rollen:**

| Rolle | Darf |
|---|---|
| `ADMIN` | alles, inkl. Benutzerzugänge, Löschen, Rechtstexte, FIBS-Übernahme |
| `REDAKTEUR` | Fortbildungen und Stammdaten pflegen, FIBS-Trockenlauf |
| `REFERENT` | **nur eigene** Fortbildungen anlegen und pflegen, eigene Teilnehmerzahlen melden |

### Terminabgleich

Beim Anlegen und Bearbeiten zeigt das Formular unter den Datumsfeldern den
Monat mit allen bereits geplanten Veranstaltungen sowie die Termine des
gewählten Tages. Überschneidungen werden in zwei Stufen gemeldet:

| Stufe | Fall |
|---|---|
| **Konflikt** (rot) | Der Ort ist zur selben Zeit schon belegt |
| **Konflikt** (rot) | Eine gewählte Referentin oder ein Referent ist am selben Tag schon gebucht |
| **Hinweis** (gelb) | Am selben Tag läuft eine andere Veranstaltung — auch ohne Zeitüberschneidung, weil beide um dieselben Lehrkräfte konkurrieren |

Beides sind Warnungen, keine Sperren: Ein bewusst parallel angesetztes Angebot
für eine andere Schulart kann sinnvoll sein.

Der Abgleich liest bewusst **über alle Veranstaltungen hinweg**, auch über die
anderer Personen — sonst könnten Referenten nicht planen. Veröffentlichte
Termine stehen ohnehin öffentlich im Frontend; fremde **Entwürfe** erscheinen
nur als belegter Zeitraum ohne Titel und ohne Verlinkung. Der Sonderfall ist
in `src/actions/terminumfeld.ts` dokumentiert; ein Online-Ort (ViKo) kollidiert
nie, der lässt sich beliebig oft parallel belegen.

Referentinnen und Referenten bekommen ihren Zugang über einen Einladungslink,
den die Administration im Referentenverzeichnis erzeugt und weitergibt — es
ist bewusst **kein Mailserver** eingerichtet, statt einen vorzutäuschen.
Der Link ist einmalig verwendbar und läuft nach 14 Tagen ab.

## Technik

| Baustein | Wahl |
|---|---|
| Framework | Next.js 16 (App Router, React 19, TypeScript) |
| Styling | Tailwind CSS v4, shadcn-Komponenten auf `@base-ui/react` |
| Datenbank | PostgreSQL 16 über Prisma |
| Validierung | zod — ein Schema für Formular und Server Action |
| Mutationen | Server Actions (kein eigenes API-Backend) |
| Anmeldung | JWT im httpOnly-Cookie (`jose`), Passwort-Hash mit bcrypt |
| Rich-Text | Tiptap, serverseitig auf eine Element-Allowlist gefiltert |
| Export | ExcelJS (XLSX), eigener ICS-Feed |

> Dieses Projekt läuft auf einer Next.js-Fassung mit Abweichungen vom
> Trainingswissen gängiger Assistenten. Vor Änderungen an Next-spezifischem
> Code die lokale Dokumentation unter `node_modules/next/dist/docs/` lesen —
> siehe `AGENTS.md`. Bekannt: Die frühere `middleware.ts` heißt in Next 16
> **`proxy.ts`**.

## Einrichtung

Voraussetzung: Node.js 22+ und ein erreichbares PostgreSQL 16.

```bash
npm install
cp .env.example .env
```

In der `.env` mindestens setzen:

- `DATABASE_URL`
- `JWT_SECRET` — erzeugen mit `openssl rand -base64 48`
- `SEED_ADMIN_EMAIL` und `SEED_ADMIN_PASSWORD`

Datenbank anlegen und befüllen:

```bash
createdb fortbildungen_uamm
npm run db:migrate
npm run db:seed
npm run dev
```

Die Anwendung läuft dann auf <http://localhost:3000>, der Redaktionsbereich
unter `/admin` (Anmeldung mit den Seed-Zugangsdaten — **Passwort danach
ändern**).

### Nützliche Skripte

| Befehl | Zweck |
|---|---|
| `npm run dev` | Entwicklungsserver |
| `npm run build` | Produktionsbau |
| `npm run typecheck` | TypeScript prüfen |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Migration erzeugen und anwenden |
| `npm run db:seed` | Stammdaten einspielen (idempotent) |
| `npm run db:studio` | Prisma Studio |

## Was vor dem Produktivbetrieb noch zu tun ist

1. **Veröffentlichungspflichten** — Niveaustufe, mindestens eine
   DigCompEdu-Kompetenz und mindestens ein Referent sind Pflicht, sobald eine
   Fortbildung veröffentlicht wird. Als **Entwurf** lässt sich jederzeit
   unvollständig zwischenspeichern; sonst ginge angefangene Arbeit verloren.
   Zu ändern in `VEROEFFENTLICHUNGS_PFLICHTEN`
   (`src/lib/validation/fortbildung.ts`).
2. **Referenten dürfen selbst veröffentlichen.** Ein Freigabe-Schritt durch
   die Redaktion ist bewusst nicht eingebaut — jede Änderung steht aber im
   Protokoll. Falls gewünscht, wäre das ein zusätzlicher Status zwischen
   Entwurf und Veröffentlicht.
3. **DigCompEdu** — Kompetenzbereich 1 ist vollständig hinterlegt. Die
   Unterkompetenzen der Bereiche 2–6 tragen die Titel des DigCompEdu-Rahmens,
   sind aber als „vorläufig" markiert; Formulierungen mit der offiziellen
   bayerischen Fassung abgleichen (`prisma/seed-data/digcomp.ts`).
4. **Impressum und Datenschutzerklärung** — Platzhalter. Unter `/admin/texte`
   durch die geprüften Fassungen ersetzen.
5. **Schulferien** — siehe unten.
6. **FIBS-Import** — siehe unten.

Die **Veranstaltungsorte** entsprechen dem Schulverzeichnis des Schulamts
(52 Grund- und Mittelschulen, Stand 31.07.2026, Quelle in
`prisma/seed-data/orte.ts` dokumentiert) und sind unter `/admin/orte`
pflegbar.

## Bayerische Ferien und Feiertage

`src/lib/ferien.ts` enthält beides:

- **Feiertage** werden berechnet (Gaußsche Osterformel, davon abgeleitet
  Karfreitag, Ostermontag, Christi Himmelfahrt, Pfingstmontag, Fronleichnam;
  dazu die festen bayerischen Feiertage und der unterrichtsfreie Buß- und
  Bettag). Das gilt unbegrenzt in die Zukunft.
- **Schulferien** werden je Schuljahr behördlich festgelegt und sind daher
  **nicht** berechenbar. Gepflegt sind die Schuljahre **2025/2026** und
  **2026/2027**, also bis zum **13.09.2027**.

Fällt ein Termin in Ferien, auf einen Feiertag oder aufs Wochenende, zeigt das
Erfassungsformular direkt beim Eingeben eine Warnung — bewusst als Hinweis,
nicht als Sperre: Ein Studientag in den Ferien kann gewollt sein, ein
Zahlendreher im Datum nicht. Im Kalender sind Ferientage und Feiertage
farblich hinterlegt.

Liegt ein Datum jenseits des gepflegten Zeitraums, sagt die Anwendung das
ausdrücklich, statt stillschweigend „keine Ferien" anzunehmen.

**Zum Nachpflegen:** Sobald das Staatsministerium neue Termine veröffentlicht
(<https://www.km.bayern.de/termine/ferien-und-feiertage>), das Schuljahr in
`FERIEN_NACH_SCHULJAHR` in `src/lib/ferien.ts` ergänzen. Mehr ist nicht nötig —
Kalender, Warnung und Hinweistexte ziehen automatisch nach.

## FIBS-Import

Vorbereitet unter `src/lib/fibs/`, standardmäßig **abgeschaltet**
(`FIBS_IMPORT_ENABLED=false`).

So funktioniert es:

1. Unter `/admin/schlagworte` markieren, mit welchen Begriffen gesucht wird.
2. Unter `/admin/import` einen **Trockenlauf** starten. Die Vorschau zeigt, was
   angelegt oder aktualisiert würde — geschrieben wird nichts.
3. Erst das ausdrückliche Häkchen „Treffer wirklich übernehmen" schreibt
   (nur mit Administrationsrechten). Übernommene Lehrgänge landen als
   **Entwurf**, nicht direkt im Frontend.

Schutzregeln: Deduplizierung über die Lehrgangsnummer; ein Datensatz, den die
Redaktion selbst angelegt hat (`quelle = MANUELL`), wird **nie** überschrieben;
jeder Lauf wird protokolliert.

> **Rechtlicher Hinweis.** Automatisiertes Auslesen von FIBS kann den
> Nutzungsbedingungen des Bayerischen Staatsministeriums bzw. der ALP Dillingen
> widersprechen. Vor dem Scharfschalten die Nutzungsbedingungen prüfen — die
> `robots.txt` prüft die Anwendung selbst und bricht bei einem Verbot ab.
> Besser als das Auslesen der Webseite ist eine offizielle Exportmöglichkeit;
> danach sollte bei der ALP gefragt werden. Die Architektur ist so geschnitten,
> dass dafür nur `src/lib/fibs/client.ts` und `parser.ts` getauscht werden.
>
> Solange der Import aus ist, arbeitet der Trockenlauf mit der Beispieldatei
> `src/lib/fibs/fixtures/suchergebnis.html`. Damit lässt sich die ganze Kette
> testen, ohne FIBS anzufassen.

## Datenschutz

Die Anwendung ist auf Datensparsamkeit ausgelegt:

- **Keine Teilnehmerdaten.** Anmeldung läuft über FIBS.
- **Referentinnen und Referenten** sind die einzigen personenbezogenen Daten
  neben den Redaktionszugängen. E-Mail, Telefon und Notizen sind Innendaten und
  werden nie an das Frontend ausgeliefert (`src/lib/queries.ts`). Ob der Name
  öffentlich erscheint, steuert ein Schalter je Person.
- **Keine Drittdienste.** Schriften werden selbst gehostet, es gibt kein
  Analytics, keine CDNs, keine eingebetteten Inhalte. Durchgesetzt über die
  Content-Security-Policy in `next.config.ts` (`default-src 'self'`).
- **Kein Cookie-Banner nötig** — es gibt nur ein technisch notwendiges
  Sitzungs-Cookie für den Redaktionsbereich.
- **Löschkonzept** (`src/lib/retention.ts`): Fortbildungen nach zwei Jahren
  archiviert, Referentenzuordnungen nach fünf Jahren aufgelöst, Protokolle nach
  zwölf Monaten gelöscht. Läuft automatisch (`src/lib/scheduler.ts`), Zeitpunkt
  des letzten Laufs unter `/admin/texte` einsehbar.
- **Protokollierung** von Anlegen, Ändern, Löschen, Anmeldung und Import
  (Rechenschaftspflicht, Art. 5 Abs. 2 DSGVO) — bewusst ohne Kopie der Daten
  selbst.

Alternativ zum eingebauten Zeitgeber lässt sich der Löschlauf extern anstoßen:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cron/cleanup
```

## Betrieb

```bash
docker compose up -d --build
```

Danach einmalig die Stammdaten einspielen:

```bash
docker compose exec app npx prisma db seed
```

Die Anwendung bindet sich an `127.0.0.1:3000`; davor gehört ein Reverse Proxy
mit TLS (nginx, Caddy). HSTS ist gesetzt, die Anwendung geht also von HTTPS aus.

## Lizenz

Noch nicht festgelegt.
