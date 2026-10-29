# Technische und organisatorische Maßnahmen

TOM gemäß Artikel 32 DSGVO

weiter.bilden · Fortbildungsportal Schwaben · Version 1.1 · Stand 5. Oktober 2026

Das Portal unterstützt die Fortbildungsarbeit der Regierung von Schwaben, der Beratung digitale Bildung und des Referentennetzwerks. **Die wesentlichen Schutzfunktionen sind in der Anwendung umgesetzt:** begrenzte Zugriffe, ein zusätzlicher Anmeldecode für die Verwaltung, freiwillige Namensanzeige, schuljahresbezogene Aufbewahrung und verschlüsselte Vollsicherungen.

Die Angaben beschreiben den aktuellen Projektstand. Hosting und HTTPS entsprechen den mitgeteilten Betriebsangaben. Ob alle Einstellungen auf dem vorgesehenen Server wirksam sind, hält der IT-Betrieb einmal im Inbetriebnahmeprotokoll fest. Noch benötigte Angaben sind am Ende gebündelt und in Word gelb markiert.

## 1 Verantwortung und Hosting

**Verantwortliche Stelle:** Regierung von Schwaben, Fronhof 10, 86152 Augsburg. Fachlich zuständig ist **Sachgebiet 40.1**. Als Betriebsverantwortliche ist **Doris Sippel, Beraterin digitale Bildung an der Regierung**, benannt. Die ausführende Serveradministration und ihre Vertretung werden in der gemeinsamen Betriebsakte eingetragen.

**Hosting:** netcup VPS 1000 G12.5 am Standort **Nürnberg, Deutschland**. Die Regierung mietet den Server und schließt den Vertrag zur Auftragsverarbeitung nach Art. 28 DSGVO. Vertrag, Anbietermaßnahmen und Angaben zu Unterauftragnehmern werden zusammen abgelegt.

netcup veröffentlicht Zertifikate nach **ISO/IEC 27001:2022** für das Informationssicherheitsmanagement und **ISO/IEC 27701:2019** für das Datenschutzmanagement. Die verlinkten Nachweise laufen bis 17.11.2027 beziehungsweise 17.12.2026. Sie betreffen das Managementsystem des Anbieters und dessen ausgewiesenen Geltungsbereich. Die Konfiguration dieser Anwendung bleibt Aufgabe des eigenen Betriebs. Zutrittskontrollen und die Absicherung von Stromversorgung, Kühlung und Netz werden vom Rechenzentrumsanbieter übernommen. [Q1–Q3]

## 2 Zugang und Bezirksgrenzen

| Rolle | Zugriff im Portal |
| --- | --- |
| Regierung von Schwaben | Bezirksübergreifende Planung, Verwaltung und Auswertung für berechtigte RvS-Konten. |
| BdB der Schulamtsbezirke | Eigene zugewiesene Schulamtsbezirke und deren Referentennetzwerk. Keine fremden Auswertungen. |
| Referierende | Eigene oder zugeordnete Veranstaltungen innerhalb der zugewiesenen Bezirke. |

Die Anwendung prüft diese Rechte auch beim Speichern und Herunterladen. Die frühere Redaktionsrolle ist in der BdB-Rolle aufgegangen. Ein gemeinsames Referentenprofil kann in mehreren zugeordneten Bezirken sichtbar sein; fremde Veranstaltungsberichte werden dadurch nicht zugänglich.

**Begrenzte Planungsausnahme:** Zur Terminabstimmung sehen angemeldete planungsberechtigte Personen auch bezirksfremde Titel, Beschreibungen, Zeiten, Orte, Veranstaltungsformen und Status, einschließlich Entwürfen. Die Ansicht liefert keine persönlichen Referentenkontakte, Teilnehmerzahlen oder Nachbereitungsnotizen und keine Referentennamen als eigenes Feld. Sie eröffnet keine Bearbeitungsrechte. Diese Ausnahme wird nicht auf Auswertungen übertragen.

Die Bezirkstrennung erfolgt durch Berechtigungen in einer gemeinsamen Datenbank. Technische Administratoren haben weitergehende Möglichkeiten; ihre Zugänge sind auf die notwendigen Personen und Betriebsaufgaben zu begrenzen.

<!-- seite -->

## 3 Anmeldung und Schutz der Übertragung

Persönliche Konten schützen den Verwaltungsbereich. Passwörter werden als nicht zurückrechenbare Prüfwerte gespeichert. Wiederholte Anmeldeversuche werden begrenzt. Sitzungen enden nach acht Stunden; gesperrte Konten und widerrufene Sitzungen werden vom Server zurückgewiesen.

Regierungs- und BdB-Konten benötigen zusätzlich einen wechselnden Code aus einer Authenticator-App. Das dafür benötigte Geheimnis wird verschlüsselt gespeichert. Bei der Einrichtung erscheint der QR-Code ausschließlich im angemeldeten Browser und wird dort lokal erzeugt; ein externer QR-Dienst ist nicht beteiligt. Notfallcodes werden einmal angezeigt und danach nur als Prüfwerte gespeichert.

**Verschlüsselte Übertragung:** HTTPS mit Let’s Encrypt ist nach Betreiberangabe vorhanden. Browser-Schutzvorgaben sind in der Anwendung eingerichtet. Vollsicherungen werden vor dem Download zusätzlich verschlüsselt. Eine Verschlüsselung der gesamten gespeicherten Datenbank wird mit diesen Maßnahmen nicht behauptet.

Die bereitgestellte Serverkonfiguration veröffentlicht keinen Datenbankzugang. Der Zugang zur Anwendung ist standardmäßig auf den Server selbst begrenzt und für vorhandene Gateways anpassbar. Der IT-Betrieb kontrolliert die tatsächlich gewählten Einstellungen, Firewall und Verwaltungszugänge. Hoster- und Administratorzugänge werden persönlich, mit geschützten Schlüsseln beziehungsweise zusätzlichem Anmeldefaktor genutzt.

## 4 Veröffentlichung und richtige Daten

Öffentliche Angebote tragen die Kennzeichnung **„Referentennetzwerk digitale Bildung – Schulamtsbezirk“** beziehungsweise **„Beratung digitale Bildung – Schulamtsbezirk“**, jeweils mit dem zuständigen Bezirk. Persönliche Referentenkontakte und interne Notizen werden nicht als öffentliche Felder ausgeliefert.

**Namensanzeige bleibt freiwillig.** Nur die betroffene Person kann zustimmen. Die Auswahl ist zunächst ausgeschaltet und jederzeit widerrufbar. Die aktuelle Freigabe umfasst Vor- und Nachname bei eigenen Veranstaltungen auf Website, Kalenderfeed, Ausschreibungs-PDFs und SchiLf-Teilnahmebescheinigungen. Zustimmung, Textversion und Widerruf werden nachgewiesen. Die Textfassung vom 05.10.2026 erfordert eine erneute Zustimmung; eine ältere Fassung schaltet die Anzeige nicht frei. Die Verwaltung kann die Anzeige stoppen, aber keine Zustimmung ersetzen.

Die Anwendung berücksichtigt Änderungen bei neuen Ausgaben. Bereits gedruckte, heruntergeladene oder von Dritten gespeicherte Kopien können nicht zurückgeholt werden. Veranstaltungstexte werden vor Veröffentlichung auf unnötige Namen und Kontaktdaten geprüft; die Freigabe einzelner Namensfelder bereinigt keine Freitexte.

Editorinhalte werden vor dem Speichern technisch bereinigt. Schriften und QR-Codes werden lokal bereitgestellt; Analysewerkzeuge und eingebettete Fremdinhalte sind nicht vorgesehen. Links etwa zu FIBS bleiben möglich. Der optionale automatische FIBS-Import ist standardmäßig ausgeschaltet und vor einer Nutzung mit der tatsächlichen Quelle zu prüfen.

**Dauerkorrektur:** Nach einer Veranstaltung können zuständige Personen die Endzeit berichtigen. Neue Ansichten und Exporte verwenden die korrigierte Dauer. Der unmittelbar vorherige Endzeitpunkt und der Korrekturzeitpunkt bleiben gespeichert; ein Änderungsereignis wird protokolliert. Dies ist keine vollständige Historie aller Zeitänderungen.

**Teilnahmebescheinigungen:** Für SchiLf werden Blanko-PDFs mit Veranstaltungsdaten, zuständigen BdB-Namen und gegebenenfalls freigegebenen Referentennamen erzeugt. Teilnehmendennamen werden erst auf dem Ausdruck ergänzt. Im Portal entsteht keine Teilnehmendenliste und keine Ablage der ausgefüllten Bescheinigungen. Druck und Aushändigung liegen bei der durchführenden Stelle; Ausdrucke und lokale Dateien sind entsprechend zu behandeln.

<!-- seite -->

## 5 Sicherung und Wiederherstellung

Die tägliche Vollsicherung ist eingebaut. **Bei eingerichtetem Zeitplan und Verschlüsselungsschlüssel** erzeugt die Anwendung täglich ab 06:00 Uhr deutscher Ortszeit eine verschlüsselte Sicherungsdatei. Sie enthält die Datenbank und die für die Wiederherstellung benötigte Betriebskonfiguration einschließlich geheimer Schlüssel. Der private Entschlüsselungsschlüssel wird getrennt von Server und Sicherungsdateien verwahrt.

Der vorgesehene Ablauf ist einfach:

1. Ein berechtigtes Regierungskonto lädt die verschlüsselte Datei nach Anmeldung mit zweitem Faktor per HTTPS auf einen Regierungslaptop.
2. Die Datei wird über die bestehende VPN-Verbindung auf das freigegebene Regierungslaufwerk übernommen. Das vorbereitete Übernahmewerkzeug kontrolliert die Datei mit einer Prüfsumme und kann alte Sicherungen bereinigen.
3. Die zuständige Person bestätigt die überprüfte Ablage im Portal. Erst dann endet der tägliche Hinweis. Ein Download allein gilt nicht als erfolgreiche Sicherung auf dem Regierungslaufwerk.

Das Portal greift selbst nicht auf das Regierungslaufwerk zu. Der Hinweis erscheint beim Portalbesuch; er ist kein E-Mail-Alarm. Deshalb werden eine tägliche Zuständigkeit und eine Vertretung benannt.

| Bestand | Aufbewahrung und Kontrolle |
| --- | --- |
| Verschlüsselte Dateien auf dem Server | Standardmäßig 30 Tage; einstellbar zwischen 7 und 90 Tagen. |
| Nachweise zu Vollsicherungen | 365 Tage im Portal. |
| Kopien auf dem Regierungslaufwerk | Vorschlag 30 Tage. Das Werkzeug behält zusätzlich die zwei neuesten geprüften Dateien. Seine Ausführung wird täglich organisiert. |

Eine echte verschlüsselte Sicherung mit Wiederherstellung in einer getrennten Testdatenbank ist im Projekt dokumentiert. **Die erste erfolgreiche Übernahme auf das Regierungslaufwerk und eine Wiederherstellungsprobe von dort werden noch im Betrieb nachgewiesen.** Danach wird die Probe bei wesentlichen Änderungen und im jährlichen Betriebscheck wiederholt. Vor dem Wiederanlauf werden zwischenzeitliche Löschungen, Kontosperren und Widerrufe nachgeführt.

## 6 Schuljahre und Aufbewahrung

Veranstaltungen werden nach ihrem Beginn einem Schuljahr vom 1. August bis 31. Juli zugeordnet. **400 volle Kalendertage nach Schuljahresende** endet der reguläre Zugriff. Die Sperre wirkt auch, wenn ein Bereinigungslauf ausgefallen ist. Beispiel 2026/2027: letzter Zugriffstag 03.09.2028, Sperre ab 04.09.2028 um 00:00 Uhr.

Vorher werden erforderliche Nachweise je Bezirk und Schuljahr in ein Facharchiv bei RvS oder zuständigem Schulamt übernommen. Das Paket enthält Veranstaltungsangaben, geplante Plätze, tatsächliche Teilnehmerzahlen sowie Namen und interne Kennungen der Referierenden. Kontakte, Beschreibungen, interne Notizen und Kontogeheimnisse sind nicht enthalten. **Dieses Fachpaket ist ein gewöhnliches ZIP und nicht wie das Vollbackup automatisch verschlüsselt.** Es wird auf der berechtigungsgeschützten dienstlichen Ablage gespeichert.

Die endgültige Bereinigung der operativen Veranstaltungsdaten folgt erst nach Fristablauf und bestätigter, unveränderter Archivübernahme. Bei Übergabeproblemen bleibt der reguläre Zugriff gesperrt; die Regierung kann einen begründeten Sonderdownload für höchstens sieben Tage erlauben. Eine Störung wird zeitnah behoben und begründet keine unbegrenzte Speicherung. Die Frist im Facharchiv wird durch die Behörde festgelegt.

<!-- seite -->

## 7 Nachvollziehbarkeit und laufender Betrieb

Sicherheits- und Änderungsprotokolle halten wichtige Vorgänge mit Konto, Zeitpunkt und betroffenem Datensatz fest. Fehlanmeldungen können E-Mail-Adresse und IP-Adresse enthalten. Allgemeine Änderungs- und Importprotokolle werden nach 365 Tagen bereinigt. Die Protokollierung ist keine lückenlose Aufzeichnung sämtlicher Zugriffe oder Ausdrucke. Insbesondere gibt es kein Versand- oder Empfängerregister für Teilnahmebescheinigungen.

Der IT-Betrieb hält Server und Anwendung aktuell, kontrolliert fehlgeschlagene Sicherungs- und Bereinigungsläufe und prüft nach Änderungen die betroffenen Funktionen. Beschäftigte verwenden dienstlich freigegebene Geräte und Ablagen; Zugänge werden bei Ausscheiden gesperrt. Freitexte bleiben auf sachliche Organisationsangaben beschränkt. Das frühere Telefonnummernfeld ist entfernt; die entsprechende Datenbankänderung gehört zum regulären Einspielen des aktuellen Stands. Alte Sicherungen laufen nach ihrer Sicherungsfrist aus.

Anfragen zu Auskunft, Berichtigung, Widerspruch und Löschung laufen über Sachgebiet 40.1; die Datenschutzbeauftragte berät. Für Sicherheitsvorfälle gelten die bestehenden Meldewege der Regierung. Der Betrieb informiert unverzüglich die zuständige Stelle, begrenzt den Schaden und sichert die notwendigen Nachweise. Die RvS prüft erforderliche Meldungen nach Art. 33 DSGVO innerhalb von grundsätzlich 72 Stunden sowie gegebenenfalls die Information Betroffener nach Art. 34. [Q4]

<!-- seite-fest -->

## 8 Angaben zum tatsächlichen Betrieb

Die Anwendung benötigt keine zusätzliche Papierprüfung für jede einzelne Funktion. **Ein gemeinsames Inbetriebnahmeprotokoll und die vorhandene Behördenakte genügen** für die nachfolgenden Angaben. Dieselben Einträge gelten für TOM, VVT und DSFA.

| Wer ergänzt | Noch benötigte Angabe |
| --- | --- |
| Sachgebiet 40.1 | [Fachkontakt, Vertretung und ausführende Administration; Aktenfundstelle mit beteiligten Schulämtern und Zuständigkeiten] |
| Vertragsstelle und IT-Betrieb | [Portaladresse, eingesetzter Stand und AVV-Fundstelle; Bestätigung der Serverinstanz Nürnberg und der geschützten Zugänge] |
| Sicherung und Vertretung | [Regierungslaufwerk, Zugriffsberechtigte, tägliche Person und Vertretung, getrennte Schlüsselverwahrung; Datum und Ergebnis der Netzablage und Wiederherstellungsprobe] |
| Sachgebiet 40.1 und Registratur | [Archivfrist mit Beginn und Aufbewahrungsregel; ergänzende Fristen aus VVT Abschnitt 6] |

**Übernahme in den Betrieb:** [Datum und Fundstelle der gemeinsamen Betriebsentscheidung]. Die Dokumentation wird bei wesentlichen Änderungen und im jährlichen Betriebscheck fortgeschrieben. Die Datenschutzbeauftragte wird beratend beteiligt; eine technische Abnahme wird ihr nicht übertragen.

### Quellen und zugehörige Unterlagen

Quellenabgleich und Projektabgleich am 05.10.2026. Betriebsentscheidungen werden erst nach ihrer tatsächlichen Durchführung eingetragen.

- Q1 [netcup Standort Nürnberg](https://www.netcup.com/de/ueber-netcup/server-standorte/nuernberg) und [Auftragsverarbeitung](https://www.netcup.com/de/helpcenter/dokumentation/general/avv).
- Q2 [netcup Zertifikat ISO IEC 27001](https://www.netcup.com/uploads/e231472_netcup_Gmb_H_27001_1_Ue_A_25_bi_DE_2a6c67b38f.pdf).
- Q3 [netcup Zertifikat ISO IEC 27701](https://www.netcup.com/uploads/Deutsch_ZER_0001159_2706_2bae5b136d.PDF).
- Q4 [DSGVO insbesondere Artikel 24 25 28 und 32 bis 34](https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32016R0679).

Zugehörig: **VVT 01 bis 04 und DSFA 01, jeweils Version 1.1**, gemeinsame Ausfüllhilfe, Inbetriebnahmeprotokoll sowie die vorhandenen Anleitungen zu Sicherung und Wiederherstellung. Die technischen Einzelbelege bleiben in der Betriebsdokumentation und im Entwicklungsprüfnachweis.
