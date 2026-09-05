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
- Suche über Titel, Beschreibung, Fach, Ort und Schlagworte — mehrere Wörter
  werden UND-verknüpft, jedes darf in einem anderen Feld stehen
- **Schnellzugriffe** für die häufigsten Fragen: nächste 4 Wochen, Online,
  Grundschule, Mittelschule, noch dieses Schuljahr
- Filter nach Schulart, Format, Organisationsform, Schlagwort,
  DigCompEdu-Kompetenzbereich und Niveaustufe — gesetzte Filter stehen als
  einzeln entfernbare Chips über der Liste
- **Leerzustand mit Auswegen**: Statt „kein Treffer" wird gezeigt, welcher
  einzelne Filter im Weg steht und was sein Wegfall brächte
- Detailseiten mit Link zur Anmeldung in FIBS
- Kalender-Abo (ICS) unter `/api/ics`

**Für das Medienteam** (Redaktionsbereich unter `/admin`):

- **Wizard** zum Anlegen: sechs geprüfte Schritte, damit keine Angabe liegen
  bleibt. Bearbeitet wird danach in einer Reiteransicht
- **Terminabgleich** beim Planen: Monatskalender mit allen bereits geplanten
  Veranstaltungen und Warnung bei Überschneidungen (siehe unten)
- **Nachbereitung**: nach der Veranstaltung wird die tatsächliche
  Teilnehmerzahl gemeldet
- **Aushang** als A4-PDF zum Ausdrucken, mit QR-Code zur Detailseite
- **Änderungsverlauf** je Fortbildung
- **Schuljahres-Umschalter** über Liste, Kennzahlen und Exporte
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
| `REFERENT` | **nur eigene** Fortbildungen anlegen und **zur Freigabe einreichen**, eigene Teilnehmerzahlen melden |

### Freigabe und FIBS-Status

Fortbildungen durchlaufen fünf Zustände:

```
Entwurf  →  Zur Freigabe eingereicht  →  Veröffentlicht  →  Archiviert
   ↑                    │                      │
   └── zurückgewiesen ──┘                  Abgesagt
```

Referentinnen und Referenten kommen nur bis **Eingereicht** — veröffentlicht
wird ausschließlich von der Redaktion. Eine bereits freigegebene Ausschreibung
können sie auch nicht mehr ändern; die Teilnehmerzahl melden sie weiterhin
selbst.

Unter `/admin/freigaben` liegt die Warteschlange, älteste zuerst. Freigeben
prüft dieselben Vollständigkeitsregeln wie das direkte Veröffentlichen — fehlt
etwas, fällt der Eintrag mit einer erklärenden Notiz auf Entwurf zurück.
Zurückweisen verlangt eine Begründung, die der einreichenden Person beim
Öffnen angezeigt wird.

**Der FIBS-Eintrag ist ein eigener Schritt.** Ob eine Fortbildung tatsächlich
in FIBS ausgeschrieben ist, steht im Feld `inFibs` — bewusst nicht aus der
Lehrgangsnummer abgeleitet, weil eine Nummer vorgemerkt sein kann, bevor der
Eintrag steht. Jede Fortbildung trägt im Redaktionsbereich eines von zwei
Kennzeichen:

- **in FIBS** — dort eingetragen, mit Zeitpunkt und Person festgehalten
- **nicht in FIBS** — noch nicht ausgeschrieben, Lehrkräfte können sich also
  nicht anmelden

Die Kennzeichen erscheinen in Liste, Detailansicht und beiden Exporten. Eine
Kennzahl auf dem Dashboard zählt, was veröffentlicht, aber noch nicht in FIBS
ist; der Filter „FIBS" grenzt die Liste darauf ein.

### Aushang fürs Lehrerzimmer

Jede Fortbildung lässt sich als A4-Seite ausgeben (Knopf „Aushang" in der
Detailansicht): Titel, Termin, Ort, Beschreibung, Zielgruppe, Leitung und ein
QR-Code zur öffentlichen Detailseite. Öffnet sich im Browser und ist direkt
druckbar.

**Der QR-Code ist selbst erzeugt** (`src/lib/qr.ts`) — Byte-Modus,
Reed-Solomon, alle acht Masken durchgerechnet. Keine Laufzeit-Abhängigkeit;
gestaltet mit abgerundeten Modulen und Suchern in der Hausfarbe
(`src/lib/qrZeichnen.ts`). Die Fehlerkorrektur steht auf **H (rund 30 %)`,
damit das Logo in der Mitte nichts zerstört.

> Ein selbst gebauter QR-Encoder ohne Gegenprobe wäre fahrlässig — ein Fehler
> in der Reed-Solomon-Rechnung fällt sonst erst auf, wenn im Lehrerzimmer
> niemand scannen kann. `npm test` erzeugt deshalb echte Codes und liest sie
> mit `jsqr` (reine Entwicklungs-Abhängigkeit) zurück, inklusive Nachweis,
> dass die Logo-Aussparung die Lesbarkeit nicht kostet. Genau diese Prüfung
> hat während der Entwicklung zwei Fehler gefunden.

**Logo:** Erwartet wird `public/logo.png` (oder `.jpg`). Fehlt die Datei, wird
der Code ohne Logo gezeichnet — bewusst kein Platzhalterbild, ein falsches
Logo auf einem amtlichen Aushang wäre schlimmer als gar keins.

### Änderungsverlauf

Am Ende jeder Detailseite steht, wer wann was gemacht hat: angelegt,
eingereicht, freigegeben, zurückgewiesen, FIBS-Eintrag gesetzt, Teilnehmerzahl
gemeldet. Die Daten stammen aus dem Protokoll, das ohnehin für die
Rechenschaftspflicht geschrieben wird (Art. 5 Abs. 2 DSGVO).

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
2. **Impressum und Datenschutzerklärung** — Platzhalter. Unter `/admin/texte`
   durch die geprüften Fassungen ersetzen.
3. **Schulferien** — siehe unten.
4. **FIBS-Import** — siehe unten.

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
  **nicht** berechenbar. Gepflegt sind die Schuljahre **2025/2026** bis
  **2029/2030**, einschließlich der Sommerferien 2030 bis zum **09.09.2030**.
  Grundlage ist die amtliche Ferienordnung (BayMBl. 2022 Nr. 747), abgeglichen
  am 01.09.2026.

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

## DigCompEdu Bavaria

Der Seed unter `prisma/seed-data/digcomp.ts` enthält alle sechs amtlichen
Kompetenzbereiche und alle **22 Teilkompetenzen** samt Kurzbeschreibungen. Die
Bezeichnungen wurden am 01.09.2026 mit der offiziellen Fassung des Bayerischen
Staatsministeriums abgeglichen; es gibt keine vorläufigen Einträge mehr. Die
Niveaustufen entsprechen der FIBS-Gruppierung **I/II**, **III/IV** und
**V/VI**; ältere Einzelwerte III oder IV werden durch die Datenmigration in
III/IV zusammengeführt.

## Datum und Zeitzone

Alle Zeitpunkte liegen in PostgreSQL als `TIMESTAMPTZ(3)` vor und werden als
UTC-Zeitpunkte verarbeitet. Anzeige, Formulare, Dateinamen und Kalendertage
werden ausschließlich über `src/lib/datetime.ts` in `Europe/Berlin`
umgerechnet. Die Migration auf `TIMESTAMPTZ` interpretiert bestehende
`TIMESTAMP`-Werte ausdrücklich als UTC, damit sich vorhandene Termine nicht
verschieben.

## FIBS-Import

Vorbereitet unter `src/lib/fibs/`, standardmäßig **abgeschaltet**
(`FIBS_IMPORT_ENABLED=false`).

Eine offizielle FIBS-Schnittstelle steht dem Schulamt nach eigener Anfrage
nicht zur Verfügung. Angeboten wird lediglich eine Einbettung per iframe. Die
Anwendung nutzt diese bewusst nicht: Ein iframe würde eine Verbindung zu einem
Drittdienst in das öffentliche Frontend bringen, die CSP und die zugesagte
Datensparsamkeit aufweichen und sich kaum in Suche, Filter und Freigabeworkflow
integrieren lassen. Deshalb bleibt FIBS das verbindliche Anmeldesystem und wird
von jeder Ausschreibung gezielt verlinkt.

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

### Fertiges Container-Image aus GitHub

Bei jedem Push auf `main` baut `.github/workflows/container.yml` ein
Multi-Arch-Image für AMD64 und ARM64 und veröffentlicht es unter:

```text
ghcr.io/bastimuensch/fortbildungenuamm:latest
```

Zusätzlich gibt es für jeden Stand ein unveränderliches Tag in der Form
`sha-<commit>`. Git-Tags wie `v1.2.3` erzeugen außerdem die Image-Tags `1.2.3`
und `1.2`.

Ist das GHCR-Paket privat, muss sich der Server einmal mit einem GitHub-Token
mit der Berechtigung `read:packages` anmelden:

```bash
echo "$GHCR_TOKEN" | docker login ghcr.io -u BastiMuensch --password-stdin
```

Für den Produktionsbetrieb genügt danach:

```bash
docker compose pull app
docker compose up -d --no-build
```

Die App wendet beim Start automatisch alle Prisma-Migrationen an. Das
PostgreSQL-Volume `pgdaten` bleibt beim Austausch des App-Containers erhalten.

Danach einmalig die Stammdaten und den ersten Admin aus der `.env` einspielen:

```bash
set -a
. ./.env
set +a

docker compose exec \
  -e "SEED_ADMIN_EMAIL=$SEED_ADMIN_EMAIL" \
  -e "SEED_ADMIN_PASSWORD=$SEED_ADMIN_PASSWORD" \
  -e "SEED_ADMIN_NAME=$SEED_ADMIN_NAME" \
  app npx prisma db seed

unset SEED_ADMIN_EMAIL SEED_ADMIN_PASSWORD SEED_ADMIN_NAME
```

Der App-Container hört intern weiterhin auf Port `3000`; Docker veröffentlicht
ihn auf dem Server über Host-Port `3001`. Für Newt/Pangolin ist deshalb das
interne Ziel `http://192.168.1.56:3001`. Nach außen gehört weiterhin ein Reverse
Proxy mit TLS davor. HSTS ist gesetzt, die Anwendung geht also von HTTPS aus.
In `NEXT_PUBLIC_BASE_URL` muss die öffentlich sichtbare HTTPS-Adresse stehen,
nicht das interne Newt/Pangolin-Ziel.

Die Portzuordnung ist direkt in `docker-compose.yml` hinterlegt. Eine lokale
`docker-compose.override.yml` ist für den Betrieb auf Port `3001` nicht nötig.

Für ein späteres Update muss auf dem Server kein Node.js-Build mehr laufen:

```bash
docker compose pull app
docker compose up -d --no-build
docker compose logs --tail=100 app
```

Soll das Image ausnahmsweise direkt auf dem Server gebaut werden, bleibt dies
weiterhin möglich:

```bash
docker compose up -d --build
```

## Lizenz

Noch nicht festgelegt.
