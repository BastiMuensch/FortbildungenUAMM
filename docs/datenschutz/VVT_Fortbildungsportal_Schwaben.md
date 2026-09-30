# Verzeichnis von Verarbeitungstätigkeiten

Fortbildungsportal Schwaben

**Dokument VVT 01 bis 04 · Version 1.0 · Stand 24. September 2026 · Freigabe offen**

## 1 Gemeinsame Angaben

Dieses Verzeichnis beschreibt vier getrennte Verarbeitungstätigkeiten des Fortbildungsportals für das Referentennetzwerk digitale Bildung und die Beratung digitale Bildung in Schwaben. Es dient der Aufnahme in das behördliche Verzeichnis nach Art. 30 Abs. 1 DSGVO. Abschnitt 1 gilt für alle vier Einträge. Die verantwortliche Stelle vervollständigt vor Freigabe noch Rechtsgrundlagen, Fristen und Betriebsnachweise. Für VVT 04 ist ein Übergabeverfahren im Tool umgesetzt; die externe Ablage und ihre Fristen sind noch nicht freigegeben.

**Verantwortliche Stelle nach Betriebskonzept:** Regierung von Schwaben, Fronhof 10, 86152 Augsburg; Telefon 0821 327-01; poststelle@reg-schw.bayern.de. **Aktenzeichen:** [ergänzen]. **Portaladresse:** [HTTPS-Adresse]. **Einführung:** [Datum und freigegebene Anwendungsversion].

**Benannte Betriebsverantwortliche:** Doris Sippel, Regierung von Schwaben, Beraterin digitale Bildung an der Regierung. Dienstlicher Direktkontakt, Vertretung und gegebenenfalls ausführende Systemadministration: **[ergänzen]**. Fachlich zuständig: **Sachgebiet 40.1**. Das Projektteam ergänzt die technischen Betriebsnachweise mit den ausführenden Personen. Die befugte Stelle bestätigt Zwecke und Zugriffsrechte; die Sachgebietszuordnung ist geklärt.

**Behördlicher Datenschutzbeauftragter:** Regierung von Schwaben, Fronhof 10, 86152 Augsburg; Telefon 0821 327-2008; Datenschutzbeauftragter@reg-schw.bayern.de. Die veröffentlichten Behördenkontakte werden übernommen; ihre Zuständigkeit für das neue Portal ist zu bestätigen. [Q1]

**Beteiligte Schulämter:** [verbindliche Liste oder versionierte Anlage]. Die Regierung bestätigt die Zuständigkeiten im gemeinsamen Verfahren. Nur soweit beteiligte Behörden Zwecke und Mittel tatsächlich gemeinsam bestimmen, ist zusätzlich eine Regelung nach Art. 26 DSGVO erforderlich.

### Gemeinsame Infrastruktur und Empfänger

Das Portal soll auf einem virtuellen Server von netcup in Nürnberg, Deutschland, betrieben werden. Auftragsverarbeiter ist die netcup GmbH, Emmy-Noether-Straße 10, 76131 Karlsruhe. Die Regierung schließt den Vertrag zur Auftragsverarbeitung (AVV); Abschlussdatum, Leistungsumfang und genehmigte Unterauftragnehmer sind in der Vertragsakte **[Fundstelle]** nachzuweisen. HTTPS, also die verschlüsselte Verbindung zum Portal, ist nach Betreiberangabe über Let’s Encrypt vorhanden. [Q2, Q3]

**Datensicherungen:** Die Anwendung erzeugt täglich ab 06:00 Uhr Europe/Berlin eine age-verschlüsselte Vollsicherung im Server-Spool. Ein MFA-geschütztes RvS-Konto übernimmt sie per HTTPS/VPN auf ein RvS-Netzlaufwerk und bestätigt dort Ablage und SHA-256; das Portal hat keinen Zugriff auf das Laufwerk. Konkreter UNC-Pfad, Berechtigte, Schlüsselverwahrung und Vertretung: **[ergänzen]**. Das fachliche Archiv wird getrennt bei der Regierung von Schwaben oder den zuständigen Schulämtern geführt; Sicherungen und Archiv haben unterschiedliche Zwecke, Zugriffsrechte und Fristen.

**TOM für alle Einträge:** Anlage TOM 01, Version 1.0 vom 24.09.2026. Sie beschreibt technische und organisatorische Schutzmaßnahmen und kennzeichnet Projektstand, Betreiberangaben, Anbieternachweise und offene Sollmaßnahmen. Technische Administratoren und vertraglich zulässiger Anbietersupport können nur bei Erforderlichkeit zugreifen; Umfang und Anlass sind zu begrenzen.

<!-- seite -->

## 2 VVT 01 Fortbildungsplanung und Auswertung

**Verfahrensverantwortung:** Regierung von Schwaben, Sachgebiet 40.1; Betriebskontakt Doris Sippel. Planung, Bezirksrechte, Auswertungen und die 400-Tage-Regel sind im Tool umgesetzt. Vor dem Regelbetrieb bestätigt die Betriebsstelle die Einrichtung und dokumentiert Übergabe und Löschung.

### Zwecke und Rechtsgrundlagen

Das Portal unterstützt die Organisation dienstlicher Fortbildungen: Es ordnet Referierende Bezirken und Veranstaltungen zu, hilft bei der Terminabstimmung, dokumentiert Freigaben und Nachbereitung und erstellt schuljahresbezogene Berichte zum Fortbildungsangebot. Diese Auswertungen dienen der fachlichen Planung und Nachweisführung. Eine personenbezogene Leistungs- oder Verhaltenskontrolle ist nicht vorgesehen.

**Rechtsgrundlage:** Art. 6 Abs. 1 Buchst. e und Abs. 3 DSGVO in Verbindung mit Art. 4 Abs. 1 BayDSG, soweit die Verarbeitung erforderlich ist. Die fachliche Aufgabe konkretisieren die KMBek Beratung digitale Bildung vom 28. Mai 2019 Nrn. 3, 5 und 7 (Fortbildungsplanung, Evaluation, Koordinierung von Bedarfen, Referenten und Ressourcen, Jahresplanung und Bericht), die KMBek Lehrerfortbildung Abschnitt IV Nrn. 3.1, 3.1.1 und 3.2 (regionale/lokale Lehrerfortbildung und Betreuung des Referentennetzes) sowie das KMS vom 26. Juli 2021 I.4-BS4400.27/342/92 (Einsatz des Experten- und Referentennetzwerks zur Unterstützung schulischer Fortbildungsplanung). Die verantwortliche Stelle bestätigt Zuständigkeit und Erforderlichkeit je Datenkategorie; eine pauschale Einwilligung für notwendige interne Dienstaufgaben ist nicht vorgesehen. [Q4, Q5, Q13, Q14, Q15]

### Betroffene und Daten

Betroffen sind referierende Lehrkräfte sowie Beschäftigte der BdB und Regierung von Schwaben (RvS), die Fortbildungen bearbeiten. Gespeichert werden Vor- und Nachname, dienstliche Organisation und erforderliche dienstliche Kontaktdaten, Bezirkszuordnung und Rolle. Hinzu kommen die für die Planung nötigen Angaben zu Veranstaltungen: Zuordnung, Titel, Beschreibung, Termin, Ort, Themen, Kompetenzen, Format, Freigabe- und Bearbeitungsstand, organisatorische Notizen, zusammengefasste Teilnehmerzahlen und Nachbereitungsangaben. Auch zusammengefasste Teilnehmerzahlen können zusammen mit der Referentenzuordnung etwas über eine Person aussagen.

Keine personenbezogenen Teilnehmerlisten; besonders sensible Daten nach Art. 9 DSGVO, etwa Gesundheitsangaben, sind nicht vorgesehen. Unzulässige sensible Angaben in Freitexten sind zu entfernen. Konto- und Sicherheitsdaten siehe VVT 03; freiwillige Namensveröffentlichung siehe VVT 02.

### Herkunft und Empfänger

Die Angaben kommen von den Betroffenen selbst, von zuständigen Beschäftigten oder – soweit erforderlich – aus FIBS beziehungsweise behördlichen Beständen. Der vorhandene optionale FIBS-Import übernimmt Lehrgangsnummer und Link, Titel, Beschreibung, Beginn und Ende, Ort, Format, Höchstteilnehmerzahl sowie Zielgruppe/Schularten in Veranstaltungsentwürfe. Er übernimmt keine Teilnehmerlisten und legt keine Referentenprofile oder Referentenzuordnungen an. Namen und Kontakte können jedoch in übernommenen Freitexten stehen; diese werden vor Veröffentlichung geprüft. Der automatische Abruf ist standardmäßig deaktiviert; die Anbindung an die tatsächliche Quelle ist noch nicht validiert. **[Regierung: tatsächlich genutzte Quelle und Übernahmeweg bestätigen; bei FIBS die zulässige Nutzung und Erforderlichkeit der genannten Angaben bestätigen; weitere Bestände nur bei tatsächlicher Nutzung ergänzen]**. Die Übernahme wird auf erforderliche Angaben für die genannten Dienstaufgaben begrenzt; die betroffenen Personen erhalten die Datenschutzinformationen nach Art. 13 beziehungsweise 14 DSGVO.

BdBs sehen nur ihren Bezirk und das zugehörige Referentennetzwerk. Referierende sehen nur die ihnen zugeordneten Veranstaltungen. Ausdrücklich berechtigte RvS-Konten erhalten den fachlich erforderlichen Gesamtzugriff. Gemeinsame Referentenprofile sind nur in den zugeordneten Bezirken sichtbar. Mögliche technische Zugriffe durch Betrieb oder Anbietersupport sind in Abschnitt 1 beschrieben und auf das Erforderliche zu begrenzen.

**Ausnahme – interner Planungskalender:** Zur Terminabstimmung und Vermeidung zeitlicher, räumlicher und thematischer Überschneidungen sehen angemeldete planungsberechtigte Personen bezirksübergreifend Titel, Beschreibung, Zeit, Ort, Veranstaltungsform und Planungsstatus, auch von Entwürfen. Dies eröffnet keine Bearbeitungsrechte, fremden Auswertungen, tatsächlichen Teilnehmerzahlen, Nachbereitungsnotizen oder Referentenkontakte. Namen werden nicht als eigenes Kalenderfeld ausgegeben. Freitexte auf erforderliche Planungsinhalte begrenzen; Berichte und Downloads bleiben bezirksgebunden.

### Speicherbegrenzung und Schutz

Für Veranstaltungsdaten ist eine operative Frist von 400 vollen Kalendertagen ab dem 1. August nach dem betreffenden Schuljahr vorgesehen. Maßgeblich ist der Veranstaltungsbeginn in der Zeitzone Europe/Berlin. Eine Terminverschiebung wird als neue Fortbildung behandelt. Nach Ablauf sollen reguläre interne und öffentliche Zugriffe, Kalender und Downloads gesperrt werden; anschließend ist die kontrollierte Übergabe nach VVT 04 vorgesehen. Für Stammdaten gilt eine eigene, noch festzulegende Frist. Die Regel ist im Projekt umgesetzt, ihr produktiver Betrieb und die Übergabe- sowie Löschbelege stehen noch aus. Eine Übermittlung der internen Fachdaten in Drittländer ist nicht geplant; Support-, Unterauftrags- und Backupwege sind vor Freigabe tatsächlich zu prüfen. Es sind keine ausschließlich automatisierten Entscheidungen mit rechtlicher oder vergleichbar erheblicher Wirkung vorgesehen. Die gemeinsame Risikovorprüfung steht in Abschnitt 7.

<!-- seite -->

## 3 VVT 02 Öffentliche Fortbildungsinformation

**Verfahrensverantwortung:** Regierung von Schwaben, Sachgebiet 40.1. Die freiwillige Namensfreigabe und der Widerruf sind im Tool umgesetzt. Die Betriebsstelle bestätigt ihre Übernahme und Funktion auf dem vorgesehenen Server.

### Zwecke und Rechtsgrundlagen

Diese Tätigkeit informiert über dienstliche Fortbildungen auf Webseiten, in öffentlichen Kalender-Abonnements (ICS) und in Aushängen oder PDF-Dateien. Berechtigte Personen erstellen PDF-Dateien intern für Veröffentlichung oder Weitergabe; der Download dieser Dateien ist zugriffsgeschützt. Die fachliche Stelle bestätigt die zutreffende Verwendung der Kennzeichnungen „Referentennetzwerk digitale Bildung – [Schulamtsbezirk]“ und „Beratung digitale Bildung – [Schulamtsbezirk]“.

**Öffentliche personenbezogene Namensnennung:** Art. 6 Abs. 1 Buchst. a DSGVO; freiwillige, nachweisbare Zustimmung für Vor- und Nachname bei eigenen zugeordneten veröffentlichten Fortbildungen, einschließlich künftiger eigener Veranstaltungen in allen Bezirken, denen die Person zugeordnet ist. Ablehnung und Widerruf haben keine Nachteile für Konto oder dienstliche Aufgaben. **Nachweisführung:** Erforderlichkeit nach Art. 5 Abs. 2 und Art. 7 Abs. 1 DSGVO; eigene Nachweisfrist festlegen. Andere personenbezogene Inhalte benötigen eine eigene Rechtsgrundlagenprüfung.

### Betroffene und Daten

Betroffen sind zugeordnete Referentinnen und Referenten. Öffentlich erscheinen ausschließlich Vor- und Nachname, wenn die Person dies freiwillig für ihre veröffentlichten Fortbildungen freigegeben hat. Nicht veröffentlicht werden Dienststelle, Kontaktdaten, interne Kennungen, Notizen oder Kontodaten. Freie Veranstaltungstexte können dennoch einen Personenbezug enthalten und müssen deshalb gesondert geprüft werden.

Intern zum Nachweis: Identität des Kontos/Referenten, Entscheidung, Text und Version, Erteilungs-, Widerrufs- oder Stoppzeitpunkt. Für den Nachweis selbst wird keine IP-Adresse benötigt; technische Sicherheitsprotokolle werden in VVT 03 beschrieben.

### Herkunft und Empfänger

Der Name stammt aus dem Stammdatensatz. Die betroffene Person entscheidet bei der Registrierung oder im eigenen Konto über die Anzeige. BdBs können eine Anzeige stoppen, dürfen aber keine Zustimmung für andere erteilen. Bei einer Namensänderung endet eine bestehende Freigabe. Frühere Werte ohne dokumentierte Zustimmung sollen bei der Migration deaktiviert werden; der erfolgreiche produktive Vollzug ist noch nachzuweisen.

Empfänger: Internetöffentlichkeit bei Website/ICS; tatsächliche PDF-Empfänger, bei externer Veröffentlichung auch die Öffentlichkeit. Interne Nachweise bleiben berechtigten Fach-/Betriebsstellen und erforderlichen Prüfungen vorbehalten. Technisches Hosting gemäß Abschnitt 1. Die Darstellung im verlinkten FIBS-Angebot bleibt hiervon unabhängig.

### Widerruf und internationaler Bezug

Neue Abrufe berücksichtigen einen Widerruf. Zwischenspeicher des Portals sollen dann geleert werden; Kalender-Abonnements und PDF-Dateien werden so ausgeliefert, dass sie nicht regulär im Browser zwischengespeichert werden. Bereits heruntergeladene, gedruckte oder durch Dritte zwischengespeicherte Inhalte lassen sich nicht zuverlässig zurückholen. Die Namensfreigabe bereinigt keine freien Veranstaltungstexte.

Die Internetveröffentlichung ist weltweit abrufbar; darauf weist die Einwilligung hin. Weitere Dienste mit gezielter Datenübermittlung ins Ausland sind für diese Veröffentlichung nicht vorgesehen und wären bei Aufnahme gesondert zu prüfen.

**Fristen und Schutz:** Die Veröffentlichung endet bei Widerruf, Stopp oder Ablauf des gesondert festzulegenden Veröffentlichungszeitraums. Spätestens die Sperre der zugehörigen Veranstaltung nach der 400-Tage-Regel beendet ihre reguläre Anzeige im Portal. Veröffentlichungszeitraum und Dauer des Einwilligungsnachweises: **[Fristen und Begründung ergänzen]**. Den Schutz regeln TOM 04 bis 07 und 10; die Funktionsprüfung erfolgt bei Inbetriebnahme.

<!-- seite -->

## 4 VVT 03 Konten und sicherer Betrieb

**Verfahrensverantwortung:** Regierung von Schwaben; benannte Betriebsverantwortliche Doris Sippel, ausführende Administration [ergänzen]. Konten und Sicherheitsfunktionen sind im Projekt vorhanden. Welche Protokolle im Betrieb tatsächlich anfallen und wie lange sie zulässig gespeichert werden, ist teilweise noch offen.

### Zwecke und Rechtsgrundlagen

Diese Tätigkeit ermöglicht die Anmeldung, vergibt und kontrolliert Zugriffsrechte und schützt das Portal vor Missbrauch. Sie hilft, technische Fehler und sicherheitsrelevante Vorgänge nachvollziehbar zu untersuchen und Daten nach einem Ausfall wiederherzustellen. Nutzungsmarketing oder ein Profiling zur Leistungsbewertung finden nicht statt.

**Rechtsgrundlage:** Art. 6 Abs. 1 Buchst. e und Abs. 3 DSGVO in Verbindung mit Art. 4 Abs. 1 BayDSG und den für VVT 01 genannten Fortbildungsaufgaben. Art. 5 Abs. 2, 24 und 32 DSGVO begründen Sicherheits- und Rechenschaftspflichten, ersetzen aber nicht die Prüfung der Erforderlichkeit je Protokollzweck. Sitzungs- und MFA-Anmeldecookies dienen ausschließlich dem angeforderten Anmeldevorgang; hierfür ist die Ausnahme für erforderliche Cookies nach § 25 Abs. 2 Nr. 2 TDDDG vorgesehen. Zusätzliche Dienste des Zielbetriebs sind gesondert abzugleichen. [Q4, Q6, Q13, Q14, Q15]

### Betroffene und Daten

Betroffen sind Kontoinhaber, Personen bei Anmeldeversuchen, Administratoren und Besuchende des öffentlichen Portals. Verarbeitet werden Name, E-Mail-Adresse, Rolle, Bezirke und Kontostatus. Zur Absicherung kommen ein Passwort-Hash (eine nicht im Klartext gespeicherte Prüfinformation), Sitzungsstand, Anmeldezeitpunkte, Kennungen für Zugangstoken sowie Sicherheitsprotokolle mit Zeitpunkt, Handlung, betroffenem Objekt und erforderlichen Details hinzu. Für Regierungs- und BdB-Konten werden zusätzlich die verschlüsselte Grundlage für wechselnde Anmeldecodes, Prüfinformationen der Notfallcodes sowie Einrichtungs- und Rücksetzzeitpunkte gespeichert. Dieser zweite Faktor schützt das Konto auch dann, wenn das Passwort bekannt wird. Der aktuelle Projektcode sieht bei fehlgeschlagenen Anmeldungen die Protokollierung von E-Mail-Adresse und IP-Adresse vor; eine Begrenzung häufiger Versuche verwendet IP- und Kontokennungen nur vorübergehend im Arbeitsspeicher. Klartext-Passwörter sind nicht vorgesehen.

Zusätzliche Protokolle des Webservers, des vorgeschalteten Zugangsdienstes, des Betriebssystems und der Datensicherung: **[tatsächliche Felder und Umfang dokumentieren]**. Vollständige Einladungslinks und geheime Anmeldekennungen dürfen nicht in gewöhnliche Protokolle gelangen. Der Schlüssel für den zweiten Anmeldefaktor wird getrennt von der Datenbank geschützt aufbewahrt.

### Quellen und Empfänger

Die Daten stammen aus Selbsteingaben, berechtigter Kontoverwaltung, technischen Anfragen und Systemereignissen. Sicherheitsdaten sehen nur benannte Betriebs- und Sicherheitsstellen, soweit sie diese für den Betrieb oder eine konkrete Prüfung benötigen. Fachrollen erhalten dadurch keinen allgemeinen Zugriff auf Protokolle. Hosting und mögliche Anbieterkontakte sind in Abschnitt 1 beschrieben. Die Sicherung enthält Anwendungsdaten und notwendige Betriebskonfiguration einschließlich Schlüsselmaterial, liegt auf dem Server nur age-verschlüsselt und wird durch RvS mit MFA auf das Regierungslaufwerk übernommen; zuständige Personen und Berechtigungen sind noch konkret zu dokumentieren.

**Zertifikatsdienst:** ISRG/Let’s Encrypt in den USA stellt das HTTPS-Zertifikat aus und verarbeitet dafür technische Domain- und Verbindungsdaten sowie gegebenenfalls eine dienstliche Kontaktadresse. Zertifikatsangaben sind öffentlich; bestimmte Ausstellungsdaten werden laut Anbieter mindestens zwei Jahre gespeichert. Referenten- und Veranstaltungsdaten aus der Datenbank werden dafür nicht übermittelt. Den begrenzten Datenfluss und seine rechtliche Einordnung dokumentiert die Betriebsstelle einmal in der Dienstleisterübersicht. [Q7, Q8]

### Fristen und Schutzmaßnahmen

Projektstand: Sitzungen enden nach acht Stunden; das vorläufige MFA-Anmeldecookie nach fünf Minuten. Einladungs- und Passwort-Rücksetzlinks gelten höchstens 14 Tage und sind nur einmal verwendbar. Die Anwendung versendet selbst keine E-Mails; berechtigte Personen geben die Links auf dem Dienstweg weiter. Allgemeine Sicherheits- und Importprotokolle sind für 365 Tage vorgesehen. Ob die gleiche Dauer für E-Mail- und IP-Adressen aus Fehlanmeldungen erforderlich ist, muss gesondert geprüft werden. Für Kontolöschung, Webserverprotokolle, Sicherungen und Nachweise gelten die getrennten Fristen in Abschnitt 6. Vorgesehen sind TOM 01 bis 10, insbesondere Mehrfaktor-Authentifizierung, die Abnahme von Proxy und Firewall, begrenzter Protokollzugriff und getestete Sicherungen. Die Funktionsprüfung erfolgt bei Inbetriebnahme; die Risikovorprüfung wird gemeinsam in Abschnitt 7 dokumentiert.

<!-- seite -->

## 5 VVT 04 Gesonderte Aufbewahrung

**Status:** Die Erstellung eines begrenzten Archivpakets ist im Tool umgesetzt. Die Ablage ist bei der Regierung von Schwaben oder beim zuständigen Schulamt festgelegt. Konkretes System, Berechtigte, Rechtsgrundlage und verbindliche Aufbewahrungsfrist sind noch festzulegen. Eine produktive Übergabe ist erst danach zulässig. Betriebsverantwortung und Vertretung für die Aufbewahrungsablage: **[benennen]**.

### Zwecke und Rechtsgrundlagen

Nach Abschluss der operativen Nachbereitung werden erforderliche fachliche Nachweise zu dienstlichen Fortbildungen geordnet aufbewahrt. So können berechtigte Auskünfte und Prüfungen erfolgen und die spätere Aussonderung geregelt werden. Das Archiv soll keine unbefristete Sammlung aller Portalbestände sein.

**Rechtsgrundlage:** [konkrete Aufgabennorm und verbindliche behördliche Aufbewahrungsregel]. Art. 6 Abs. 1 Buchst. e DSGVO kommt nur bei entsprechend zugewiesener Aufgabe und Erforderlichkeit in Betracht; gesetzliche Aufbewahrungspflichten sind konkret zu benennen. Archivrechtliche Anbietung und Bewertung vor Vernichtung prüfen. Eine dienstliche Aufbewahrungsablage ist nicht automatisch ein öffentliches Archiv im archivrechtlichen Sinn. Aus Art. 6 BayArchivG folgt keine pauschale 30-jährige Aufbewahrung für dieses Portal. [Q9]

### Betroffene und Datenumfang

Betroffen sind die zugeordneten Referierenden. Das Archivpaket je Schuljahr und Bezirk enthält Veranstaltungsangaben, interne Referentenkennungen und Namen sowie Höchstteilnehmerzahlen in Daten- und Tabellen-Dateien mit Prüfsumme. Der technische Umfang steht fest. **[Regierung/Registratur: Erforderlichkeit bestätigen, gegebenenfalls Anonymisierung festlegen]**.

Quelle ist der abgeschlossene Bestand aus VVT 01; die Prüfsumme bestätigt seine unveränderte Übernahme. Anmelde- und Sicherheitsdaten, Kontakte, Notizen und Beschreibungen werden nicht übernommen. Sicherheits- und Einwilligungsnachweise bleiben getrennt.

### Ablage und Empfänger

**Festgelegte Ablagestellen:** Regierung von Schwaben beziehungsweise zuständiges Schulamt, jeweils für die zugeordneten Schuljahres- und Bezirksbestände. Aufbewahrungssystem, konkreter Speicherort und betreibende IT-Stelle: **[ergänzen]**. Auch bei gemeinsamer Infrastruktur benötigen Sicherungen und Archivbestände getrennte Berechtigungen, Zwecke und Fristen. Zugriff erhalten nur benannte dienstliche Archiv- und Nachweisstellen sowie berechtigte Bezirksverantwortliche für die freigegebenen Bestände; ein App-Konto berechtigt nicht automatisch zum Archivzugriff.

RvS erhält nur im erforderlichen Umfang bezirksübergreifenden Zugriff. Die laufende Anwendung erhält kein allgemeines Leserecht auf alte Archivbestände. Bei Anbietung/Abgabe an ein zuständiges staatliches Archiv Empfänger, Umfang und Rechtsgrundlage dokumentieren. Weitere Auftragsverarbeiter erst nach Prüfung und Vertragsaufnahme; konkrete Drittlandwege sind bislang nicht festgelegt und vor Freigabe auszuschließen oder rechtlich abzusichern.

### Beginn und Ende der Aufbewahrung

Die Übernahme soll vor Ablauf der 400-Tage-Frist bestätigt sein. Archivfrist **[Dauer]**, Fristbeginn **[Ereignis]**, zuständige Aussonderungsstelle **[Stelle]**, Rechtsgrundlage **[Regel/Aktenzeichen]**. Solange diese Angaben fehlen, besteht keine Entscheidung über eine dauerhafte Aufbewahrung.

TOM 07 bis 10 regeln Zugriffsrechte, unveränderte Übernahme, Lesbarkeit, Sicherung, Auskunft, Berichtigung und spätere Löschung oder Archivabgabe. Die Betriebsstelle belegt die Umsetzung; die Fachstelle bewertet zuvor Risiken und erforderlichen Schutz.

<!-- seite -->

## 6 Fristen und offene Entscheidungen

Die folgende Übersicht ist Bestandteil der vier Einträge. „Offen“ bezeichnet eine noch zu treffende, verbindlich zu dokumentierende Entscheidung; es erlaubt keine unbegrenzte Aufbewahrung.

| Datenkategorie | Vorgesehene Regel | Umsetzungsstand |
| --- | --- | --- |
| Veranstaltungen und zugehörige Auswertung | 400 vollständige Kalendertage ab 1. August nach Schuljahresende; Sperre und Bereinigung nach integritätsgeprüfter Übergabe | im Projekt umgesetzt; produktive Übergabe- und Löschbelege offen |
| Erforderliche fachliche Archivunterlagen | gesonderte behördliche Frist und Fristbeginn | RvS/Schulamt festgelegt; Dauer und konkrete Ablage offen |
| Referentenstammdaten und Konten | solange für laufende Aufgaben erforderlich; mindestens jährliche Erforderlichkeitsprüfung | Frist nach Ausscheiden offen |
| Öffentliche Namen | bis Widerruf/Stopp oder Ablauf des festzulegenden Veröffentlichungszeitraums | Widerruf im Projekt umgesetzt; Veröffentlichungszeitraum offen |
| Einwilligungs- und Informationsnachweise | gesonderte, begründete Nachweisfrist | verbindliche Dauer und Bereinigungsverfahren offen |
| Sicherheits- und FIBS-Importprotokolle | im aktuellen Projekt 365 Tage; je Ereignis auf Erforderlichkeit prüfen | im Projekt umgesetzt, betriebliche Kontrolle offen |
| Webserver-, Proxy- und Systemlogs | kurze zweckbezogene Fristen; Vorfälle nur begründet länger | Umfang und Dauer offen |
| Sitzungen und Zugangstoken | Sitzung acht Stunden; MFA-Anmeldung fünf Minuten; Einladungs-/Rücksetzlinks höchstens 14 Tage und einmalig | fachliche Sperre im Projekt umgesetzt; physische Restbereinigung prüfen |
| Vollsicherungen | täglich ab 06:00 Uhr, Server 30 Tage (7–90), Metadaten 365 Tage; Netzlaufwerk Vorschlag 30 Tage (7–90), zusätzlich zwei neueste geprüfte Dateien | Portalablauf umgesetzt; UNC-Pfad, Rechte, Schlüssel, Vertretung und erster Test offen |
| Heruntergeladene interne Exporte | nur erforderliche dienstliche Nachbereitung; danach löschen oder kontrolliert übernehmen | konkrete Ablage- und Fristregel offen |

**Berechnung:** Ein Schuljahr läuft vom 1. August bis einschließlich 31. Juli. Maßgeblich ist der Veranstaltungsbeginn in Europe/Berlin. Beispiel Schuljahr 2026/2027: Nachlauf beginnt am 01.08.2027, letzter regulärer Zugriffstag ist 03.09.2028; Fristablauf am 04.09.2028 um 00:00 Uhr. Frühe Veranstaltungen desselben Schuljahres bleiben insgesamt länger als 400 Tage gespeichert. Änderungen verlängern die Frist nicht.

**Produktionsgrenze:** Die technische Umsetzung im Projekt ersetzt keine produktive Migration, keine freigegebene Archivablage und keinen Lösch- oder Übernahmebeleg. Protokollfristen werden weiterhin getrennt je Zweck überprüft.

**Verfahren bei Störungen:** Vor Ablauf Übergabe prüfen. Bei Fehlern nur dokumentierter, zeitlich begrenzter Sonderzugriff; zuständige Stelle alarmieren und Rechtsgrundlage der ausnahmsweisen Weiteraufbewahrung bewerten. Sicherungen sind nicht das fachliche Archiv und dürfen gelöschte Daten nach Wiederherstellung nicht dauerhaft wieder in den Normalbetrieb bringen.

<!-- seite -->

## 7 Prüfung und Pflege des Verzeichnisses

### Vor Freigabe zu vervollständigen

Die [Ausfüllhilfe](AUSFUELLHILFE_REGIERUNG.md) trennt beantwortete Projektangaben, Entscheidungen der Regierung und Nachweise des IT-Betriebs. Die folgenden Punkte sind keine Aufforderung, technische Angaben nochmals durch die Datenschutzbeauftragte ermitteln zu lassen.

- Verantwortlichkeit zwischen Regierung und beteiligten Schulämtern, Aktenzeichen, Portaladresse, Betriebsvertretung und administrative Zugriffsberechtigte.
- Konkrete Aufgabennorm je internem Zweck, zulässiger Umfang personenbezogener Auswertungen und Rechtsgrundlage jeder Übernahme aus FIBS/anderen Beständen.
- AVV samt Anbieter-TOM und Unterauftragnehmern, technische Zugriffswege, Zertifikatsdienst und gegebenenfalls weitere Empfänger einschließlich Drittlandbewertung.
- Öffentlichen age-Schlüssel, Schlüsselverwahrung, UNC-Pfad und Berechtigungen, tägliche Vertretung sowie Ablage- und Wiederherstellungstest; davon getrennt konkrete Archivablage bei RvS beziehungsweise Schulamt, Inhalt und verbindliche Aufbewahrungsfristen.
- Tatsächliche Umsetzung der 400-Tage-Regel, Protokoll- und Nachweisfristen sowie Enddatum der öffentlichen Anzeige.
- Informationen nach Art. 13/14 DSGVO und Verfahren für Auskunft, Berichtigung, Widerruf, Löschung und Beschwerden. Dokumentierte DSFA-Schwellenprüfung je Tätigkeit; falls erforderlich DSFA vor Beginn.

**Risikogerechte Prüfung:** Ausgangspunkt ist eine kurze, gemeinsame Vorprüfung anhand der BayLfD-Kriterien. Das Portal verarbeitet dienstliche Planungsdaten; besondere Datenkategorien, personenbezogene Teilnehmerlisten und automatisierte Entscheidungen über Personen sind nicht vorgesehen. Zu betrachten bleiben insbesondere der Umfang, Auswertungen mit Referentenbezug und die freiwillige Veröffentlichung. Eine vollständige Datenschutz-Folgenabschätzung ist nur bei voraussichtlich hohem Risiko erforderlich. Ergebnis und Begründung: **[kurzen Prüfvermerk ergänzen]**. [Q16]

**Verzeichnisführung:** [Regierung: führende Stelle/Person benennen; fachlicher Ansprechpartner ist Sachgebiet 40.1]. **Letzte Prüfung:** [Datum]. **Nächste Prüfung:** spätestens zwölf Monate nach Freigabe sowie anlassbezogen bei Änderung von Zweck, Empfängern, Technik, Datenumfang oder Fristen. Das VVT wird intern geführt und der Aufsichtsbehörde auf Anforderung zur Verfügung gestellt; es ersetzt nicht die Datenschutzinformationen für Betroffene. [Q10]

**Fachlich geprüft:** [Name/Funktion, Datum] · **Technisch geprüft:** [Name/Funktion, Datum] · **Datenschutzbeauftragter beteiligt:** [Datum/Stellungnahme] · **Freigegeben durch befugte Stelle:** [Name/Funktion, Datum/Aktenzeichen].

Für die Prüfung können vorhandene behördliche Regelungen und IT-Nachweise durch Verweis übernommen werden. Zusätzliche Einzeldokumente sind nur nötig, wenn eine Frage dort noch nicht geregelt ist.

### Rechtsquellen und Nachweise

Stand der Quellenprüfung 24.09.2026. Die Gliederung orientiert sich inhaltlich an den bayerischen Arbeitshilfen zum Verarbeitungsverzeichnis, ohne eine verbindliche Behördenvorlage zu ersetzen.

- Q1 [Regierung von Schwaben und Datenschutzkontakt](https://www.regierung.schwaben.bayern.de/meta/datenschutz/).
- Q2 [netcup Impressum](https://www.netcup.com/de/kontakt/impressum), Q3 [netcup Auftragsverarbeitung](https://www.netcup.com/de/helpcenter/dokumentation/general/avv).
- Q4 [Art. 4 BayDSG](https://www.gesetze-bayern.de/Content/Document/BayDSG-4), Q5 [Art. 103 BayBG](https://www.gesetze-bayern.de/Content/Document/BayBG-103).
- Q6 [§ 25 TDDDG](https://www.gesetze-im-internet.de/ttdsg/__25.html).
- Q7 [Let’s Encrypt Datenschutz](https://letsencrypt.org/privacy/), Q8 [Certificate Transparency](https://letsencrypt.org/docs/ct-logs/).
- Q9 [Art. 6 BayArchivG](https://www.gesetze-bayern.de/Content/Document/BayArchivG-6).
- Q10 [BayLfD zum Verzeichnis von Verarbeitungstätigkeiten](https://datenschutz-bayern.de/datenschutzreform2018/verarbeitungsverzeichnis.html).
- Q11 [DSGVO insbesondere Art. 5 bis 7, 13 bis 14, 24, 28, 30, 32 bis 35 und Kapitel V](https://eur-lex.europa.eu/legal-content/DE/ALL/?uri=CELEX%3A32016R0679).
- Q12 [Bayerisches Innenministerium Arbeitshilfen Stand Juni 2025, Abschnitt 6](https://www.stmi.bayern.de/media/a-z/datenschutz-in-bayern/251114_datenschutzreform-arbeitshilfen__stand_juni_2025.pdf).
- Q13 [KMBek Beratung digitale Bildung in Bayern vom 28. Mai 2019, Nrn. 3, 5 und 7](https://www.verkuendung-bayern.de/baymbl/2019-251/).
- Q14 [KMBek Lehrerfortbildung in Bayern vom 9. August 2002, Abschnitt IV Nrn. 3.1, 3.1.1 und 3.2](https://www.gesetze-bayern.de/Content/Document/BayVV_2238_UK_170-3).
- Q15 [KMS vom 26. Juli 2021 I.4-BS4400.27/342/92, Innovationsteams Digitale Bildung](https://www.schulentwicklung.isb.bayern.de/fileadmin/user_upload/Schulentwicklung/Unterstuetzungssystem/Innovationsteams_Digitale_Bildung.pdf).

Zugehörige Unterlagen: Anlage TOM 01, Umsetzungsplan, Rollenmatrix, Lösch- und Aufbewahrungskonzept, Informations- und Einwilligungstexte, AVV mit Anlagen und Betriebsnachweise. Die letzten fünf Unterlagengruppen sind vor Freigabe auf Vollständigkeit und aktuellen Betriebsbezug zu prüfen.

- Q16 [BayLfD zur risikogerechten Prüfung und Datenschutz-Folgenabschätzung](https://www.datenschutz-bayern.de/tbs/tb33/k11.html).
