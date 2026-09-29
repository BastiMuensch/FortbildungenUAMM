# Technische und organisatorische Maßnahmen

Fortbildungsportal Schwaben

**Dokument TOM 01 · Version 1.0 · Stand 24. September 2026 · Freigabe offen**

Dieses Dokument beschreibt die vorgesehenen Schutzmaßnahmen für das Fortbildungsportal. Es richtet sich an verantwortliche Stelle, Betrieb und Datenschutzbeauftragten und ergänzt VVT 01 bis 04 sowie den AVV mit dem Hoster.

**Wichtige Einordnung:** Der Quellcode dokumentiert die in der Anwendung umgesetzten Maßnahmen. Er belegt weder die Serverkonfiguration noch einen sicheren laufenden Betrieb. Der produktive Einsatz muss vor Start abgenommen werden.

| Kennzeichnung | Bedeutung |
| --- | --- |
| Projektstand | In der Anwendung umgesetzt; Einrichtung und Wirksamkeit im Zielbetrieb noch zu bestätigen. |
| Betreiberangabe | Mitgeteilt; Nachweis in der Betriebsakte ergänzen. |
| Anbieternachweis | Veröffentlichung des Dienstleisters; Bezug zum konkreten Vertrag prüfen. |
| Sollmaßnahme | Vor Betrieb umsetzen oder nachvollziehbar anders entscheiden. |

## 1 Zweck und Geltungsbereich

Das Portal unterstützt Planung, Durchführung und Auswertung von Fortbildungen des Referentennetzwerks digitale Bildung und der Beratung digitale Bildung in Schwaben. Die vorliegenden Schutzmaßnahmen dienen der Umsetzung und Dokumentation nach Art. 24, 25 und 32 DSGVO. [Q13]

Verarbeitet werden Referentenstammdaten, dienstliche Kontaktdaten, Konten und Rechte, Veranstaltungszuordnungen, zusammengefasste Teilnehmerzahlen, Nachbereitung, Auswertungen, Protokolle und Einwilligungsnachweise. Personenbezogene Teilnehmerlisten und besonders sensible Angaben, beispielsweise Gesundheitsdaten, sind nicht vorgesehen. Freitexte können trotzdem Personenangaben enthalten und werden vor Veröffentlichung geprüft.

**Zuständigkeiten:** Als verantwortliche Stelle ist die Regierung von Schwaben vorgesehen; ihr Verhältnis zu den beteiligten Schulämtern ist noch förmlich zu bestätigen. Fachlich zuständig: **Regierung von Schwaben, Sachgebiet 40.1**. Dienstlicher Fachkontakt: **[Regierung: E-Mail und gegebenenfalls Telefon ergänzen]**. Als Betriebsverantwortliche ist Doris Sippel, Regierung von Schwaben, Beraterin digitale Bildung an der Regierung, benannt. Dienstlicher Kontakt, Vertretung und ausführende Systemadministration: **[ergänzen]**. Das Projektteam trägt die technischen Betriebsnachweise zusammen; „IT-Betrieb“ bezeichnet die dafür benannten Personen und keine vorausgesetzte eigene Abteilung. Datenschutzkontakt: Datenschutzbeauftragter@reg-schw.bayern.de, 0821 327-2008; Zuständigkeit für dieses Portal bestätigen. [Q9]

Schutzbedarf besteht besonders für die Vertraulichkeit bezirksbezogener Auswertungen, die Richtigkeit von Zuordnungen und Zahlen sowie eine verlässliche Wiederherstellung. Für diesen Zweck dokumentieren Fachstelle und Betrieb eine kurze Risikoeinschätzung. Eine vollständige Datenschutz-Folgenabschätzung (DSFA) ist nur bei voraussichtlich hohem Risiko erforderlich; die Vorprüfung berücksichtigt Umfang, Zwecke und die einschlägigen Kriterien des BayLfD. [Q14]

## 2 Hosting und Auftragskontrolle

Vorgesehen ist ein **netcup VPS 1000 G12.5 am Standort Nürnberg in Deutschland**. Die Regierung von Schwaben mietet den Server und schließt den AVV. Vertrags- und Kundennummer sowie AVV-Datum: **[ergänzen]**. Die Standortwahl Nürnberg muss in Bestellung oder Bereitstellungsnachweis stehen. HTTPS mit Let’s Encrypt ist eine Betreiberangabe und im Zielbetrieb zu prüfen. [Q1, Q6, Q7]

### Zertifikate des Anbieters

| Nachweis | Bedeutung | Laufzeit laut Veröffentlichung |
| --- | --- | --- |
| ISO/IEC 27001:2022 | Informationssicherheits-Management | 18.11.2024 bis 17.11.2027 [Q2] |
| ISO/IEC 27701:2019 | Datenschutz-Management | bis 17.12.2026 [Q3] |

Die Zertifikate belegen das Sicherheits- und Datenschutzmanagement des Anbieters. Der konkrete Portalbetrieb wird ergänzend durch die hier beschriebenen eigenen Maßnahmen abgesichert. Weitere Anbieterzertifikate sind in den Quellen dokumentiert; sie sind keine zusätzlichen Freigabevoraussetzungen für das Portal.

**Anbieternachweis:** netcup beschreibt Zutrittskontrollen, Videoüberwachung, redundante Strom- und Netzversorgung, USV, Notstrom, Klimatisierung, Brandfrüherkennung und DDoS-Schutz. Für VPS in Nürnberg nennt netcup eine jährliche Mindestverfügbarkeit von 99,6 Prozent. Maßgeblich bleiben konkreter Vertrag und Bedingungen. [Q8, Q10]

**Noch zu bestätigen:** Den unterzeichneten AVV mit Anbieter-TOM und Unterauftragnehmerliste in der Vertragsakte ablegen. Dabei Standort, Supportzugriffe und Löschregelungen berücksichtigen; relevante Änderungen des Anbieters nachführen. Die Zertifikatsstände bei der Vertragsprüfung kontrollieren.

Der Anbieter verantwortet die vereinbarte Infrastruktur. Betriebssystem, Anwendung, Konten, Firewall, Sicherungen und eigene Schlüssel bleiben Aufgabe der Betriebsstelle, soweit kein weiterer Vertrag etwas anderes regelt.

## 3 Zugang und Trennung der Daten

### TOM 01 Persönliche Konten

**Im Tool umgesetzt:** Passwörter werden nicht im Klartext gespeichert. Sitzungen laufen nach acht Stunden ab und sind im Browser gegen JavaScript-Zugriff geschützt. Der Server weist gesperrte Konten und alte Sitzungen ab. Anmeldeversuche werden je Konto und IP begrenzt. Das erschwert automatisierte Passwortangriffe im vorgesehenen Betrieb mit einer Anwendungsinstanz.

Regierungs-, BdB-/Verwaltungs- und Redaktionskonten benötigen zusätzlich zum Passwort einen wechselnden Code aus einer Authenticator-App. Die Grundlage für diese Codes wird verschlüsselt gespeichert; Notfallcodes werden nur als Prüfinformation gespeichert und bei Einrichtung oder kontrollierter Rücksetzung einmal angezeigt. Ein gestohlenes Passwort reicht dadurch allein nicht aus. BdB-Konten fallen unter die technische Rolle ADMIN und sind damit bereits von dieser Pflicht erfasst.

**Noch zu bestätigen:** Dienstliche Identität und Rolle vor Freischaltung prüfen, keine geteilten Konten. Hosterverwaltung und Administratorzugänge ebenfalls mit Mehrfaktor-Anmeldung sichern. Schlüsselablage, Schlüsselwechsel, Notfallrücksetzung und Supportzugriffe dokumentieren. Bei Ausscheiden oder Rollenwechsel Konten unverzüglich prüfen und nötigenfalls sperren; die Berechtigungen zusätzlich im jährlichen Betriebscheck prüfen.

### TOM 02 Bezirksrechte und Auswertungen

**Im Tool umgesetzt:** Rechte werden auf dem Server geprüft, auch für Downloads. RvS-Konten können bezirksübergreifend arbeiten. BdB- und Redaktionskonten sehen nur zugewiesene Bezirke. Referenten brauchen zusätzlich eine eigene Veranstaltungszuordnung. Das schützt vor dem Zugriff auf fremde Auswertungen durch veränderte Adressen oder Oberflächen.

**Bewusst geregelte Ausnahme – interner Planungskalender:** Planungsberechtigte Personen dürfen bezirksübergreifend Titel, Beschreibung, Datum, Uhrzeit, Ort, Veranstaltungsform und Planungsstatus sehen, auch bei Entwürfen. Das dient Terminabstimmung und vermeidet Überschneidungen. Die Ausnahme erlaubt weder Bearbeitung fremder Veranstaltungen noch Zugriff auf fremde Auswertungen, Teilnehmerzahlen, Nachbereitungsnotizen oder Referentenkontakte. Referentennamen sind kein eigenes Kalenderfeld. Freitexte bleiben auf notwendige Planungsangaben beschränkt.

Bei mehreren Bezirkszuordnungen können notwendige Referentenstammdaten in diesen Bezirken sichtbar sein. Die Trennung erfolgt logisch in einer gemeinsamen Datenbank; sie ist keine getrennte Datenhaltung oder Verschlüsselung je Bezirk.

**Noch zu bestätigen:** Rollenmatrix und Verfahren für Vergabe und Entzug freigeben. Gemeinsame Profile und Kalenderausnahme auf erforderliche Angaben begrenzen. Kein personenbezogenes Leistungsranking ohne gesonderte Prüfung von Zweck und Rechtsgrundlage.

### TOM 03 Technische Administration

**Im Tool umgesetzt:** Die bereitgestellte Serverkonfiguration beschränkt die Systemrechte der Anwendung und sieht keinen öffentlichen Direktzugang zur Datenbank vor. Das begrenzt die Folgen möglicher Fehler. Die Betriebsstelle prüft, ob diese Konfiguration auf dem Server wirksam übernommen wurde.

**Noch zu bestätigen:** Öffentlich erreichbar ist nur der HTTPS-Zugang. Direkte Anwendungs- und Datenbankzugänge, Verwaltungsoberflächen und SSH werden durch Netzregeln, Firewall und begrenzte Administrationswege geschützt; IPv4 und IPv6 einbeziehen. Administratoren nutzen persönliche Schlüssel und geschützte Endgeräte. Ihre Zugriffe werden dokumentiert. Sie können technisch weitreichend zugreifen; Bezirksrechte der Anwendung schließen das nicht vollständig aus.

## 4 Übertragung und Vertraulichkeit

### TOM 04 Transportverschlüsselung und Schlüssel

**Vorhandener Schutz:** Nach Betreiberangabe ist HTTPS mit Let’s Encrypt vorhanden. Zusätzliche Sicherheitsvorgaben für Browser sind im Tool eingerichtet. Das schützt Daten auf dem Übertragungsweg, nicht automatisch auf Servern oder in Sicherungen.

**Noch zu bestätigen:** Portaladresse **[eintragen]** und zuständiger IT-Betrieb **[Stelle]**. Die IT bestätigt die verschlüsselte Verbindung, automatische Zertifikatserneuerung und abgeschirmte Serverzugänge in einem kurzen Inbetriebnahmeprotokoll. Technische Einstellungen werden in der Betriebsdokumentation geführt.

Die tägliche Vollsicherung wird vor Download und Übernahme mit age verschlüsselt. Der öffentliche Empfängerschlüssel liegt auf dem Server; der private Schlüssel bleibt getrennt und offline. Das Archiv enthält neben der Datenbank die erforderliche Betriebskonfiguration einschließlich JWT- und MFA-Schlüsselmaterial und ist deshalb besonders geschützt zu behandeln. HTTPS allein verschlüsselt keine gespeicherten Daten.

Let’s Encrypt stellt das HTTPS-Zertifikat aus. Dabei fallen technische Domain- und Verbindungsdaten sowie gegebenenfalls eine dienstliche Kontaktadresse an; der Dienst erhält dadurch keine Referenten- oder Veranstaltungsdaten aus der Datenbank. Den US-Anbieter und diese begrenzten Datenflüsse einmal in der Dienstleisterübersicht bewerten und dokumentieren. [Q11, Q12]

### TOM 05 Öffentliche Daten und Exporte

**Im Tool umgesetzt:** Referentennamen erscheinen öffentlich nur freiwillig und nur als Vor- und Nachname. Die Freigabe ist zunächst ausgeschaltet und kann nur von der betroffenen Person erteilt werden. Erteilung, Widerruf und redaktioneller Stopp werden mit Textversion und Zeitpunkt festgehalten. Webseite, Kalenderfeed und Aushang berücksichtigen dies. Bereits heruntergeladene oder extern zwischengespeicherte Kopien lassen sich nicht zuverlässig zurückholen.

Editorinhalte werden bereinigt. Externe Schriften, Analysewerkzeuge und eingebettete Fremdinhalte sind nicht vorgesehen. Externe Verweise, etwa zu FIBS, bleiben möglich.

**Noch zu bestätigen:** Titel, Beschreibungen, Orte und importierte Texte vor Veröffentlichung auf Namen, Kontaktdaten und Signaturen prüfen. Namensfreigabe bereinigt Freitexte nicht. Interne Exporte nur auf freigegebenen dienstlichen Ablagen speichern und fristgerecht löschen.

## 5 Nachvollziehbarkeit und Aufbewahrung

### TOM 06 Protokollierung

**Im Tool umgesetzt:** Sicherheits- und Änderungsprotokolle erfassen Konto, Zeitpunkt, Handlung und betroffenes Objekt. Fehlanmeldungen enthalten E-Mail-Adresse und IP-Adresse. Allgemeine Änderungs- und Importprotokolle werden nach 365 Tagen bereinigt. Namensfreigaben werden getrennt nachgewiesen.

Das hilft bei der Aufklärung von Fehlern und Sicherheitsereignissen, darf aber nicht zu einer unnötigen Datensammlung werden. Speicherfehler bei der allgemeinen Änderungsprotokollierung führen derzeit nur zu einer Servermeldung. Die Nachweisfrist für Namensfreigaben ist offen.

**Noch zu bestätigen:** Zweck und Zugriffsrechte jedes Protokolls sowie die Erforderlichkeit der 365 Tage für Fehlanmeldungen festlegen. Proxy-, Betriebssystem- und Sicherungsprotokolle erhalten eigene kurze Fristen. Passwörter, Sitzungstoken und vollständige Einladungslinks aus Logs ausschließen. Protokollausfälle alarmieren.

### TOM 07 Schuljahre, Archiv und Löschung

**Im Tool umgesetzt:** Fortbildungen werden nach Beginn in Europe/Berlin einem Schuljahr zugeordnet; dieses läuft vom 1. August bis 31. Juli. Operative Daten bleiben 400 vollständige Kalendertage ab dem folgenden 1. August verfügbar und werden danach zentral gesperrt, auch wenn ein Hintergrundlauf ausfällt. Beispiel 2026/2027: Zugriff bis 03.09.2028, Sperre ab 04.09.2028 um 00:00 Uhr.

Je Schuljahr und Bezirk kann ein Archivpaket erzeugt werden. Es enthält notwendige Veranstaltungsangaben, interne Referenten-IDs und Namen sowie Höchstteilnehmerzahl, aber keine Kontaktdaten, Notizen oder Beschreibungen. Ein digitaler Prüfwert kontrolliert, ob das Paket vollständig und unverändert übernommen wurde. Erst nach bestätigter Übernahme und Fristablauf werden operative Daten bereinigt.

Bei fehlerhafter Übergabe bleibt der reguläre Zugriff gesperrt. Nur die Regierung kann einen begründeten Sonderdownload für höchstens sieben Tage freigeben. Danach können berechtigte Regierungs- oder BdB-Konten das Paket für ihren Zuständigkeitsbereich herunterladen; der normale Zugriff bleibt gesperrt.

**Bereits festgelegt:** Archivziel ist Regierung von Schwaben oder zuständiges Schulamt. **Noch zu bestätigen:** Konkretes System, Pfad, Übergabeverantwortung, Berechtigte, Archivfrist, Nachweisfristen und Löschung ausgeschiedener Konten festlegen. Archiv bedeutet keine unbefristete Speicherung. Vor endgültiger Vernichtung Aufbewahrungs- und mögliche Anbietungspflichten prüfen. Nach Wiederherstellung aus Backup Löschungen, Sperren und Widerrufe nachführen.

## 6 Wiederherstellung und laufende Kontrolle

### TOM 08 Datensicherung und Verfügbarkeit

**Im Tool umgesetzt:** Ab 06:00 Uhr Europe/Berlin entsteht täglich eine age-verschlüsselte Vollsicherung der PostgreSQL-Anwendungsdaten und der notwendigen Betriebskonfiguration. Server-Spooldateien bleiben standardmäßig 30 Kalendertage (einstellbar 7 bis 90), Metadaten 365 Tage. Das Paket enthält auch Schema, Migrationen und Werkzeuge, aber kein Betriebssystem- oder Docker-Image. [Betriebsanleitung](BACKUP_UND_WIEDERHERSTELLUNG.md)

**Übernahme:** Nur RvS-Konten mit MFA laden per HTTPS auf einem Regierungslaptop herunter und legen über VPN auf dem freigegebenen RvS-Netzlaufwerk ab. Der tägliche Portalhinweis endet erst nach ausdrücklicher Bestätigung von Ablage und SHA-256 der Netzlaufwerk-Datei; ein Download genügt nicht. Das Portal hat keinen Zugriff auf das Netzlaufwerk. `Uebernehme-Vollbackup.ps1` kann Kopie, Hashprüfung und Bereinigung durchführen. Auf dem Netzlaufwerk sind 30 Tage (einstellbar 7 bis 90) vorgeschlagen; die zwei neuesten geprüften Dateien bleiben zusätzlich. Ohne Werkzeuglauf oder Windows-Aufgabenplanung erfolgt dort keine automatische Bereinigung.

**Noch zu bestätigen:** Öffentlichen age-Schlüssel, privaten Schlüsselverwahrer mit Vertretung, UNC-Pfad und Rechte, tägliche ausführende Person und Vertretung sowie den ersten erfolgreichen Ablage- und Wiederherstellungstest dokumentieren. Produktivprüfung, Netcup-Einrichtung und RvS-Netz sind nicht belegt. Das ältere hostdirekte Skript `ops/sichere-postgres-sicherung.sh` ist nur ein Alternativweg.

### TOM 09 Änderungen und Sicherheitsvorfälle

**Im Tool umgesetzt:** Prüfungen für Programmierregeln, Funktionen, Bezirksrechte und Namensfreigaben sind vorhanden; eine automatisierte Prüfung ist vorbereitet. Bei Inbetriebnahme werden die wichtigen Abläufe auf dem Zielserver geprüft.

**Noch zu bestätigen:** Betriebssystem, Container und verwendete Software regelmäßig aktualisieren. Kritische Meldungen unverzüglich bewerten. Änderungen freigeben, mit fiktiven Daten testen und einen Wiederherstellungsweg dokumentieren. Entwicklungs-, Test- und Produktivumgebung sowie Schlüssel trennen. Echte Referentendaten gehören nicht in Tests oder externe Entwicklungsdienste.

Vorfälle sofort an **[Betriebsstelle und Datenschutzkontakt]** melden. Zugriffe begrenzen, Spuren sichern, Auswirkungen bewerten und Maßnahmen dokumentieren. Die verantwortliche Stelle prüft eine Meldung an den BayLfD nach Art. 33 DSGVO grundsätzlich innerhalb von 72 Stunden nach Bekanntwerden, soweit erforderlich, sowie eine Benachrichtigung Betroffener nach Art. 34 DSGVO. [Q13]

### TOM 10 Organisation und Wirksamkeit

**Noch zu bestätigen:** Beschäftigte zu zulässiger Nutzung, Freitexten, Exportablage, Vertraulichkeit und Vorfallmeldungen einweisen. Auskunft, Berichtigung, Widerruf und Löschung auch für Exporte und Archive organisieren. TOM mindestens jährlich sowie nach Änderungen oder Vorfällen prüfen und Ergebnis, Verantwortlichkeit, Frist und Erledigung nachweisen. Über verbleibende Risiken entscheidet die befugte Fachstelle; der Datenschutzbeauftragte berät unabhängig.

## 7 Nachweise und Freigabe

Die Aufgaben sind in der [Ausfüllhilfe](AUSFUELLHILFE_REGIERUNG.md) nach Regierung und IT-Betrieb zugeordnet. Bereits aus dem Projekt beantwortete Angaben müssen nicht neu ermittelt werden. Vor dem Zielbetrieb liegt die Nachweisakte unter **[Regierung: dienstliche Ablage]**. Sie enthält keine offen abgelegten Geheimnisse.

| Nachweis | Federführung | Stand |
| --- | --- | --- |
| Standort Nürnberg, AVV, Anbieter-TOM, Unterauftragnehmer | Vertragsstelle | offen |
| Fachzuständigkeit, Betriebsverantwortung, Vertretung und Administration | Sachgebiet 40.1 und IT-Betrieb | Sachgebiet 40.1 und Doris Sippel benannt; Kontakt, Vertretung und Administration ergänzen |
| Verschlüsselte Verbindung und abgeschirmte Serverzugänge | IT-Betrieb | Abnahme offen |
| Zugriffsrechte, Identitätsprüfung, zweiter Anmeldefaktor | Fachstelle und IT-Betrieb | Rechte und zweiter Faktor umgesetzt; betriebliche Bestätigung ergänzen |
| Vollsicherung, verschlüsselte Übernahme und erfolgreiche Wiederherstellung | Sachgebiet 40.1 / benannte Betriebsstelle | Ablauf im Tool; Schlüssel, UNC-Pfad, Vertretung und Betriebsnachweis offen |
| 400-Tage-Regel, Archivpaket und externe Übernahme | Fachstelle und Entwicklung | Im Tool umgesetzt; Zielrechte und Betriebsnachweis ergänzen |
| Protokollfristen, Einwilligungsnachweise, Inhaltsprüfung | Fachstelle und Datenschutz | offen |
| Risikovorprüfung, Meldung von Vorfällen und regelmäßige Kontrolle | Verantwortliche Stelle | offen |

**Fachlich bestätigt durch:** [Name/Funktion, Datum] · **Technisch bestätigt durch:** [Name/Funktion, Datum] · **Datenschutzbeauftragter beteiligt am:** [Datum/Stellungnahme] · **Freigabe durch befugte Stelle:** [Name/Funktion, Datum/Aktenzeichen].

### Quellen und Belege

Offizielle Veröffentlichungen, abgerufen am 24.09.2026. Zertifikatslaufzeiten stammen aus den verlinkten Dokumenten; aktuellen Status vor Vertrags- und Betriebsfreigabe beim Aussteller prüfen.

- Q1 [netcup VPS 1000 G12.5 und Standortwahl](https://www.netcup.com/de/server/vps/vps-1000-g12.5-24m-eu).
- Q2 [TÜV NORD Zertifikat ISO 27001 vom 25.10.2025](https://www.netcup.com/uploads/e231472_netcup_Gmb_H_27001_1_Ue_A_25_bi_DE_2a6c67b38f.pdf).
- Q3 [CIS Zertifikat ISO 27701](https://www.netcup.com/uploads/Deutsch_ZER_0001159_2706_2bae5b136d.PDF).
- Q4 [TÜV NORD Zertifikat ISO 9001](https://www.netcup.com/uploads/23600017_netcup_Gmb_H_DIN_EN_ISO_9001_2015_Deutsch_HZERT_25_PP_PDF_7788a9e9fb.pdf).
- Q5 [Verlinktes ISO 14001 Dokument mit Ende 06.09.2026](https://www.netcup.com/uploads/23600010_netcup_Gmb_H_DIN_EN_ISO_14001_2015_Deutsch_HZERT_25_PP_PDF_5b0c6d00ce.pdf).
- Q6 [netcup Auftragsverarbeitung](https://www.netcup.com/de/helpcenter/dokumentation/general/avv), Q7 [netcup Impressum](https://www.netcup.com/de/kontakt/impressum).
- Q8 [Standort Nürnberg](https://www.netcup.com/de/ueber-netcup/server-standorte/nuernberg), Q10 [Rechenzentren und physischer Schutz](https://www.netcup.com/de/ueber-netcup/rechenzentren).
- Q9 [Regierung von Schwaben und Datenschutzkontakt](https://www.regierung.schwaben.bayern.de/meta/datenschutz/).
- Q11 [Let’s Encrypt Datenschutz](https://letsencrypt.org/privacy/), Q12 [Certificate Transparency](https://letsencrypt.org/docs/ct-logs/).
- Q13 [DSGVO, insbesondere Art. 24, 25, 28 und 32 bis 35](https://eur-lex.europa.eu/legal-content/DE/ALL/?uri=CELEX%3A32016R0679).

**Technische Projektbelege:** Authentifizierung, Berechtigungsprüfung, Protokollierung, Löschlogik, Namensfreigabe, Sicherheitsvorgaben für Browser, Container-Konfiguration und Betriebsplan sind im Quellcode und den Betriebsunterlagen dokumentiert. Maßgeblich ist der geprüfte Arbeitsstand; das Inbetriebnahmeprotokoll ergänzt die Projektbelege.

- Q14 [BayLfD zur risikogerechten Prüfung und Datenschutz-Folgenabschätzung](https://www.datenschutz-bayern.de/tbs/tb33/k11.html).
