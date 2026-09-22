# Schulverzeichnis für das Fortbildungsportal aufbereiten

## Angaben für den Auftrag

- Schulamt: [Name des Schulamts einsetzen]
- Schularten: [gewünschte Schularten einsetzen]
- Grundlage: Offizielles Verzeichnis der Grundschulen, Mittelschulen und privaten Volksschulen der Regierung von Schwaben:
  https://www.regierung.schwaben.bayern.de/fachverfahren/schulverzeichnisse/grundschulen/index.php
- Stand des Verzeichnisses: [Datum einsetzen, falls bekannt]

## Arbeitsauftrag an die KI

Erstelle aus dem oben verlinkten amtlichen Schulverzeichnis eine importierbare
CSV-Datei für die gewünschten Schularten des angegebenen Schulamts. Verwende nur
nachprüfbare Angaben aus der Quelle. Erfinde keine Schulen, Schulnummern oder
Adressen. Wenn du einen Link nicht abrufen kannst, fordere die Quelldatei an.
Verarbeite nur Schulen des angegebenen Schulamts. Bei mehreren Schulämtern
erstelle je Schulamt eine getrennte Datei; ergänze den Schulamtsnamen im
Dateinamen, nicht als zusätzliche CSV-Spalte. Unklare Zuständigkeiten separat
zur Prüfung auflisten und diese Schulen vorerst aus der CSV weglassen.

Die Datei muss in UTF-8 gespeichert sein. Nutze Semikolon als Trennzeichen
und genau diese Kopfzeile, ohne weitere Spalten:

```csv
schulnummer;name;strasse;ort
```

- Eine Zeile pro Schule. Name und Ort müssen ausgefüllt sein.
- `schulnummer`: amtliche Schulnummer als Text, einschließlich führender
  Nullen. Keine Excel-Formel, kein vorangestelltes Apostroph. Wenn unbekannt,
  Feld leer lassen. Höchstens 20 Zeichen. Verschiedene Schulnummern nicht zusammenführen.
- `name`: vollständiger amtlicher Schulname (höchstens 150 Zeichen).
- `strasse`: Straße und Hausnummer, sofern bekannt (höchstens 150 Zeichen).
- `ort`: Ortsname ohne Postleitzahl (höchstens 100 Zeichen). Schreibweise
  innerhalb der Datei und gegenüber vorhandenen Daten konsistent halten.
- Keine Online-Veranstaltungsorte, Kontaktdaten oder Personennamen als eigene
  Datensätze. Keine Beispielschulen oder Platzhalterzeilen.
- Semikolons in Feldinhalten sind erlaubt, wenn das gesamte Feld in doppelte
  Anführungszeichen gesetzt ist. Anführungszeichen im Feld verdoppeln.
- Keine Zeilenumbrüche in einem Feld. Keine Markdown-Codeblöcke oder
  Erläuterungen in der fertigen Datei.
- Höchstens 500 Schulen und 128 KB pro Datei; größere Verzeichnisse in
  mehrere Dateien mit jeweils gleicher Kopfzeile aufteilen.

Prüfe vor der Ausgabe doppelte Schulnummern und doppelte Kombinationen aus
Name und Ort. Unklare Fälle nicht erraten: als Rückfrage außerhalb der CSV
auflisten. Quellen und Abrufdatum ebenfalls getrennt von der CSV nennen.

## Nach der Erstellung

Die Datei im Fortbildungsportal unter „Veranstaltungsorte“ (oder als RvS im
Installationsassistenten unter „Schulen“) auswählen
und „Vorschau erstellen“ aufrufen. Erst nach Prüfung der angezeigten
Änderungen „Geprüfte Schulen übernehmen“ wählen.

Der Import ordnet vorhandene Schulen zuerst anhand der Schulnummer zu,
sonst anhand von Name und Ort. Bei Umbenennungen daher möglichst die
Schulnummer mitliefern. Leere optionale Felder erhalten bestehende Angaben.
Nicht aufgeführte Schulen werden nicht entfernt. Stillgelegte Schulen werden
nicht automatisch aktiviert. Änderungen an vorhandenen Orten gelten auch
für bereits damit verknüpfte Veranstaltungen.

Die Schulen werden in das gemeinsame Veranstaltungsortverzeichnis aufgenommen.
Diese CSV weist weder Benutzer noch Fortbildungen einem Schulamt zu; der
Ausschreibungsbezirk wird später an der jeweiligen Fortbildung festgelegt.
