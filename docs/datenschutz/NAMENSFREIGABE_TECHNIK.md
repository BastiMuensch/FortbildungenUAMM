# Freiwillige Namensanzeige: Umsetzung und Betrieb

Stand: 24. September 2026. Dieser Baustein ist implementiert; die weiteren Maßnahmen stehen im [Umsetzungsplan](UMSETZUNGSPLAN.md).

- Registrierung und „Eigenes Konto“ bieten dieselbe freiwillige Auswahl. Ohne Zustimmung bleiben die Referentennamen intern.
- Öffentlich werden ausschließlich Vor- und Nachname aus dem Referentenprofil ausgegeben. Beide Organisationskennzeichnungen bleiben unabhängig davon sichtbar.
- Die eigene Zustimmung wird mit Text, Version, Zeitpunkt und Konto in `NamensfreigabeNachweis` dokumentiert. Ein Widerruf oder redaktioneller Stopp wird ebenfalls nachgewiesen. Die Nachweise sind vom allgemeinen Audit-Log getrennt.
- Server Actions binden die Zustimmung an das angemeldete eigene Konto. Bezirksberechtigte Redaktion kann nur stoppen. Eine Namensänderung stoppt eine bestehende Freigabe.
- Transaktionssperre und Änderungsstand verhindern, dass ein altes offenes Formular einen späteren Widerruf mit einer veralteten Zustimmung überschreibt.
- Der öffentliche Selektor prüft zusätzlich aktive Person, aktives Konto sowie aktuelle Textversion und Zustimmungszeitpunkt. Änderungen invalidieren den Anwendungscache; ICS und Aushang verwenden `no-store`.

## Einführung

Die Migration `20260924090000_namensfreigabe` setzt bisherige Sichtbarkeitsschalter zurück: Sie sind kein Nachweis einer eigenen Zustimmung. Migration und passende Anwendungsversion müssen zusammen ausgerollt werden. Danach können Personen selbst neu zustimmen. In dieser Umsetzung wurde ausschließlich eine separate Testdatenbank migriert.

Vor dem Produktivstart: Einwilligungstext und ergänzende Datenschutzinformationen abschließen, bestehende Freitexte auf Namen und Kontakte prüfen, Betriebscaches bereinigen und die Nachweisfrist verbindlich festlegen. Die Auswahl bereinigt keine frei eingegebenen Veranstaltungstexte. Heruntergeladene Kopien bleiben außerhalb der technischen Kontrolle.

## Prüfungen

`npm test`, `npm run lint`, `npm run typecheck` und `npm run build` prüfen den allgemeinen Stand. `npm run test:namensfreigabe` prüft mit PostgreSQL Registrierung, Nachweise, Rechte, veraltete Formulare, Namensänderung, Widerruf und öffentliche Selektoren, ICS sowie PDF-Ausgaben.

Der Datenbanktest akzeptiert ausschließlich eine ausdrücklich gesetzte `DATABASE_URL`, die mit `postgresql://bezirketest@127.0.0.1:54329/` beginnt. Er benötigt ein frisch migriertes Testschema und Python mit `pdfplumber` (`PDF_PYTHON` kann den Interpreter festlegen). Niemals die reguläre Projektdatenbank dafür verwenden. Der Workflow `.github/workflows/pruefungen.yml` stellt diese Umgebung für Pull Requests und Änderungen auf `main` bereit.

Die 400-Tage-Regel, Archivübergabe, Nachweisbereinigung, MFA sowie die abschließenden TOM und das VVT sind eigenständige Arbeitspakete und werden durch diesen Baustein nicht als erledigt erklärt.
