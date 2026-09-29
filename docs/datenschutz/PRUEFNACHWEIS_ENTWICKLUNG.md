# Technischer Prüfnachweis vom 24 September 2026

Dieser Nachweis beschreibt Prüfungen des lokalen Projektstands. Er ersetzt weder die behördliche Freigabe noch den Nachweis des Betriebs auf dem Netcup-Server.

## Erfolgreich geprüft

- Alle 19 bisherigen Migrationen auf einer frischen, leeren PostgreSQL-Testdatenbank angewandt. Für den Vollbackup-Test wurde Migration 19 auf eine nach Migration 18 vorbereitete Testdatenbank angewandt. Keine produktive Migration ausgeführt.
- Ergänzung vom 28.09.2026 zur Entfernung der Referententelefonnummer: Auf einer isolierten lokalen PostgreSQL-16-Testdatenbank wurden die ersten 19 Migrationen angewandt, ein synthetischer Referent mit Telefonnummer angelegt und anschließend Migration 20 ausgerollt. Die SQL-Prüfung bestätigte, dass die Spalte `telefon` entfernt wurde, während Name und E-Mail erhalten blieben. `npm run test:namensfreigabe` bestätigte außerdem, dass Legacy-Formulardaten für Telefon ignoriert und interne Notizen nicht veröffentlicht werden. Typecheck, ESLint, `npm test` und `npm run build -- --webpack` waren erfolgreich. Die Testdatenbank wurde anschließend gelöscht; Produktionsdatenbank und Produktivserver blieben unberührt.
- TypeScript-Typprüfung, ESLint und Prüfung auf fehlerhafte Patch-Formatierung.
- Produktionsbuild mit `npm run build -- --webpack` erfolgreich. Die Schriftdateien liegen samt Lizenz lokal im Projekt; beim Build werden keine Google Fonts mehr abgerufen. Der zunächst verwendete Turbopack-Build kam in dieser Umgebung nicht zum Abschluss.
- Bestehende Fachtests einschließlich Datumsberechnung, HTML-Bereinigung, Auswertung, Excel und Einrichtung.
- Öffentliche Namensfreigabe: Registrierung mit und ohne Zustimmung, Widerruf, Bereichsschutz, Kalenderfeed und PDF-Ausgabe.
- Schuljahr und Frist: Berliner Mitternacht am 1. August, Schaltjahr, SQL- und Anwendungsberechnung, Zugriff bis unmittelbar vor und Sperre ab Fristablauf. Direkte Manipulation der abgeleiteten Frist verlängert sie nicht; bestehende Termine können nicht in ein anderes Schuljahr verschoben werden.
- Berechtigungen: BdB-Zugriff auf eigenen Bezirk, bezirksübergreifender RvS-Zugriff, Ausschluss abgelaufener Daten in Auswertung und Excel. Die begrenzte Ausnahme des Planungskalenders liefert keine internen Nachbereitungsnotizen.
- Archiv: fremder Bezirk gesperrt, Nachfrist nur durch RvS, ZIP-Download mit passender SHA-256-Prüfsumme und reproduzierbaren Bytes, Entschärfung von Tabellenformeln, Entwertung alter Übergaben bei Datenänderungen, wiederholbare Bestätigung, Löschung erst nach bestätigter Übergabe. Daten ohne Nachweis werden nicht gelöscht und bleiben für reguläre Zugriffe gesperrt.
- MFA: TOTP-Testvektor, verschlüsselte Geheimnisse, echter Passwortlogin, eingeschränkte Einrichtungssitzung, Wechsel des Einrichtungsschlüssels, Aktivierung, einmalige Wiederherstellungscodes, Replay-Sperre und Sitzungswiderruf. Direkte Downloads sind vor vollständiger MFA gesperrt.
- Import: historische Neueinträge, abgelaufene Bestandsdaten und nachträgliche Schuljahrwechsel werden abgewiesen; konkurrierende Schreibzugriffe können den Fristschutz nicht umgehen.
- Vollbackup-Integration: Mit age 1.2.1 und PostgreSQL 16 wurde die gesamte synthetische Testdatenbank gesichert, als verschlüsseltes ZIP einschließlich Betriebskonfiguration verpackt und mit `test-vollbackup-wiederherstellung.sh` in eine getrennte lokale Testdatenbank wiederhergestellt. Eine Datenkonto-SQL-Kontrolle bestätigte den Inhalt. Geprüft wurden außerdem Rollengrenzen und MFA, Prüfsumme und ausdrückliche Bestätigung, Fristen 29/30, Symlink-Ablehnung, Bereinigung, echter age-Fehler sowie Berliner Mitternacht und Sommerzeitumstellung. Ausführung: `npm run test:datensicherung:db`.
- TOM und VVT Version 0.4: je sieben Word-Seiten gerendert und vollständig visuell geprüft.

- UI-Audit mit synthetischen Daten: Desktopansicht sowie ausgewählte mobile Ansichten bei 360/320 Pixeln, Anmeldung mit MFA, Backup-Erstellung und Formularzustände, Menübedienung, öffentliche Suche und Kalender. Ergebnisse und Korrekturen: `../UI_AUDIT_2026-09-24.md`.
- Eine gesonderte Windows-CI-Prüfung für Kopie, SHA-256, Empfangsquittung und Bereinigung auf einer ausschließlich lokalen Test-SMB-Freigabe ist vorbereitet. Sie wurde in dieser macOS-Umgebung nicht ausgeführt.

## Erneute Prüfung vor dem Push am 29. September 2026

- ESLint, TypeScript, `npm test`, MFA-, Importfrist-, Backup-, Datensicherungs- und Vollbackup-Betriebsprüfungen erneut erfolgreich.
- Alle 20 Migrationen auf einer neuen, isolierten lokalen PostgreSQL-16-Instanz angewandt. Namensfreigabe einschließlich PDF-Ausgabe, Datenschutz-/Bezirksrechte, Archiv und MFA mit Datenbank erneut erfolgreich geprüft.
- Mit age 1.2.1 einen echten PostgreSQL-Dump verschlüsselt und in eine zweite lokale Testdatenbank wiederhergestellt; auch Rollen, MFA, Prüfsummen, Ablagebestätigung, Fristen und Fehlerpfad erfolgreich geprüft. Die Testinstanz anschließend beendet.
- Produktionsbuild sowohl mit Webpack als auch mit dem Standard-Turbopack erfolgreich. Turbopack meldet zwei Warnungen wegen weit gefasster Dateiverfolgung aus `src/lib/datensicherung.ts`; der Build bricht nicht ab.
- Fehlende MFA-Umgebungsvariable im Container-Workflow ergänzt, Startanleitung an MFA und lokale Portbindung angepasst; Python-Cachedateien werden nicht versioniert.
- Windows-/SMB-Ausführung und vollständiger Docker-Image-Bau sind lokal nicht geprüft; dafür sind GitHub-Workflows vorhanden. Kein produktives Deployment und keine produktive Migration ausgeführt.

## Reproduzierbare Befehle

Ohne Datenbank: `npm test`, `npm run lint`, `npm run typecheck`, `npm run test:mfa`, `npm run test:importfristen`, `npm run test:backup`.

Nur mit der ausdrücklich isolierten Testdatenbank: `npm run test:namensfreigabe`, `npm run test:datenschutz`, `npm run test:archiv`, `npm run test:mfa:db`, `npm run test:datensicherung:db`. Die Skripte verweigern gewöhnliche Produktionsverbindungen. Die CI stellt hierfür einen separaten PostgreSQL-Dienst bereit.

## Noch kein Betriebsnachweis

Die PowerShell-Übernahme eines beschädigten Downloads wurde noch nicht praktisch ausgeführt. RvS-Netzlaufwerk, Netcup-Server, produktives TLS und Firewall, Schlüsselverwahrung, AVV, Administratorvertretung, Archivfrist und behördliche Freigabe sind weiterhin durch den IT-Betrieb beziehungsweise die verantwortliche Stelle nachzuweisen. Die Reihenfolge beschreibt `INBETRIEBNAHME.md`.
