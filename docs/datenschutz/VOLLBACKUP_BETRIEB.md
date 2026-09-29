# Vollbackup: Übernahme, Aufbewahrung und Wiederherstellungsprobe

Dieses Verfahren sichert die vollständige Portalanwendung als verschlüsseltes Download-Archiv. Es ist kein Betriebssystem- oder vollständiges Server-Image. Das Archiv `fortbildungsportal-vollbackup-YYYY-MM-DD-UUID.zip.age` enthält mindestens `datenbank.dump` (PostgreSQL-16-Custom-Dump ohne Eigentümerrechte), `betrieb.json` mit den für den Wiederanlauf nötigen Laufzeitwerten und Geheimnissen sowie `manifest.json` im Format `fortbildungsportal-vollbackup-v1`; optional enthält es Migrationsdateien. Deshalb ist es besonders schutzbedürftig.

Der private age-Schlüssel liegt weder auf dem VPS noch neben dem heruntergeladenen Backup und auch nicht im Repository. Die Schlüsselverwahrung, Notfallvertretung und Zugriffskontrolle dokumentiert die zuständige Betriebsstelle getrennt. Rechte auf dem Regierungslaufwerk bleiben trotz Verschlüsselung institutionell begrenzt.

## Einmalig einrichten

1. Die IT erzeugt auf einem geschützten, vom VPS getrennten Arbeitsplatz im freigegebenen Schlüsselspeicher ein age-Schlüsselpaar. `age-keygen -o rvs-vollbackup-identitaet.txt` erzeugt die private Identitätsdatei; `age-keygen -y rvs-vollbackup-identitaet.txt` gibt ausschließlich den öffentlichen Empfängerschlüssel aus. Die private Datei geht in die getrennte Notfallverwahrung mit geregelter Vertretung.
2. In der geschützten Serverkonfiguration werden die folgenden Werte eingetragen. Der Empfängerschlüssel beginnt mit `age1`. Eine konkrete Anwendungsversion wird über `APP_IMAGE` festgehalten und für den Wiederanlauf verfügbar gehalten.

```dotenv
DATENSICHERUNG_AGE_EMPFAENGER="<öffentlicher-age1-Empfängerschlüssel>"
DATENSICHERUNG_SPOOL_TAGE="30"
DATENSICHERUNG_SCHEDULER="on"
```

3. Das aktualisierte Anwendungsimage wird nach dem üblichen Deploymentverfahren bereitgestellt. Docker Compose bindet das persistente Volume `datensicherungen` unter `/var/lib/fortbildungsportal/sicherungen` ein; `age` und der PostgreSQL-16-Client sind im Image enthalten. Bei Betrieb ohne dieses Image richtet die IT Werkzeuge, einen ausschließlich für den Anwendungsdienst zugänglichen Ordner und `DATENSICHERUNG_SPOOL` selbst ein.
4. Die IT legt den freigegebenen Netzordner samt Zielmarker und Zugriffsrechten fest und stellt die Windows-Ablagehilfe passend zur geltenden PowerShell-Ausführungsrichtlinie bereit. Hauptzuständigkeit, Vertretung und Umgang mit arbeitsfreien Tagen werden festgehalten. Die Bereinigung des Netzlaufwerks läuft beim erfolgreichen Übernehmen einer Datei; sie ist kein eigener Dienst des Portals.
5. Im Portal unter **Datensicherung** eine erste Sicherung erstellen und den folgenden Übernahme- und Wiederherstellungslauf durchführen. Die Ergebnisse werden in der Betriebsakte eingetragen. Die erfolgreiche lokale Entwicklungsprüfung ersetzt diesen Lauf in der vorgesehenen Betriebsumgebung nicht.

## Tägliche Übernahme auf dem RVS-Laptop

Das Portal erinnert täglich an den Download. Die zuständige Person lädt das Vollbackup per HTTPS vom Portalserver herunter. Die VPN-Verbindung ist für die anschließende Ablage vom dienstlichen RVS-Laptop auf dem Regierungsnetzlaufwerk erforderlich; der HTTPS-Download selbst setzt kein VPN voraus. Es gibt keinen voreingestellten Pfad: Die Betriebsstelle gibt ihn ausdrücklich an, etwa `\\regierungsnetz\freigabe\fortbildungsportal`.

Vor der ersten Verwendung richtet die Betriebsstelle dort die leere Datei `.fortbildungsportal-vollbackup-ziel` ein. Der Ordner darf kein Link sein und nur die benannte Betriebsgruppe erhält Schreibrechte. Der im Portal angezeigte SHA-256-Wert wird als vertrauenswürdiger Wert übergeben; die Übernahme prüft ihn vor dem Kopieren, nach dem Kopieren und nach dem atomaren Umbenennen. Die erzeugte Empfangsquittung enthält nur Name, Hash und Zeitstempel. Der bestätigte Hash wird ausgegeben und im Portal eingetragen.

```powershell
.\ops\Uebernehme-Vollbackup.ps1 -DownloadDatei 'C:\Users\...\Downloads\fortbildungsportal-vollbackup-2026-09-24-550e8400-e29b-41d4-a716-446655440000.zip.age' -ErwarteteSha256 '<SHA-256-aus-dem-Portal>' -Zielverzeichnis '\\regierungsnetz\freigabe\fortbildungsportal' -Aufbewahrungstage 30
```

`-WhatIf` zeigt die geplante Übernahme, ohne sie auszuführen. Weil die Bereinigung nur nach einer tatsächlich erfolgreichen Übernahme beginnt, prüft oder simuliert `-WhatIf` keine Löschvorgänge. Das Werkzeug akzeptiert ausschließlich einen UNC-Pfad zu einer Serverfreigabe oder ein als Netzlaufwerk erkanntes Laufwerk; es verwirft Windows-Gerätepfade und prüft Ziel und vorhandene Eltern auf Reparse-Points. Das Werkzeug kann nicht über die VPN-Verbindung aus dem Portal löschen und entfernt keine beliebigen Dateien. Bei der Bereinigung werden nur korrekt benannte Archive mit einer vom Werkzeug geschriebenen, passenden und erneut hashgeprüften Quittung berücksichtigt. Die eben übernommene Datei und die insgesamt zwei neuesten verifizierten Backups bleiben erhalten. Der Parameter liegt zwischen 7 und 90 Tagen, der Vorgabewert ist 30 Tage. Maßgeblich für das Alter ist der Berliner Kalendertag im vom Portal vergebenen Archivnamen, niemals ein nachträglich geänderter Quittungszeitstempel. Die Bereinigung läuft nur nach einer erfolgreichen neuen Übernahme; ohne täglichen Laptop-Lauf bleiben ältere Pakete daher liegen und werden nicht eigenständig im Netz gelöscht.

## Wiederherstellungsprobe

Die Probe geschieht ausschließlich auf einer vorher eingerichteten lokalen Testdatenbank. Sie benötigt `age`, `unzip`, `python3`, `pg_restore` und `psql` sowie den getrennt verwahrten privaten Schlüssel. Sie entschlüsselt in ein Rechte-geschütztes temporäres Verzeichnis, lehnt Pfadmanipulationen und unvollständige Archive ab, liest den Dump vor jedem `--clean`-Restore und entfernt Klartext bei Ende oder Fehler. `betrieb.json` wird niemals automatisch in eine Live-Konfiguration übernommen und Geheimnisse werden nicht ausgegeben.

Die Windows-Integrationstestdatei `scripts/vollbackupWindowsPruefungen.ps1` richtet ausschließlich in CI eine neue GUID-gebundene SMB-Freigabe auf `localhost` ein und entfernt sie danach wieder. Sie verwendet nur synthetische Dateien; auf Betriebsrechnern wird sie nicht ausgeführt.

```bash
export BACKUP_AGE_IDENTITAETSDATEI=/sicher/verwahrt/identity.txt
export RESTORE_DATABASE=fortbildungsportal_restore_test
export RESTORE_PGUSER=fortbildungen_restore
export RESTORE_PGHOST=127.0.0.1
export ERWARTETE_SHA256='<SHA-256-aus-dem-Portal>'
export ICH_BESTAETIGE_LOKALE_TESTWIEDERHERSTELLUNG=JA
./ops/test-vollbackup-wiederherstellung.sh /dienstlich/fortbildungsportal-vollbackup-2026-09-24-550e8400-e29b-41d4-a716-446655440000.zip.age
```

Das Skript verweigert andere Hosts und Datenbanknamen ohne eigenen Bestandteil `test`. Eine Wiederherstellung auf einem getrennten Testhost ist kein automatischer Ablauf: dessen Absicherung, lokale Durchführung und Freigabe liegen bei der Betriebsstelle. Nach jeder Probe werden Archivtag, Manifestprüfung, Prüfsumme, Testziel, Dauer, Ergebnis und verantwortliche Person in der Betriebsakte dokumentiert.
