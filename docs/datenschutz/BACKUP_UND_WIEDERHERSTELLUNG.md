# Verschlüsselte Vollsicherung und Wiederherstellungsprobe

Stand 24. September 2026. Dieses Verfahren beschreibt den in der Anwendung vorbereiteten Ablauf; es ist kein Nachweis eines eingerichteten Produktivbetriebs.

## Standardablauf

Die Anwendung erzeugt ab 06:00 Uhr Europe/Berlin täglich eine verschlüsselte Vollsicherung im geschützten Server-Spool. Nach einem Ausfall erstellt der stündliche Prüflauf nach Wiederanlauf eine Sicherung für den aktuellen Tag. Das Archiv `fortbildungsportal-vollbackup-YYYY-MM-DD-UUID.zip.age` enthält den PostgreSQL-Anwendungsbestand, die erforderliche Betriebskonfiguration einschließlich JWT- und MFA-Schlüsselmaterial, Schema, Migrationen und Wiederherstellungswerkzeuge. Es ist kein Betriebssystem- oder Docker-Image.

Der Server besitzt nur den öffentlichen age-Empfängerschlüssel. Der private Schlüssel bleibt getrennt, offline und außerhalb von VPS, Repository und Sicherungsablage. Vor der ersten Nutzung sind öffentlicher Schlüssel, Schlüsselverwahrung mit Vertretung, geschützter UNC-Pfad und dessen Berechtigungen festzulegen.

## Übernahme auf das Regierungslaufwerk

Nur ein RvS-Konto mit vollständig eingerichteter MFA darf das Archiv im Portal herunterladen. Die zuständige Person lädt es per HTTPS auf einem Regierungslaptop und legt es über die bestehende VPN-Verbindung auf dem freigegebenen RvS-Netzlaufwerk ab. Das Portal hat keinen Zugriff auf dieses Laufwerk.

Der Portalhinweis bleibt täglich sichtbar, bis eine RvS-Person ausdrücklich die Ablage **und** den SHA-256-Wert der Datei auf dem Netzlaufwerk bestätigt. Ein Download allein ist keine Ablagebestätigung. Als Hilfe kann die RvS-Person das geschützte Werkzeug `Uebernehme-Vollbackup.ps1` laden; es kopiert, prüft den Hash und bereinigt nur die von ihm verwalteten Dateien.

Server-Spooldateien werden standardmäßig nach 30 Kalendertagen gelöscht; die Einstellung ist auf 7 bis 90 Tage begrenzt. Sicherungsmetadaten bleiben 365 Tage. Für das Netzlaufwerk ist ebenfalls eine Rollierung von 30 Tagen (einstellbar 7 bis 90) vorgeschlagen; die zwei neuesten geprüften Dateien bleiben zusätzlich erhalten, auch wenn sie älter sind. Ohne Werkzeuglauf oder eingerichtete Windows-Aufgabenplanung findet dort keine automatische Bereinigung statt. Für den täglichen Ablauf müssen daher Person und Vertretung benannt sein.

Das ältere hostdirekte Verfahren `ops/sichere-postgres-sicherung.sh` mit eingebundenem Zielpfad ist nur ein Alternativweg. Es ist nicht der Standardablauf und darf nicht als Nachweis der Portalübernahme verwendet werden.

## Wiederherstellungsprobe

Die Probe erfolgt vor Betriebsstart und nach wesentlichen Änderungen auf einem getrennten, freigegebenen Testsystem, nie auf dem Produktionsserver oder gegen die Produktionsdatenbank. Das mitgelieferte Werkzeug prüft Archiv und Prüfsumme, entschlüsselt mit dem getrennt verwahrten privaten Schlüssel und stellt nur in eine ausdrücklich bestätigte Testdatenbank wieder her. Danach werden mit der passenden Anwendungsversion Anmeldung, Rechte und ausgewählte Fachfunktionen geprüft; Testkopien werden geschützt bereinigt.

Das Protokoll hält Archivname, Hash, Testziel, verantwortliche Person, Datum, Dauer, Ergebnis und Abweichungen fest. Vor Wiederfreigabe nach einer Wiederherstellung sind zwischenzeitliche Löschungen, Sperren und Widerrufe nachzuführen. Der erste erfolgreiche Ablage- und Wiederherstellungstest im vorgesehenen RvS-Betriebsverfahren ist noch zu dokumentieren; Produktivprüfung, Netcup-Einrichtung und RvS-Netz sind damit nicht bestätigt.

Die fachliche Archivierung bleibt getrennt: Die 400-Tage-Regel nach Schuljahresende, ihre Ablage und ihre Fristen werden durch die Vollsicherung nicht ersetzt.
