# Betrieb für Schwaben

Die Anwendung verwaltet einen gemeinsamen öffentlichen Kalender. Jede Fortbildung
hat genau einen Ausschreibungsbezirk. BdBs (`ADMIN`) und Redaktionskonten sehen
nur ihre zugeordneten Bezirke. Referentinnen und Referenten können nur für die
an ihrem Referenteneintrag zugeordneten Bezirke ausschreiben. Die RvS (`RVS`)
hat den Gesamtzugriff und verwaltet Bezirke sowie BdB-Zuständigkeiten.

## Migration des bisherigen UAMM-Bestands

Die Migration `20260922090000_bezirke` legt den festen Legacy-Bezirk
`00000000-0000-4000-8000-000000000001` mit dem Namen
„Memmingen-Unterallgäu“ an. Bestehende Fortbildungen, Referenten,
Registrierungslinks sowie ADMIN- und REDAKTEUR-Konten werden diesem Bezirk
zugeordnet. Die Pflichtschlagworte aus dem bisherigen Schulamtsprofil werden übernommen;
ohne gespeichertes Profil gelten `UAMM` und `Medienteam-UAMM` als Ausgangswerte.

Als einmaliger Bootstrap wird das älteste aktive ADMIN-Konto zur RvS
hochgestuft. Weitere ADMIN-Konten bleiben BdBs. Vor dem Einspielen sollte
geprüft werden, ob dieses älteste Konto tatsächlich die RvS-Verantwortung
übernehmen soll; bei abweichendem Bedarf ist die Rolle nach der Migration in
der Datenbank gezielt zu korrigieren. Der Seed-Zugang wird ebenfalls als RvS
angelegt.

## Einladungen

Die RvS weist BdBs einen oder mehrere Bezirke zu. BdBs erstellen die
Registrierungslinks für jeweils einen ihrer Bezirke. Ein Registrierungslink
ordnet neue Referenten diesem Bezirk zu; ein bestehendes Konto erhält bei einer
weiteren Einladung eine zusätzliche Bezirkszuordnung statt eines zweiten
Kontos.

## Gemeinsamer Auftritt und bestehende Funktionen

Name, Region und öffentliche Texte werden von der RvS unter Einrichtung für die
gemeinsame Plattform angepasst. Die zusätzliche Migration
`20260922140000_schwaben_auftritt` ersetzt unveränderte UAMM-Standardwerte im
gespeicherten Profil durch den Schwaben-Auftritt. Individuell angepasste Felder,
Rechtstexte, Pflichtschlagworte und Kalenderkennungen bleiben erhalten.
Auch ohne gespeichertes Profil zeigt der öffentliche Auftritt Schwaben.
Pflichtschlagworte werden je Bezirk unter Bezirke und BdBs gepflegt.

Die öffentliche Übersicht und der Monatskalender zeigen veröffentlichte Angebote
aller Bezirke und können nach Bezirk gefiltert werden. Der interne Planungskalender
behält die dokumentierte Ausnahme für Zeit, Ort, Titel und Beschreibung fremder
Termine; Kontaktangaben und fremde Verwaltungsseiten sind darüber nicht erreichbar.
Globale Rechtstexte, Systemeinstellungen und FIBS-Import verwaltet die RvS.
Beim Import ist ein Zielbezirk ausdrücklich auszuwählen.

## Katalog, Berichte und Schulen

Fortbildungskatalog, Auswertung und sämtliche zugehörigen Excel-/PDF-Exporte
berücksichtigen die Bezirksrechte auch bei direkt aufgerufenen Download-URLs.
BdBs erhalten nur die zugeordneten Schulämter, Referenten zusätzlich nur ihre
eigenen Veranstaltungen. Die RvS sieht ohne Bezirksfilter alles und kann einzelne
Schulämter auswählen. Berichte nennen den Bereich und das Schulamt der Einträge;
der PDF-Bericht gliedert nach Schulamt, die Excel-Auswertung enthält bei mehreren
Schulämtern eine zusätzliche Kennzahlenübersicht.

Unter **Veranstaltungsorte → Schulen per CSV importieren** stehen die leere
`public/vorlagen/schulen.csv` und die bearbeitbare, kopierbare Promptvorlage
`public/vorlagen/schulen-ki-auftrag.md` bereit. Je Schulamt eine Datei aus einem
amtlichen Verzeichnis erstellen, die Vorschau prüfen und erst dann übernehmen.
Die vier Spalten sind `schulnummer;name;strasse;ort`; Name und Ort sind Pflicht.
Schulnummern bleiben Text, damit führende Nullen erhalten bleiben.

Der Schulimport pflegt das gemeinsame Ortsverzeichnis. Die CSV selbst weist keine
Fortbildungen oder Konten einem Bezirk zu. Vorhandene Orte werden anhand von
Schulnummer beziehungsweise Name und Ort zugeordnet; leere optionale Angaben
löschen nichts, und fehlende Schulen werden nicht entfernt.

## Prüfungen und Inbetriebnahme

`npm test`, `npm run typecheck`, `npm run lint` und `npm run build` prüfen die Anwendung.
Zusätzlich prüfen `scripts/bezirkeIntegrationPruefungen.ts` und
`scripts/bezirkeActionsPruefungen.cjs` sowie `scripts/bezirkeExportPruefungen.cjs`
die Rechte mit einer isolierten lokalen
PostgreSQL-Testdatenbank auf Port 54329. Diese Tests sind nicht Teil der normalen
Testkette und verweigern den Zugriff auf andere Datenbanken.

Zur Inbetriebnahme die reguläre Prisma-Migration und Client-Generierung ausführen
(`npm run db:deploy`, `npm run db:generate`), anschließend den Dienst neu starten.
Die RvS legt weitere Bezirke an und lädt deren BdBs ein. Bestehende Daten bleiben
im bisherigen Bezirk; die Anpassung wurde nicht automatisch produktiv eingespielt.
