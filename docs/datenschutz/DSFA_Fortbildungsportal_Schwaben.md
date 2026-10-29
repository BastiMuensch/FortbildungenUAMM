# Datenschutzfolgenabschätzung

Risiken und Schutzmaßnahmen für das Fortbildungsportal

weiter.bilden · Fortbildungsportal Schwaben · DSFA 01 · Version 1.1 · Stand 5. Oktober 2026

**Ergebnis der Bewertung:** Für den beschriebenen Einsatz sind die wesentlichen Datenschutzrisiken mit den vorhandenen Schutzfunktionen und den vorgesehenen Betriebsregeln beherrschbar. Das verbleibende Risiko wird als **gering bis mittel** eingeschätzt. Ein voraussichtlich hohes Restrisiko ist derzeit nicht erkennbar. Die Einschätzung setzt voraus, dass die beschriebenen Schutzmaßnahmen im tatsächlichen Betrieb wirksam eingerichtet sind.

Die DSFA wird vorsorglich geführt. Maßgeblich sind die konkrete Nutzung und ihre Auswirkungen auf Menschen. Der dienstliche Bezug allein begründet noch kein hohes Risiko. [Q1, Q2]

## 1 Gegenstand und Verantwortung

**Verantwortliche Stelle:** Regierung von Schwaben, Sachgebiet 40.1. Als Betriebsverantwortliche ist **Doris Sippel, Beraterin digitale Bildung an der Regierung**, benannt. Die behördliche Datenschutzbeauftragte berät; die verantwortliche Stelle trifft die Betriebsentscheidung.

Diese Bewertung umfasst **VVT 01 bis 04**: Planung, Nachbereitung und Berichte, öffentliche Fortbildungsinformation, Konten und Sicherungen sowie die gesonderte fachliche Aufbewahrung. Hosting ist bei netcup auf einem VPS 1000 G12.5 in Nürnberg vorgesehen. Vertrag und Auftragsverarbeitung liegen bei der RvS. Sicherungen werden auf Regierungslaufwerken, fachliche Archive bei RvS oder zuständigem Schulamt abgelegt.

### Was bereits schützt

| Schutz im aktuellen Projektstand | Wirkung für betroffene Personen |
| --- | --- |
| Bezirksgebundene Rechte | BdBs erhalten keine fremden Auswertungen. Nur berechtigte RvS-Konten besitzen fachlichen Gesamtzugriff. |
| Persönliche Konten und zweiter Anmeldefaktor | Erschweren unberechtigte Zugriffe; Regierung und BdBs benötigen zusätzlich einen wechselnden Anmeldecode. |
| Freiwillige Namensfreigabe | Referentennamen erscheinen nach außen nur nach eigener Zustimmung. Kontakte und interne Notizen werden nicht öffentlich ausgegeben. |
| Begrenzte Datenarten | Keine Telefonnummernfelder, Privatanschriften, Schülerdaten oder personenbezogenen Teilnehmerlisten. Freitexte dienen nur der Organisation. |
| Schuljahre und kontrollierte Übergabe | Nach 400 Tagen ab Schuljahresende endet der reguläre Zugriff; Bereinigung folgt nach bestätigter Archivübernahme. |
| Verschlüsselte Vollsicherungen | Die Sicherung ist schon vor dem Download verschlüsselt. Ablage wird ausdrücklich bestätigt; Wiederherstellung ist mit Testdaten erprobt. |

**Umfang:** Einsatz im Regierungsbezirk Schwaben. [Ungefähre Anzahl Schulämter, Referierende, Verwaltungskonten und Veranstaltungen je Schuljahr].

<!-- seite-fest -->

## 2 Verarbeitung und Verhältnismäßigkeit

Namen, dienstliche E-Mail und Bezirkszuordnung ermöglichen Konten, Erreichbarkeit und die richtige Zuordnung von Veranstaltungen. Titel, Zeit, Ort, Themen und Form dienen Planung und Veröffentlichung. Teilnehmerzahlen und Nachbereitung unterstützen die Fortbildungsplanung und die schuljahresbezogenen Berichte. Optionale Organisation und interne Notizen werden nur für notwendige organisatorische Angaben verwendet.

Die interne Verarbeitung stützt sich auf **Art. 6 Abs. 1 Buchst. e und Abs. 3 DSGVO in Verbindung mit Art. 4 Abs. 1 BayDSG** und die Fortbildungsaufgaben aus VVT 01. Eine allgemeine Einwilligung ist dafür nicht vorgesehen. Die **freiwillige Namensanzeige** beruht getrennt auf Art. 6 Abs. 1 Buchst. a DSGVO. [Q1, Q3, Q4]

Das Portal ergänzt FIBS um kontrollierte Zugriffe, Schuljahresberichte und geordnete Aufbewahrung. Aus FIBS werden nur erforderliche Angaben übernommen; der automatische Import ist standardmäßig ausgeschaltet.

### Zugriff und Veröffentlichung

BdBs bearbeiten die zugewiesenen Bezirke. Referierende arbeiten an eigenen oder zugeordneten Veranstaltungen. RvS-Konten haben den für Koordination und Berichte benötigten Gesamtzugriff. **Die enge Ausnahme für den Planungskalender** erlaubt bezirksübergreifend Veranstaltungsdaten einschließlich Entwürfen, aber keine fremden Auswertungen, Teilnehmerzahlen, Nachbereitungsnotizen oder persönlichen Referentenkontakte.

Die Trennung wird in einer gemeinsamen Datenbank durchgesetzt. Technische Administratorzugänge werden persönlich und organisatorisch begrenzt; eine separate Verschlüsselung je Bezirk ist nicht vorgesehen.

Öffentlich erscheinen die Netzwerk- beziehungsweise Beratungskennzeichnung und der zuständige Schulamtsbezirk. Vor- und Nachname werden nur mit gültiger eigener Freigabe ergänzt. Die Zustimmung ist freiwillig, wird nachgewiesen und kann im Konto widerrufen werden. Freitexte werden vor der Veröffentlichung geprüft.

### Berichte und neue Funktionen

Referentenbezogene Zahlen dürfen für Angebot, Planung und Nachweis genutzt werden. Sie sind keine belastbare individuelle Leistungsbewertung. Kleine Fallzahlen werden vor Weitergabe eingeordnet; weitergegebene Berichte werden soweit möglich zusammengefasst. Das Portal trifft keine automatisierten Personalentscheidungen.

**Teilnahmebescheinigungen** sind Blankoformulare. Das Portal gibt Veranstaltungsdaten, zuständige BdB-Namen und gegebenenfalls freigegebene Referentennamen aus; Teilnehmendennamen werden erst auf Papier ergänzt. Es entsteht keine digitale Teilnehmendenkartei. Die Namensfreigabe wurde dafür ausdrücklich erweitert und versioniert; bisherige Zustimmungen benötigen eine neue Bestätigung.

**Dauerkorrekturen** ermöglichen richtige Nachweise nach einer Veranstaltung. Neue Ausgaben verwenden die korrigierte Endzeit; der unmittelbar vorherige Wert und der Korrekturzeitpunkt bleiben gespeichert. Rollen und lokal erzeugter MFA-QR-Code erweitern den Empfängerkreis nicht.

### Aufbewahrung und Rechte

Die operative Frist beträgt 400 volle Tage nach Schuljahresende. Facharchive und Vollsicherungen verfolgen getrennte Zwecke; sie werden nicht unbegrenzt aufbewahrt. Die Archivfrist und ergänzende Nachweisfristen werden einmal nach VVT Abschnitt 6 festgelegt. Auskunft, Berichtigung, Widerspruch und Löschung werden über die bestehenden behördlichen Abläufe bearbeitet. Vor Wiederaufnahme nach einer Rücksicherung werden Löschungen, Sperren und Widerrufe nachgeführt.

<!-- seite-fest -->

## 3 Realistische Bewertung der Risiken

Die Bewertung verbindet **Eintrittswahrscheinlichkeit und mögliche Folgen für Menschen**. Gering sind seltene oder begrenzte Nachteile; mittlere Risiken brauchen wirksame Kontrollen. Hohe Risiken können sich aus wahrscheinlichen oder besonders schweren Folgen ergeben. „Ausgang“ betrachtet den Vorgang ohne die zugeordneten Maßnahmen, „verbleibend“ den geschützten Betrieb. Die Einstufungen sind eine fachliche Einschätzung.

| Risiko und Ausgangslage | Schutz und Begründung | Verbleibend |
| --- | --- | --- |
| **Unberechtigter Zugriff – mittel.** Fremde lesen dienstliche Kontakte oder Auswertungen und ändern Zuordnungen. | Serverseitige Bezirksrechte, MFA für die Verwaltung, begrenzte Anmeldeversuche und widerrufbare Sitzungen erschweren Missbrauch. Persönliche Administratorzugänge und aktuelle Software sichern den Betrieb. | **Gering** |
| **Ungewollte Namensnennung – mittel.** Namen oder Kontakte gelangen über Texte und Dateien an zusätzliche Empfänger. Kopien können fortbestehen. | Begrenzte öffentliche Felder, eigene Zustimmung, Widerruf und aktuelle Textversion; Inhaltsprüfung für Freitexte. Bereits verteilte Kopien sind nicht vollständig rückholbar. | **Gering bis mittel** |
| **Fehlinterpretation von Auswertungen – mittel.** Wenige Veranstaltungen oder Teilnehmende werden einer Person als schlechte Leistung zugerechnet. | Zugriff nur im zuständigen Fachkreis. Berichte dienen der Angebotsplanung; kleine Fallzahlen werden erläutert und keine persönlichen Ranglisten erstellt. Diese Nutzungsregel braucht organisatorische Kontrolle. | **Mittel** |
| **Falsche Nachweise – mittel.** Unrichtige Dauer oder falsche Personenangaben führen zu fehlerhaften Berichten und Bescheinigungen. | Berechtigte können Angaben berichtigen; Endzeitänderungen sind begrenzt nachvollziehbar. Vor Ausgabe werden Daten und BdB-Zuordnung geprüft. Ein Blankoformular bestätigt noch keine tatsächliche Teilnahme. | **Gering** |
| **Verlust oder Offenlegung von Sicherungen – mittel bis hoch.** Ein Vollbackup umfasst alle Bezirke und Betriebsschlüssel; ein Missbrauch hätte größere Folgen. | Verschlüsselung vor Download, RvS-Zugang mit MFA, getrennte Schlüsselverwahrung, geprüfte Netzablage und Wiederherstellungsprobe. Gewöhnliche Fachpakete und Ausdrucke bleiben in geschützten dienstlichen Ablagen. | **Gering bis mittel** |
| **Zu lange Speicherung – mittel.** Alte Konten, Kopien und Nachweise bleiben ohne Bedarf erhalten. | Fristsperre, kontrollierte Archivübernahme und rollierende Sicherungen. Behördliche Fristen gelten auch für externe Ablagen; Bereinigung und ausgeschiedene Konten werden kontrolliert. Die offenen Fristen werden verbindlich ergänzt. | **Gering bis mittel** |

**Gesamtergebnis:** Es bleibt kein erkennbares hohes Restrisiko, wenn diese Maßnahmen wirksam sind. Die mittleren Anteile betreffen vor allem sachgerechte Berichtsverwendung und den Umgang mit externen Kopien. Sie werden durch klare Zuständigkeiten und den regulären Betriebscheck behandelt; daraus folgt kein Bedarf für zusätzliche aufwendige Kontrollsysteme.

<!-- seite-fest -->

## 4 Einordnung und noch notwendige Bestätigungen

Art. 35 DSGVO verlangt eine DSFA bei voraussichtlich hohem Risiko. Aus dem dienstlichen Bezug und der schwabenweiten Nutzung folgt hier keine eindeutige Pflicht nach den Fallgruppen des BayLfD. Besondere Datenkategorien, umfassende Beschäftigtenüberwachung und automatisierte Entscheidungen mit erheblichen Folgen sind nicht vorgesehen. Referentenbezogene Auswertungen und der tatsächliche Umfang bleiben relevant. Die Prüfung ist mit dieser vorsorglichen DSFA dokumentiert. [Q1, Q2]

Lokale Tests belegen Bezirksrechte, Namensfreigabe, Fristsperre und verschlüsselte Wiederherstellung mit Testdaten. Der erste Durchlauf am Netcup-Server und auf dem Regierungslaufwerk wird im gemeinsamen Betriebsprotokoll ergänzt.

| Verantwortung | Noch zu bestätigen |
| --- | --- |
| Sachgebiet 40.1 | Aufgaben, beteiligte Schulämter und grober Umfang aus Abschnitt 1; Nutzung der Berichte für Fortbildungsplanung und Nachweise. |
| Fachstelle und Registratur | Aufbewahrungsregeln aus VVT Abschnitt 6, insbesondere die Frist des gesonderten Facharchivs. |
| IT-Betrieb und Sicherung | Geschützte Serverzugänge, Vertragsunterlagen, eingerichteter Sicherungsablauf, bestätigte Netzablage und erfolgreiche Wiederherstellungsprobe. |

Diese Angaben werden einmal in der **gemeinsamen Betriebsakte** ergänzt; die Ausfüllhilfe ordnet die Aufgaben zu.

### Beratung und Entscheidung

**Datenschutzberatung:** [Datum und Fundstelle der Stellungnahme der behördlichen Datenschutzbeauftragten]. Eine Rückmeldung künftiger Referierender oder ihrer Vertretung kann in die bestehende Einführung eingebunden werden; soweit angemessen, wird sie nach Art. 35 Abs. 9 berücksichtigt. [Vorliegende Rückmeldung oder kurzer Grund für das Absehen].

**Entscheidungsvorschlag:** Die RvS übernimmt diese Bewertung für den beschriebenen Zweck und Datenumfang. Nach Bestätigung der genannten Betriebsmaßnahmen werden die geringen bis mittleren Restrisiken im regulären Betrieb getragen. Eine vorherige Konsultation der Aufsichtsbehörde nach Art. 36 DSGVO ist nach dieser Einschätzung nicht angezeigt; sie wäre erforderlich, wenn trotz Abhilfe ein hohes Restrisiko verbliebe. [Q1]

**Tatsächliche Entscheidung:** [Datum, befugte Person und Aktenfundstelle; gegebenenfalls verbleibende Punkte mit Zuständigkeit und Termin].

Die Bewertung wird jährlich und bei wesentlichen Änderungen fortgeschrieben, etwa bei Teilnehmerlisten, sensiblen Daten, Personalbewertung oder neuen Empfängern. Übliche Layout- und Bedienungsverbesserungen benötigen keine neue DSFA.

### Grundlagen

Quellen und Projektstand abgeglichen am 05.10.2026. Maßgeblich sind TOM 01 und VVT 01 bis 04, jeweils Version 1.1, sowie die bestehenden Betriebsanleitungen und Entwicklungsprüfnachweise.

- Q1 [DSGVO insbesondere Artikel 6 7 35 und 36](https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32016R0679).
- Q2 [BayLfD zur Datenschutzfolgenabschätzung](https://www.datenschutz-bayern.de/nav/1801.html) und [Bayerische Liste verpflichtender Fälle](https://www.datenschutz-bayern.de/datenschutzreform2018/DSFA_Blacklist.pdf).
- Q3 [Artikel 4 BayDSG](https://www.gesetze-bayern.de/Content/Document/BayDSG-4).
- Q4 [KMBek Beratung digitale Bildung vom 28 Mai 2019](https://www.verkuendung-bayern.de/baymbl/2019-251/); weitere Aufgabenquellen in VVT 01.
