# Datenschutzfolgenabschätzung

Fortbildungsportal Schwaben

**DSFA 01 · Version 1.0 · 28. September 2026 · Behördliche Bestätigung ausstehend**

## 1 Ergebnis und Geltungsbereich

**Unter den in Abschnitt 6 genannten und vor Freigabe zu bestätigenden Betriebsbedingungen ist das Portal aus Datenschutzsicht vertretbar betreibbar.** Für den vorgesehenen Einsatz werden geringe bis mittlere verbleibende Risiken bewertet. Ein hohes Restrisiko ist unter diesen Bedingungen derzeit nicht erkennbar. Die Bewertung berücksichtigt die bereits umgesetzten Funktionen; die noch ausstehende Abnahme des Zielbetriebs wird damit nicht vorweggenommen.

Diese kompakte DSFA umfasst Planung und Auswertung, öffentliche Fortbildungsinformation, Konten und Sicherungen sowie die anschließende behördliche Aufbewahrung. Sie ergänzt VVT 01 bis 04 und TOM 01, jeweils Version 1.0 vom 24.09.2026. Anlass ist die Einführung für ganz Schwaben. Die Beschreibung, Erforderlichkeitsprüfung, Risikoanalyse und Maßnahmen decken die Bestandteile des Art. 35 Abs. 7 DSGVO ab. [Q1]

**Verantwortung:** Nach Betriebskonzept Regierung von Schwaben, Fronhof 10, 86152 Augsburg; fachlich Sachgebiet 40.1. Betriebsverantwortliche: Doris Sippel, Beraterin digitale Bildung an der Regierung. Die ausführende Administration, Vertretung und Zuordnung der Schulämter werden in der gemeinsamen Betriebsakte bestätigt. Datenschutzkontakt laut VVT: Datenschutzbeauftragter@reg-schw.bayern.de.

### Was bereits umgesetzt ist

| Schutz | Stand und Nutzen |
| --- | --- |
| Bezirksrechte | Der Server begrenzt Fachzugriffe, Auswertungen und Downloads. Nur berechtigte Regierungskonten erhalten den fachlichen Gesamtzugriff. |
| Geschützte Verwaltungskonten | Regierungs- und BdB-Konten benötigen Passwort und zweiten Anmeldefaktor. Passwortschutz und Sitzungssperren sind vorhanden. |
| Freiwillige öffentliche Namen | Die Namensanzeige ist zunächst aus. Nur die Person selbst kann zustimmen; Widerruf und redaktioneller Stopp werden berücksichtigt. |
| Schuljahre und Fristen | Nach 400 Tagen ab Schuljahresende endet der reguläre Zugriff. Die Löschung folgt nach bestätigter Archivübernahme. |
| Verschlüsselte Sicherungen | Tägliches Vollbackup, RvS-Download mit MFA und ausdrückliche Bestätigung der Netzablage sind eingebaut. Eine lokale Testwiederherstellung wurde dokumentiert. |
| Datensparsame Veröffentlichung | Keine eingebundenen fremden Schriften, Analysewerkzeuge oder Inhalte. Öffentliche Referentenfelder enthalten keine Kontaktdaten. |

**Noch einzutragen durch Sachgebiet 40.1:** [Portaladresse und freizugebende Anwendungsversion] sowie [ungefähre Zahl der Referenten, Verwaltungskonten, beteiligten Schulämter und Veranstaltungen je Schuljahr]. Größenordnungen reichen; eine Namensliste gehört nicht in diese DSFA.

**Leseschlüssel:** „Umgesetzt“ bezeichnet den geprüften Projektstand. „Betrieb bestätigen“ bezeichnet Einrichtung oder Nachweis auf dem Netcup-Server beziehungsweise Regierungslaufwerk. Gelbe Ausfüllfelder in Word enthalten nur noch zu ergänzende Angaben.

<!-- seite -->

## 2 Verarbeitung und erforderlicher Datenumfang

Die RvS, BdBs und Referierenden planen Fortbildungen, stimmen Termine ab, veröffentlichen Angebote und erstellen schuljahresbezogene Berichte. Namen und Bezirkszuordnungen verhindern Verwechslungen und ordnen Zuständigkeiten zu. Die dienstliche E-Mail dient dem Konto und der dienstlichen Erreichbarkeit. Veranstaltungszuordnungen und Teilnehmerzahlen unterstützen Planung und Nachbereitung.

### Welche Daten tatsächlich vorgesehen sind

| Bereich | Daten und Begrenzung |
| --- | --- |
| Referenten und Konten | Vorname, Nachname, E-Mail, Bezirke, Rolle und Status. Die Verwaltung bietet auch optionale Organisation und interne Notiz. Eine Telefonnummer wird nicht erfasst. Ein eigenes Feld für eine Privatanschrift gibt es nicht. |
| Fortbildungen und Auswertung | Titel, Beschreibung, Termine, Ort, Themen, Form, Referentenzuordnung, Bearbeitungsstand und Nachbereitung. Teilnehmerzahlen sind zusammengefasst; Auswertungen können dennoch einzelne Referenten erkennen lassen. |
| Sicherheit und Nachweise | Passwort-Prüfwerte, Sitzungsdaten, MFA-Daten, Änderungs- und Sicherheitsprotokolle sowie Zustimmung und Widerruf. Fehlanmeldungen erfassen E-Mail und IP-Adresse. |
| Öffentliche Ausgabe | Veranstaltungen mit Netzwerk- oder Beratungskennzeichnung und Schulamtsbezirk. Vor- und Nachname nur nach eigener Freigabe; Kontakte, interne Notizen und Kontodaten bleiben intern. |

Personenbezogene Teilnehmerlisten, Schülerdaten, Gesundheitsdaten, Personalakten und automatisierte Personalentscheidungen gehören nicht zum vorgesehenen Verfahren. Freitexte bleiben auf sachliche Organisationsangaben beschränkt. Die Erfassung von Telefonnummern ist aus dem Projektstand entfernt. Mit Anwendung der noch nicht produktiv durchgeführten Migration werden die Spalte und vorhandene Werte entfernt. Sicherungen aus der früheren Datenstruktur laufen nach der Sicherungsfrist aus; nach einer Wiederherstellung ist die Migration erneut anzuwenden. Diese DSFA trifft keine Aussage dazu, ob Telefonnummern in bestehenden Produktivdaten bereits bereinigt wurden.

### Datenwege und Zugriffsrechte

Angaben stammen aus Selbsteingaben, berechtigter Verwaltung und erforderlichen Übernahmen aus FIBS oder dienstlichen Beständen. Der optionale automatische FIBS-Import ist standardmäßig aus und noch nicht gegen die tatsächliche Quelle validiert. Eine bestehende FIBS-Zugriffsberechtigung begründet keine unbegrenzte Weiterverwendung.

**BdBs** bearbeiten nur zugewiesene Bezirke und deren Referentennetzwerk. **Referierende** benötigen zusätzlich die eigene Veranstaltungszuordnung. **RvS-Konten** erhalten den für Koordination und Berichte nötigen Gesamtzugriff. Die Trennung erfolgt durch Rechte in einer gemeinsamen Datenbank. Technische Administratoren können darüber hinaus zugreifen; ihre Zugänge werden organisatorisch begrenzt.

**Planungsausnahme:** Angemeldete planungsberechtigte Personen sehen bezirksübergreifend Titel, Beschreibung, Zeit, Ort, Form und Status, auch von Entwürfen. Fremde Auswertungen, Teilnehmerzahlen, Nachbereitungsnotizen und Referentenkontakte gehören nicht dazu. Freitexte dürfen diese Begrenzung nicht umgehen.

Der vorgesehene Server ist ein netcup VPS 1000 G12.5 in Nürnberg. Die RvS schließt den AVV. HTTPS mit Let’s Encrypt ist laut Betreiber vorhanden. Vorgesehener Sicherungsweg: RvS lädt das verschlüsselte Paket per HTTPS mit MFA auf einen Regierungslaptop und übernimmt es über VPN auf das Netzlaufwerk. Fachliche Archivpakete sollen getrennt bei RvS beziehungsweise Schulamt abgelegt werden; Empfänger und Zugriffsrechte sind vor der ersten produktiven Übergabe festzulegen.

<!-- seite -->

## 3 Erforderlichkeit und Verhältnismäßigkeit

**Rechtsgrundlagen:** Für erforderliche interne Aufgaben ist Art. 6 Abs. 1 Buchst. e und Abs. 3 DSGVO in Verbindung mit Art. 4 Abs. 1 BayDSG vorgesehen. Die KMBek Beratung digitale Bildung vom 28.05.2019, insbesondere Nrn. 3, 5 und 7, beschreibt Fortbildungsplanung, Koordination, Evaluation und Berichte. Die Einzelzuordnung steht in VVT 01. Die öffentliche Namensanzeige beruht getrennt auf freiwilliger Einwilligung nach Art. 6 Abs. 1 Buchst. a DSGVO. [Q1, Q5, Q6]

Ein zentrales Portal kann kontrollierte Zugriffe und einheitliche Löschung besser handhabbar machen als zahlreiche Tabellen- und E-Mail-Kopien. Die Ergänzung zu FIBS liegt in der bezirksbezogenen Planung, Nachbereitung und gemeinsamen Berichtserstellung. **Sachgebiet 40.1 bestätigt vor Freigabe**, dass diese Aufgaben und Auswertungen benötigt werden; Angaben werden nicht allein deshalb übernommen, weil sie anderswo verfügbar sind.

Referentenbezogene Zahlen dienen dem Fortbildungsangebot. Sie dürfen ohne neue Prüfung nicht als Leistungsrangliste oder Grundlage dienstlicher Personalentscheidungen genutzt werden. Kleine Fallzahlen können zu Fehlinterpretationen führen; eine technische Unterdrückung solcher Werte besteht derzeit nicht. Außerhalb des zuständigen Fachkreises werden Berichte deshalb zusammengefasst und vor Weitergabe auf Personenbezug geprüft.

### Aufbewahrung nach Zweck

| Daten | Regel und noch erforderliche Entscheidung |
| --- | --- |
| Operative Veranstaltungen | 400 volle Kalendertage ab 1. August nach Schuljahresende, dann reguläre Zugriffssperre. Endgültige Bereinigung nach geprüfter Archivübernahme. Bei Übergabefehlern bleibt der Zugriff gesperrt; begründete Sonderdownloads sind höchstens sieben Tage freischaltbar. |
| Fachliche Archivpakete | RvS oder zuständiges Schulamt. Nur erforderliche Veranstaltungs- und Nachweisdaten; keine Kontakte, Notizen, Beschreibungen oder Kontogeheimnisse. Frist, Berechtigte und Aussonderung sind behördlich festzulegen. |
| Sicherungen | Server standardmäßig 30 Tage, Metadaten 365 Tage. Netzablage: 30 Tage vorgeschlagen; das Werkzeug behält zusätzlich die zwei neuesten geprüften Dateien. Bereinigung dort benötigt Werkzeuglauf oder Aufgabenplanung. |
| Konten und weitere Nachweise | Eigene Fristen für ausgeschiedene Personen, Einwilligungsnachweise, öffentliche Anzeige und Exporte festlegen. Anwendungslogs derzeit 365 Tage; für Fehlanmeldungen und Serverlogs die erforderliche Dauer bestätigen oder anpassen. |

Die 400 Tage gelten ab Schuljahresende, nicht ab Veranstaltungstermin. Sperrung bei fehlender Archivübernahme erlaubt keine unbegrenzte Aufbewahrung: Übergabestörungen werden bearbeitet und begründet dokumentiert. Eine bloße Netzablage ist auch kein gesetzliches Dauerarchiv.

**Betroffenenrechte:** Die RvS stellt Informationen nach Art. 13/14 DSGVO bereit und bearbeitet Auskunft, Berichtigung, Widerspruch und Löschung über die benannte Stelle. Widerruf der öffentlichen Namensanzeige ist im eigenen Konto möglich und hat keine Nachteile für dienstliche Aufgaben. Bei Wiederherstellung werden zwischenzeitliche Löschungen, Sperren und Widerrufe vor Wiederaufnahme nachgeführt. Dienstliche Archivpflichten bleiben begründungspflichtig.

<!-- seite -->

## 4 Einordnung der DSFA und Bewertungsmethode

**Die DSFA wird vorsorglich durchgeführt.** Eine abschließende Pflichtentscheidung ist für die Erstellung nicht erforderlich. Maßgeblich sind Art und Umfang der Verarbeitung sowie mögliche Folgen für Menschen; Schutzmaßnahmen werden erst bei der Bewertung des verbleibenden Risikos angerechnet. Die nachfolgenden Kriterien orientieren sich an den Arbeitshilfen des BayLfD. [Q2, Q3, Q4]

| Kriterium | Einordnung des Portals |
| --- | --- |
| Bewerten oder Einstufen | Relevant: Referentenfilter und personenbezogene Veranstaltungs- und Auslastungszahlen. Keine vorgesehene Leistungsbewertung; tatsächliche Nutzung bestätigen. |
| Automatisierte erhebliche Entscheidungen | Nicht vorgesehen. Das Portal entscheidet nicht über dienstliche Rechte oder berufliche Chancen. |
| Systematische Überwachung | Keine laufende Verhaltens- oder Aufenthaltsüberwachung. Sicherheitslogs dienen dem Betrieb. |
| Höchstpersönliche oder besonders sensible Daten | Nicht vorgesehen. Optionale Notizen und importierte Texte benötigen Inhaltsdisziplin. |
| Großer Umfang | Schwabenweiter Einsatz; Mengen noch in Abschnitt 1 ergänzen. Die geografische Reichweite allein entscheidet die Frage nicht. |
| Zusammenführen verschiedener Datenbestände | Begrenzte Veranstaltungsübernahme und Zuordnung; kein vorgesehenes umfassendes Profil aus fremden Quellen. |
| Schutzbedürftige Personen | Beschäftigtenverhältnis beachten: Freiwilligkeit der Veröffentlichung und mögliche berufliche Nachteile sind relevant. |
| Neue Technologien | Übliche Webanwendung; keine KI, Biometrie oder neue Überwachungstechnologie im beschriebenen Verfahren. |
| Ausschluss von Rechten oder Leistungen | Nicht vorgesehen. Ablehnung der Namensanzeige verhindert weder Konto noch dienstliche Tätigkeit. |

Die gesetzlichen Regelfälle sind nach diesem Konzept nicht ersichtlich. Besonders zu prüfen ist Fallgruppe 7 der Bayerischen Blacklist: Referentenauswertungen dürfen nicht zu umfangreicher Beschäftigtenbewertung mit erheblichen Folgen werden. Eine Personalaktenverwaltung nach Fallgruppe 8 ist nicht vorgesehen. Umfang und tatsächliche Verwendung entscheiden die abschließende Einordnung; MFA oder Bezirksrechte ersetzen diese Prüfung nicht. Eine fremde DSFA wird nicht als Befreiung beansprucht. [Q3]

### Wie die Risiken bewertet werden

Bewertet werden Folgen für Betroffene: Offenlegung, berufliche Nachteile, falsche Zuordnungen, Verlust von Kontrolle oder erschwerte Rechteausübung. Eintrittswahrscheinlichkeit **E** und Schadensschwere **S** erhalten jeweils 1 = gering, 2 = mittel oder 3 = hoch. Als Orientierung gilt E × S: 1–2 gering, 3–4 mittel, 6–9 hoch. Die Werte sind begründete Einschätzungen, keine gemessenen Wahrscheinlichkeiten.

„Ausgang“ beschreibt das jeweilige Szenario ohne seine Gegenmaßnahmen. „Rest“ berücksichtigt umgesetzte Funktionen und ausdrücklich benannte Betriebsmaßnahmen. Eine noch unbestätigte Betriebsmaßnahme wird nicht als bereits wirksam behauptet. Die Tabellen geben das erwartete Restrisiko bei erfüllten Betriebsbedingungen an; Abschnitt 6 hält die dafür nötigen Nachweise fest. Ein hohes Risiko darf nicht allein durch einen rechnerischen Mittelwert relativiert werden.

<!-- seite -->

## 5 Risiken und wirksame Gegenmaßnahmen

### Zugriffe und Veröffentlichungen

| Risiko und mögliche Folgen | Gegenmaßnahmen und Begründung | Ausgang → Rest |
| --- | --- | --- |
| **R1 Fremde Bezirksdaten oder falsche Rechte.** Unberechtigte sehen Kontakte, Einsatzdaten oder Auswertungen. Betroffene verlieren Vertraulichkeit; falsche Zuordnungen können dienstliche Missverständnisse erzeugen. | **Umgesetzt:** serverseitige Bezirksprüfung auch bei Auswertungen und Downloads, Referentenzuordnung, lokale Bereichstests. **Betrieb:** Identität, Rollenvergabe und Ausscheiden prüfen. Fehler bleiben möglich, ein bloß veränderter Link genügt aber nicht für Zugriff. Zuständig: SG 40.1 und Administration. | E2/S2 = **mittel** → E1/S2 = **gering** |
| **R2 Ungewollte öffentliche Personenangaben.** Namen oder Kontakte geraten durch Freitext, Import oder Kalenderausnahme an einen zu großen Empfängerkreis. Internetkopien können fortbestehen. | **Umgesetzt:** eigene Zustimmung, Widerruf, eingeschränkte öffentliche Datenfelder, keine Kontakte im Planungskalender. **Betrieb:** Texte vor Veröffentlichung prüfen; auch interne Planungstexte sparsam halten. Technische Namensfreigabe bereinigt Freitext nicht. Wegen manueller Inhalte bleibt ein mittleres Risiko. Zuständig: BdBs. | E3/S2 = **hoch** → E2/S2 = **mittel** |
| **R3 Unzulässige Interpretation von Referentenzahlen.** Kleine Fallzahlen oder geringe Auslastung werden als individuelle Leistung interpretiert und verursachen berufliche Nachteile. | **Umgesetzt:** Zugriff auf zuständige Bezirke beziehungsweise berechtigte RvS-Konten beschränkt. **Organisatorisch festzulegen:** Nutzung nur für Angebot und Planung, keine Personalranglisten; Berichte vor Weitergabe zusammenfassen und erläutern. Einzelreferentenfilter und kleine Gruppen sind technisch möglich. Zuständig: SG 40.1. | E2/S3 = **hoch** → E1/S3 = **mittel** |
| **R4 Übernommenes Konto oder kompromittierter Server.** Unbefugte lesen oder verändern den Bestand, nutzen E-Mails für Täuschung oder manipulieren Einwilligungen und Zuordnungen. | **Umgesetzt:** Passwortschutz, MFA für Verwaltung, Sitzungswiderruf, Anmeldebegrenzung, abgeschirmte Datenbank in der bereitgestellten Konfiguration. **Betrieb:** TLS, Firewall, Updates und persönliche Adminzugänge nachweisen. Keine Verschlüsselung der gesamten ruhenden Datenbank im Projekt belegt; Schutz beruht insoweit auf Server- und Zugangskontrollen. Zuständig: Administration. | E2/S3 = **hoch** → E1/S3 = **mittel** |

Ein mittleres Restrisiko bedeutet hier, dass trotz wirksamer Maßnahmen beispielsweise Fehlbedienung, zweckwidrige Nutzung oder ein gezielter Angriff möglich bleibt. Es verlangt eine zuständige Person und regelmäßige Kontrolle, nicht automatisch neue Technik oder eine Meldung an die Aufsichtsbehörde.

### Sicherungen und Aufbewahrung

| Risiko und mögliche Folgen | Gegenmaßnahmen und Begründung | Ausgang → Rest |
| --- | --- | --- |
| **R5 Unbefugter Zugriff auf Sicherung oder Export.** Eine vollständige Sicherung enthält alle Bezirke, Kontodaten und Betriebsschlüssel. Unverschlüsselte Fachkopien können ebenfalls fremde Einblicke ermöglichen. | **Umgesetzt:** Vollbackup vor Download verschlüsselt, Download nur RvS mit MFA, Prüfsumme und Übernahmebestätigung. **Betrieb:** privaten Entschlüsselungsschlüssel getrennt verwahren, freigegebene Netzrechte nutzen, lokale Kopien bereinigen. Archiv- und gewöhnliche Fachpakete sind nicht automatisch wie das Vollbackup verschlüsselt. Zuständig: Sicherungsverantwortliche und Administration. | E2/S3 = **hoch** → E1/S3 = **mittel** |
| **R6 Verlust oder unbrauchbare Wiederherstellung.** Zuordnungen und Nachweise fehlen; Auskünfte, Berichtigungen und der Nachweis einer Zustimmung werden erschwert. | **Umgesetzt:** tägliche Sicherung ab 06 Uhr, Portalhinweis bis bestätigter Netzablage, Integritätsprüfung; lokale Wiederherstellung erfolgreich geprüft. **Betrieb:** tägliche Zuständigkeit mit Vertretung, Netzübernahme und Wiederanlauf tatsächlich testen. Der Hinweis wirkt nur beim Portalbesuch. Zuständig: Betriebsstelle. | E2/S2 = **mittel** → E1/S2 = **gering** |
| **R7 Zu lange Aufbewahrung oder Wiederkehr alter Daten.** Ausgeschiedene Personen bleiben sichtbar; gelöschte Daten oder widerrufene Namen kehren nach Wiederherstellung zurück. | **Umgesetzt:** Schuljahresfrist, zentrale Sperre, bestätigte Übergabe, Serverbereinigung und Werkzeug für die Netzablage. **Betrieb:** Archiv- und Nachweisfristen festlegen, hängende Übergaben erledigen, nach Restore Löschungen/Widerrufe nachführen. Zwei letzte Sicherungen können länger bleiben und benötigen Kontrolle. Zuständig: SG 40.1, Registratur und Betrieb. | E3/S2 = **hoch** → E2/S2 = **mittel** |
| **R8 Unnötige Freitexte und Protokolle oder unerledigte Anträge.** Unzutreffende Bemerkungen, überlange IP-Speicherung oder fehlende Ansprechpartner erschweren Kontrolle und Berichtigung. | **Umgesetzt:** beschränkte Fachzugriffe, Änderungsnachweise und 365-Tage-Bereinigung. **Betrieb:** Notizen auf Organisation begrenzen, Logfristen und Zugriff festlegen, Anträge über einen bekannten Kontakt bearbeiten. Zuständig: SG 40.1 und Administration mit Datenschutzberatung. | E2/S2 = **mittel** → E1/S2 = **gering** |

**Gesamtbewertung:** Die wesentlichen Risiken werden durch bereits eingebaute Funktionen und überschaubare Betriebsregeln behandelt. Das erwartete Restrisiko ist gering bis mittel. Die Bewertung setzt den begrenzten Datenumfang und die bestätigte praktische Einrichtung voraus; ohne die Betriebsnachweise bleibt sie eine bedingte Bewertung.

<!-- seite -->

## 6 Abschluss und laufende Verantwortung

Die folgenden Punkte bündeln bereits bekannte Aufgaben aus TOM, VVT und Betriebsfreigabe. Vorhandene Behördenregelungen und ein gemeinsames Inbetriebnahmeprotokoll genügen als Nachweis; es müssen keine parallelen Nachweisakten entstehen.

| Wer | Noch konkret zu bestätigen | Wann |
| --- | --- | --- |
| **Sachgebiet 40.1** | Umfang aus Abschnitt 1; verantwortliche Stelle und Schulämter; Bedarf für personenbezogene Auswertungen, Rollen und Planungsausnahme; keine Nutzung zur Personalbewertung. | Vor Freigabe |
| **Vertragsstelle und Betrieb** | Netcup-Vertrag mit AVV/Anlagen, konkrete Instanz Nürnberg, zulässige Supportwege und tatsächliche Dienstleister. | Vor Freigabe |
| **Projektteam und Administration** | Serverzugänge, TLS, Firewall, MFA und Bezirksgrenzen am Zielsystem; Zuständigkeit für Updates und Vorfälle. Tatsächlichen Speicherschutz dokumentieren, ohne pauschale Zusage einer Vollverschlüsselung. | Vor Freigabe |
| **Doris Sippel und benannte Ausführende** | Netzpfad und Rechte, age-Schlüsselverwahrung, tägliche Person und Vertretung; erfolgreiche Übernahme und Wiederherstellung, Bereinigung auf Server und Netzlaufwerk. | Vor Freigabe |
| **SG 40.1 und Registratur** | Archivfrist samt Rechtsgrundlage, Fristbeginn und Aussonderung; abgestimmte Fristen für Konten, Nachweise, öffentliche Anzeige, Logs und Exportkopien. | Vor Freigabe |
| **SG 40.1 und Datenschutz** | Informationen für Betroffene, Ansprechpartner, kurze Einweisung zu Freitexten und Berichten; Beratung und Entscheidung unten dokumentieren. | Vor Freigabe |

**Beteiligung:** Die behördliche Datenschutzbeauftragte berät nach Art. 35 Abs. 2; die befugte verantwortliche Stelle entscheidet. Diese prüft wegen der referentenbezogenen Auswertungen eine angemessene Beteiligung nach Art. 35 Abs. 9. Dafür kommt eine kurze Rückmeldung künftiger Referierender oder ihrer Vertretung infrage. **[Datum und Ergebnis der Datenschutzberatung sowie Betroffenenbeteiligung oder begründetes Absehen ergänzen]**. [Q1]

**Entscheidungsvorschlag:** Die RvS übernimmt diese DSFA für den beschriebenen Betrieb. Die dokumentierten geringen bis mittleren Restrisiken werden nach Bestätigung der zugeordneten Maßnahmen getragen. Eine vorherige Konsultation nach Art. 36 DSGVO ist nach dieser Bewertung nicht angezeigt; sie wäre vor Beginn erforderlich, wenn trotz angemessener Abhilfe ein hohes Restrisiko verbleibt. Eine gesonderte Erlaubnis der Aufsicht wird durch die Erstellung dieser DSFA nicht benötigt. [Q1]

**Verbindlich ausfüllen:** [Entscheidende Person und Funktion, Datum, Aktenzeichen, tatsächliche Entscheidung und gegebenenfalls Restpunkte mit zuständiger Person und Termin]. Nicht erfüllte Maßnahmen werden mit ihrer Auswirkung auf die obigen Risikowerte bewertet; sie gelten nicht allein durch Unterschrift als erledigt.

**Fortschreibung:** Im jährlichen Betriebscheck sowie bei wesentlichen Änderungen, insbesondere Teilnehmerlisten, sensiblen Daten, Personalbewertung, neuen Empfängern, anderer Hostinglösung oder erheblich größerem Umfang. Die erste turnusmäßige Prüfung liegt spätestens zwölf Monate nach Freigabe. Vorfälle oder versagte Schutzmaßnahmen lösen eine frühere Prüfung aus.

<!-- seite -->

## 7 Quellen und Nachweise

### Amtliche Grundlagen

Quellenabgleich am 28.09.2026. Die rechtliche Einordnung stützt sich auf die folgenden amtlichen Texte; die Risikowerte sind eine eigene Bewertung des konkreten Portals.

- Q1 [DSGVO insbesondere Art 5 bis 7 sowie 35 und 36](https://eur-lex.europa.eu/eli/reg/2016/679/oj). Anforderungen an DSFA, Beteiligung und vorherige Konsultation.
- Q2 [BayLfD Übersicht zu Datenschutzfolgenabschätzungen](https://www.datenschutz-bayern.de/nav/1801.html). Aktuelle Orientierung und Arbeitshilfen für bayerische öffentliche Stellen.
- Q3 [BayLfD Bayerische Blacklist](https://www.datenschutz-bayern.de/datenschutzreform2018/DSFA_Blacklist.pdf). Stand 01.03.2019; besonders Fallgruppen Beschäftigte und Personalverwaltung.
- Q4 [BayLfD Formular zur Erforderlichkeitsprüfung](https://www.datenschutz-bayern.de/dsfa/2-1-2_DSFA-Erforderlichkeit.pdf). Kriterien und dokumentierte Gesamtwürdigung.
- Q5 [Art 4 BayDSG](https://www.gesetze-bayern.de/Content/Document/BayDSG-4). Aufgabenbezogene Verarbeitung durch öffentliche Stellen.
- Q6 [KMBek Beratung digitale Bildung vom 28 Mai 2019](https://www.verkuendung-bayern.de/baymbl/2019-251/). Fachaufgaben der Beratung und Koordination; ergänzende Aufgabenquellen in VVT 01.

### Vorhandene Projektunterlagen

**TOM 01 und VVT 01 bis 04, Version 1.0 vom 24.09.2026:** Maßgeblich für Rollen, Datenkategorien, Quellen, Empfänger und getrennte Aufbewahrungszwecke. Diese DSFA ergänzt die dort noch angekündigte Risikoanalyse.

**Technischer Prüfnachweis vom 24.09.2026:** Dokumentiert lokale Prüfungen zu Bezirksrechten, Namensfreigabe, Schuljahresfrist, Archiv, MFA und echter verschlüsselter Sicherung mit Wiederherstellung in einer separaten Testdatenbank. Diese Prüfungen müssen für die Dokumentenerstellung nicht wiederholt werden. Sie belegen keinen Durchlauf im RvS-Netz oder auf dem produktiven Netcup-Server.

**Betriebsunterlagen:** INBETRIEBNAHME.md, BETRIEBSFREIGABE_UND_VERANTWORTUNG.md, AUSFUELLHILFE_REGIERUNG.md sowie BACKUP_UND_WIEDERHERSTELLUNG.md. Die konkrete Betriebsakte wird über das Aktenzeichen aus Abschnitt 6 zugeordnet.

### Abgleich mit der Anwendung

Der Abgleich vom 28.09.2026 umfasst das Referentenmodell und die Verwaltungsmaske, Berechtigungsscope, Auswertungslogik, Namensfreigabe, MFA, Schuljahresfrist, Archiv, Vollbackup und bereitgestellte Serverkonfiguration. Festgehalten werden insbesondere die optionalen Organisations- und Notizfelder, personenbezogenen Referentenfilter, logische Bezirkstrennung und fehlende Zusage einer Verschlüsselung der gesamten ruhenden Datenbank.

**Änderungsstand:** Version 1.0 vom 28.09.2026 erstellt die gemeinsame DSFA zu den vier VVT-Tätigkeiten. Angaben zur Durchführung der Behördenberatung und zur tatsächlichen Betriebsfreigabe werden erst nach ihrem Vollzug ergänzt.
