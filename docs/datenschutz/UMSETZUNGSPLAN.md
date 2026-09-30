# Umsetzungsplan für das Referentennetzwerk digitale Bildung Schwaben

Stand: 24. September 2026 · Planungsfassung 1.4

## Ergänzte Betriebsfestlegungen

- Hosting: **netcup VPS 1000 G12.5, Standort Nürnberg**; die Regierung mietet den Server und schließt den AVV. HTTPS mit Let’s Encrypt ist nach Betreiberangabe vorhanden.
- Benannte Betriebsverantwortliche: **Doris Sippel, Regierung von Schwaben, Beraterin digitale Bildung an der Regierung**. Dienstlicher Kontakt, Vertretung und ausführende Administration werden in der Betriebsakte ergänzt.
- Backup-Ziel: **Laufwerke der Regierung von Schwaben**; die Anwendung erzeugt täglich ab 06:00 Uhr eine age-verschlüsselte Vollsicherung, die RvS mit MFA per HTTPS/VPN übernimmt. UNC-Pfad, Rechte, Schlüsselverwahrung, Vertretung und bestätigte Netzfrist werden betrieblich festgelegt.
- Fachliche Archivablage: **Regierung von Schwaben beziehungsweise zuständige Schulämter**. Konkrete Ablage je Bezirk und Schuljahr, Zugriffsrechte und Aufbewahrungsfrist bleiben zu bestimmen. Backup und Archiv haben getrennte Zwecke und Fristen.
- [TOM Version 0.4](TOM_Fortbildungsportal_Schwaben.md) und [VVT Version 0.4](VVT_Fortbildungsportal_Schwaben.md) beschreiben den Code-Stand; ihre Freigabe und die offenen Betriebsnachweise bleiben ausstehend.
- Für die tägliche verschlüsselte Vollsicherung, die bestätigte RvS-Übernahme und die getrennte Wiederherstellungsprobe stehen Werkzeuge und eine Betriebsanleitung bereit: [Backup und Wiederherstellung](BACKUP_UND_WIEDERHERSTELLUNG.md). Verantwortungs-, DSFA-, Vorfall-, Betroffenenrechte-, Aufbewahrungs- und Abnahmeentscheidungen werden in [Betriebsfreigabe und Verantwortung](BETRIEBSFREIGABE_UND_VERANTWORTUNG.md) dokumentiert.

## 1 Ziel und verbindliche Vorgaben

Das Fortbildungsportal soll als dienstliches Angebot für Schwaben betrieben werden. Die Regierung von Schwaben mietet den Server bei Netcup in Deutschland und schließt den Auftragsverarbeitungsvertrag. Der Betrieb soll fachlich, technisch und datenschutzrechtlich nachvollziehbar organisiert sein. Die freiwillige öffentliche Namensanzeige ist im Projekt umgesetzt; ihr Rollout sowie die übrigen Arbeitspakete bleiben geplant. Dieser Plan beschreibt die noch umzusetzenden Maßnahmen; er bescheinigt keine bereits erreichte Datenschutzkonformität.

Mit dem Auftraggeber festgelegt:

- Schuljahre werden getrennt geführt und ausgewertet. Ein Schuljahr läuft vom 1. August bis zum 31. Juli des Folgejahres.
- Veranstaltungs- und zugehörige Auswertungsdaten bleiben **400 Tage nach Schuljahresende** im laufenden Tool verfügbar, damit Nachbereitung und Export möglich sind.
- Anschließend werden die erforderlichen Unterlagen **separat aufbewahrt**; die betreffenden Veranstaltungsdaten werden aus der operativen Anwendung entfernt. Ein Statuswechsel zu `ARCHIVIERT` in derselben Datenbank genügt nicht.
- Die anschließende Aufbewahrungsfrist ist noch nicht bekannt. Sie wird von der zuständigen Stelle festgelegt und nicht durch die Software erfunden.
- BdBs erhalten Verwaltungs- und Auswertungszugriff nur auf ihre zugewiesenen Schulamtsbezirke. Referenten erhalten zusätzlich nur Zugriff auf eigene oder zugeordnete Veranstaltungen. RvS-Gesamtzugriff bleibt ausdrücklich berechtigten Konten vorbehalten.
- **Ausdrücklich zugelassene Ausnahme – interner Planungskalender:** Zur Terminabstimmung und Vermeidung zeitlicher, räumlicher und thematischer Überschneidungen sehen angemeldete planungsberechtigte Personen bezirksübergreifend Titel, Beschreibung, Datum, Uhrzeit, Ort, Veranstaltungsform und Planungsstatus, auch von Entwürfen. Keine Bearbeitungsrechte für fremde Veranstaltungen und kein Zugriff auf fremde Auswertungen, tatsächliche Teilnehmerzahlen, Nachbereitungsnotizen oder Referentenkontakte. Namen werden nicht als eigenes Kalenderfeld ausgegeben; Freitexte bleiben auf erforderliche Planungsinhalte begrenzt. Die Ausnahme gilt nur für die interne Planung und erweitert keine öffentlichen Veröffentlichungsrechte.
- Die vom Auftraggeber angeführte Sichtbarkeit von Veranstaltungsangaben in FIBS erläutert den fachlichen Kontext. Die Kalenderausnahme wird eigenständig mit dem Koordinierungsauftrag nach Nr. 3 der [KMBek Beratung digitale Bildung](https://www.verkuendung-bayern.de/baymbl/2019-251/) begründet und auf erforderliche Planungsdaten beschränkt; sie umfasst auch Entwürfe, deren Veröffentlichung in FIBS nicht vorausgesetzt wird.
- Es werden keine personenbezogenen Teilnehmerlisten aufgebaut. Die Anmeldung bleibt bei FIBS beziehungsweise in der schulischen Organisation.
- Referenten werden intern personenbezogen geführt. Außen erscheinen unabhängig von einer Namensanzeige für jede Veranstaltung die beiden Kennzeichnungen **„Referentennetzwerk digitale Bildung – [Schulamtsbezirk]“** und **„Beratung digitale Bildung – [Schulamtsbezirk]“**; der Platzhalter wird aus dem tatsächlichen Ausschreibungsbezirk ersetzt.
- Referenten können selbst freiwillig und standardmäßig deaktiviert per Ja/Nein-Auswahl entscheiden, ob ausschließlich ihr Vor- und Nachname öffentlich erscheint. Die eine Einwilligung gilt für den bestimmten Zweck der Namensnennung bei eigenen zugeordneten veröffentlichten Fortbildungen portalweit, auch für künftige und bezirksübergreifende eigene Zuordnungen, auf Website, öffentlichem ICS-Feed und öffentlichen Ausschreibungs-PDFs. Dienststelle und Kontaktdaten werden nicht veröffentlicht.
- Die Einwilligung wird elektronisch versioniert mit Erteilungs- und Widerrufszeitpunkt nachgewiesen; eine IP-Adresse ist hierfür nicht erforderlich. Sie ist keine Voraussetzung für Konto, Registrierung oder dienstliche Tätigkeit und jederzeit mit Wirkung für die Zukunft widerrufbar. BdBs dürfen eine Veröffentlichung nur stoppen, nie eine Einwilligung erteilen. Bestehende `true`-Werte ohne nachweisbare Einwilligung werden deaktiviert. Die optionale Word-Empfangsbestätigung bleibt unverändert und ist keine Einwilligung.

## 2 Ausgangslage im Projekt

Die folgende Bestandsaufnahme beruht auf dem Quellcode, nicht auf einer Prüfung eines laufenden Netcup-Servers. Vorhandene Tests wurden für die Erstellung dieses Plans nicht neu ausgeführt.

| Bereich | Vorhanden | Noch zu erledigen |
| --- | --- | --- |
| Schuljahre | Datenbank-Trigger für Berliner Schuljahr und 400-Tage-Frist, zentrale operative Sperre, Filter und Export | Produktive Migration und Abnahme mit Echtdaten stehen aus |
| Bezirksrechte | Zentrale Filter in `src/lib/berechtigungsScope.ts`; Auswertungen und Exporte wenden sie an | Vollständige Prüfung aller Lese- und Schreibwege sowie verpflichtende automatisierte Regressionstests |
| Berechtigungstests | Separate Tests für Datenbank, Server Actions und Exportinhalte | In reproduzierbare CI-Prüfung mit isolierter Testdatenbank übernehmen |
| Registrierung | Eingeladene Selbstregistrierung; dabei öffentliche Sichtbarkeit zunächst aus | Identität besser prüfen; Datenschutzinformationen und Informationsnachweis ergänzen |
| Veröffentlichung | Freiwillige Namensanzeige bei Registrierung und im eigenen Konto; Standard `false`, bereinigte Altwerte, versionierter Nachweis, Widerruf und BdB-Stopp | Rollout vorbereiten, Freitexte und Alttexte prüfen, Caches bereinigen und Tests ausführen |
| Aufbewahrung | Archivpaket pro Bezirk/Schuljahr mit JSON, CSV und Hash; hashgeprüfte externe Übernahme vor Bereinigung | Zielablage, Berechtigungen, Archivfrist und produktive Übernahme offen |
| Nachbereitung | Schuljahresfilter und zentrale operative Frist | Fachliche Abnahme mit Fälldaten offen |
| Betrieb | Docker, interne Datenbank, HTTPS vorausgesetzt, Passwort-Hashes und verpflichtendes TOTP für privilegierte Rollen | Eigene Netcup-Konfiguration, Schlüssel, Backup, Monitoring und Betriebsnachweise |
| Rechtstexte | Bearbeitbare Datenschutzseite; Seed enthält Platzhalter | Vollständige und freigegebene Texte sowie VVT, TOM und weitere Unterlagen |

Projektkonventionen bleiben erhalten: deutsche Bezeichner; String-Werte statt Prisma-Enums; Mutationen über Server Actions mit eigener Rollenprüfung; Filter in `searchParams`; öffentliche Sichtbarkeit zentral in `oeffentlicheFortbildungWhere()`; Datum/Uhrzeit über `datetime.ts`; keine externen Frontend-Ressourcen. Vor Codeänderungen werden die einschlägigen lokalen Next.js-Leitfäden gelesen.

## 3 Schuljahre und Fristen

### 3.1 Eindeutige Zuordnung

Eine Veranstaltung gehört nach ihrem **Beginn in Europe/Berlin** zu genau einem Schuljahr. Mehrtägige Termine über den 31. Juli hinaus werden nicht doppelt gezählt. Die Zuordnung ist bereits die fachliche Regel der Auswertung und wird überall verbindlich verwendet.

Schuljahresgrenzen werden technisch als halboffenes Intervall umgesetzt: Beginn einschließlich 1. August 00:00, Ende ausschließlich 1. August 00:00 des Folgejahres. So gehen die letzten Sekunden des 31. Juli nicht verloren. Die Datenbank speichert weiterhin UTC.

Jede Verwaltungsansicht, Nachbereitung, Kennzahl, Auswertung und jeder Export zeigt das gewählte Schuljahr und den berechtigten Bezirk. Standard ist das aktuelle Schuljahr. Eine ausdrückliche Auswahl mehrerer Jahre darf nur noch operativ verfügbare und berechtigte Jahre zusammenführen. Der Wechsel in ein anderes Jahr erweitert keine Rechte.

### 3.2 Berechnung der 400 Tage

Festgelegte Rechenkonvention: Die Nachlaufzeit beginnt am **1. August nach Schuljahresende um 00:00 Europe/Berlin**. Nach 400 vollständigen Kalendertagen endet der normale Zugriff. Kalenderarithmetik berücksichtigt Schaltjahre und Sommerzeit; es wird nicht pauschal mit Millisekunden pro Tag gerechnet.

Beispiel Schuljahr 2026/2027:

- Veranstaltungszuordnung: 01.08.2026 bis einschließlich 31.07.2027.
- Beginn der Nachlaufzeit: 01.08.2027, 00:00 Uhr.
- Letzter Tag im laufenden Tool: 03.09.2028.
- Ab 04.09.2028, 00:00 Uhr: kein regulärer Zugriff mehr; die geprüfte Archivübergabe muss vorbereitet sein, die operative Bereinigung erfolgt automatisch.

Die 400 Tage sind eine **Nachlaufzeit**. Ein Termin zu Beginn eines Schuljahres bleibt daher deutlich länger als 400 Tage gespeichert. Das wird in den Datenschutzinformationen ausdrücklich verständlich erklärt. Redaktionelle Änderungen und nachträgliche Importe verlängern die Frist nicht. Abgelaufene Veranstaltungen dürfen nicht erneut importiert werden.

### 3.3 Abschluss eines Schuljahres

Vorgeschlagene Zustände: `OFFEN`, `NACHBEREITUNG`, `ABGESCHLOSSEN`, `UEBERGABE_BESTAETIGT`, `OPERATIV_GELOESCHT`. Der Archivzustand wird getrennt vom Veröffentlichungsstatus einer Fortbildung geführt.

Nach dem 31. Juli ist das Schuljahr in Nachbereitung. Zuständige BdBs können fehlende Teilnehmerzahlen und sachliche Korrekturen bis zum Abschluss ergänzen. Ein dokumentierter Abschluss sperrt die normale Bearbeitung. Eine begründete Wiederöffnung vor Fristablauf erzeugt eine neue Exportversion und macht veraltete Übergaben erkennbar. Der Abschluss verschiebt die 400-Tage-Frist nicht.

Vorschlag für Erinnerung im Tool: 90, 30 und 7 Tage vor Ablauf. Externe E-Mail-Benachrichtigungen werden nur nach ausdrücklicher betrieblicher Festlegung eingerichtet. Zuständigkeit und Vertretung werden je Bezirk angezeigt. Automatische Archivierung darf nicht allein davon abhängen, dass jemand manuell einen Download anklickt.

### 3.4 Öffentliche Sichtbarkeit

Die 400 Tage gelten für interne Nachbereitung und Export, nicht automatisch für eine gleich lange Internetveröffentlichung. Vorschlag: Vergangene Termine werden nach Veranstaltungsende aus den öffentlichen Angeboten entfernt; abgesagte zukünftige Termine bleiben zur Information bis zum vorgesehenen Ende sichtbar. Der endgültige Veröffentlichungszeitraum wird fachlich festgelegt und in den Informationen benannt.

Die Regel greift zentral in allen Listen, Detailseiten, Suchergebnissen, Kalendern, ICS-Feeds und Vorschauen. Kopien bereits heruntergeladener Kalender oder Dokumente lassen sich technisch nicht vollständig zurückholen.

## 4 Separates Archiv und Löschverfahren

### 4.1 Ziel und Zuständigkeit

Festgelegt ist die Archivablage bei der Regierung von Schwaben beziehungsweise dem zuständigen Schulamt. Vor der Übergabe werden das konkrete System, die verantwortliche Organisationseinheit, Vertretung, Zugriffsrechte und Frist verbindlich benannt. Bevorzugt wird eine bereits zugelassene behördliche Dokumentenablage beziehungsweise ein geeignetes DMS.

Ein ZIP-Download, ein anderer Ordner im App-Container oder eine zweite Tabelle der Produktivdatenbank ist kein ausreichendes Aufbewahrungsverfahren. Das Ziel benötigt unabhängige Berechtigungen, gesicherte Ablage, Wiederherstellbarkeit und ein eigenes Fristenmanagement. Die laufende App erhält keinen allgemeinen Lese- oder Löschzugriff auf frühere Archivbestände.

Die betriebliche Aufbewahrungsablage ist nicht automatisch ein öffentliches Archiv im archivrechtlichen Sinn. Vor endgültiger Vernichtung werden die behördlichen Aufbewahrungsregeln und gegebenenfalls die Anbietungspflicht gegenüber dem zuständigen staatlichen Archiv geklärt. Aus Art. 6 BayArchivG wird keine pauschale 30-jährige Aufbewahrungsfrist für dieses Tool abgeleitet. [Quelle: Art. 6 BayArchivG](https://www.gesetze-bayern.de/Content/Document/BayArchivG-6)

### 4.2 Inhalt des Aufbewahrungspakets

Je Schuljahr und Schulamtsbezirk erzeugt die Anwendung ein eigenständiges ZIP-Paket mit JSON, CSV und Hash-Datei. Es enthält die erforderlichen Veranstaltungsangaben, Referentenzuordnung über interne IDs und Namen sowie Höchstteilnehmerzahl. RvS darf zusätzlich eine schwabenweite Zusammenfassung erhalten; BdB-Pakete enthalten niemals fremde Bezirke.

Vor Produktivfreigabe bestätigt die Fachstelle, ob zusätzlich ein Jahresbericht als PDF/A oder XLSX erforderlich ist. Diese zusätzlichen Formate sind nicht Bestandteil des technischen Minimalpakets. Der Übergabebeleg des Zielsystems und spätere Korrekturbelege werden getrennt geführt.

Keine Passwort-Hashes, Sitzungen, Einladungslinks, MFA-Geheimnisse oder vollständigen Datenbankkopien im fachlichen Archiv. E-Mail-Adressen, Freitextnotizen und Beschreibungen werden nicht übernommen. Die fachliche Notwendigkeit jeder archivierten Datenart wird vorher festgelegt. Abgebrochene Entwürfe und abgesagte Angebote werden separat bewertet; es wird nicht vorsorglich alles dauerhaft gesammelt.

### 4.3 Verlässlicher Übergabeablauf

1. Fristen frühzeitig berechnen und den notwendigen Datenumfang festlegen.
2. Konsistenten Datenstand je Schuljahr und Bezirk erzeugen; parallele Änderungen durch Versionierung beziehungsweise Abschluss berücksichtigen.
3. Paket erstellen, auf fremde Daten und unerlaubte Felder prüfen, Summen gegen die operative Auswertung abgleichen und Prüfsummen bilden.
4. Verschlüsselt an das Aufbewahrungssystem übertragen. Prüfsummen sichern die Integritätsprüfung; sie ersetzen weder Zugriffsschutz noch einen authentischen Übernahmebeleg.
5. Dauerhafte Übernahme durch das Zielsystem bestätigen und die Lesbarkeit anhand eines Abrufs mit gesonderter Berechtigung prüfen. Nur ein erfolgreicher Upload genügt nicht.
6. Übergabe mit Paketkennung und Version protokollieren. Änderungen nach dem Export entwerten dessen Eignung als aktueller Löschbeleg.
7. Zum Fristablauf operative Datensätze, abhängige personenbezogene Zuordnungen, temporäre Exporte und betroffene Caches bereinigen. Ein minimales Übergabe-/Löschprotokoll bleibt nach eigener Frist erhalten.
8. Ergebnis und Ausnahmen an die zuständige Betriebsstelle melden; Wiederholungen müssen ohne Doppelarchivierung oder Datenverlust möglich sein.

Bei fehlgeschlagener Übergabe werden die Originaldaten nicht blind gelöscht. Ab Fristablauf sind sie für normale App-Konten einschließlich regulärer RvS-Ansichten gesperrt; die Betriebsstelle erhält eine Störungsmeldung und bearbeitet die Ausnahme mit eng begrenztem Sonderzugriff. Die vorübergehende Weiteraufbewahrung wird begründet, terminiert und rechtlich bewertet. Das ist ein Störungsfall, keine automatische Fristverlängerung auf unbestimmte Zeit. Vor Produktivstart muss der komplette Ablauf funktionieren.

### 4.4 Archivzugriff und spätere Vernichtung

Archive erhalten ein eigenes Rechtekonzept. BdBs dürfen nur die ausdrücklich freigegebenen eigenen Bezirksbestände abrufen; Referenten erhalten nicht automatisch Zugriff auf alte Archivpakete. Eine spätere Herausgabe erfolgt kontrolliert über die zuständige Stelle. Serveradministration besitzt technisch weitreichende Möglichkeiten und wird organisatorisch beschränkt und protokolliert; die Anwendung kann sie nicht kryptografisch vollständig ausschließen.

Korrekturen, Auskunftsbegehren, Widersprüche, Löschansprüche und gesetzliche Aufbewahrungshindernisse werden auch für Archivkopien bearbeitet. Archivierung ist keine pauschale Ausnahme vom Datenschutz. Versionssicherung muss mit zulässiger Berichtigung und späterer Löschung vereinbar sein. Nach festgelegtem Fristende: archivrechtliche Entscheidung berücksichtigen, Daten vernichten beziehungsweise an das zuständige Archiv abgeben und den Vorgang nachweisen.

## 5 Datenarten und Aufbewahrungsregeln

| Datenart | Vorgeschlagene Regel | Entscheidung vor Produktivbetrieb |
| --- | --- | --- |
| Veranstaltungen und Auswertungsdaten | Operativ bis 400 Kalendertage nach Schuljahresende; erforderlicher Bestand separat aufbewahren | Umfang des Archivpakets und Archivfrist |
| Freiwillige öffentliche Referentennamen | Ausschließlich Vor- und Nachname; nur bei nachweisbarer Einwilligung für den benannten gemeinsamen Veröffentlichungszweck; Widerruf künftig restriktiv umsetzen | Nachweisfrist, Altbestandsbereinigung und Cache-Bereinigung |
| Dienststellen und Referentenkontaktdaten in öffentlichen Ausgaben | Werden nicht veröffentlicht; Altbestände auf allen öffentlichen Ausgaben bereinigen | Bestandsprüfung und dokumentierte Bereinigung |
| Aktive Referentenstammdaten und Konten | Vor- und Nachname, dienstliche E-Mail-Adresse, Bezirke, Rolle, Status sowie erforderliche Organisation und interne Notiz für laufende dienstliche Aufgaben; keine Telefonnummer | Austritts-/Deaktivierungs- und Löschfrist; nicht automatisch nach jedem Schuljahr löschen |
| Nachweis über die Datenschutzinformation | Version und Aushändigung/Zugänglichmachung dokumentieren; Empfangsbestätigung optional separat ablegen | Nachweisfrist und Ablage; keine zusätzliche Einwilligung ableiten |
| Einwilligungsnachweise zur Namensanzeige | Version, Ja/Nein-Entscheidung sowie Erteilungs-/Widerrufszeitpunkt nachweisen; keine IP-Pflicht | Nachweisfrist, Zugriff und anschließende Löschung |
| Sicherheits- und Änderungsprotokolle | Zweckgebunden, zugriffsbeschränkt, möglichst kurze passende Frist | Getrennte Fristen für Sicherheitsereignisse, Rechteänderungen und fachliche Nachweise |
| Einladungs- und Rücksetztoken | Kurze Gültigkeit, einmalige Nutzung soweit vorgesehen; Geheimnisse nach Nutzung entfernen | Ablauf und anschließende Bereinigung aller Tokenarten |
| Temporäre Exporte | Kurze automatische Löschung; Download nur nach aktueller Rechteprüfung | Konkrete technische Frist |
| Vollsicherungen | Täglich ab 06:00 Uhr age-verschlüsselt; nach Wiederherstellung Löschungen, Veröffentlichungsverbote und Kontosperren vor Freigabe erneut anwenden | Server 30 Tage (7–90), Netzlaufwerk Vorschlag 30 Tage (7–90) mit zwei neuesten geprüften Dateien; betrieblich bestätigen |
| Archivpakete | Eigene, begründete Aufbewahrungsfrist, danach geregelte Abgabe/Vernichtung | Noch offen; keine unbegrenzte Speicherung als Standard |

Eine Ausscheidensregel muss das Konto sofort sperren können, ohne gleichzeitig erforderliche Nachweise zu zerstören. Nach Ablauf personenbezogener Aufbewahrung dürfen nur wirklich anonymisierte Statistiken weitergeführt werden; kleine Gruppen, Referentenkennungen und seltene Merkmalskombinationen können eine Zuordnung weiterhin ermöglichen.

## 6 Arbeitspakete und Reihenfolge

### AP 01 Verantwortung und Entscheidungen festlegen

**Federführung:** Regierung/Fachverantwortung; Beratung durch Datenschutzbeauftragten, IT-Sicherheit und Registratur/Archivstelle.

Verantwortliche Stelle und Verhältnis zu Schulämtern bestimmen; die Servermiete allein beantwortet die datenschutzrechtliche Rollenverteilung nicht. Dienstlichen Zweck des Netzwerks und der Auswertungen beschreiben, zulässige FIBS-Übernahme klären, Schutzbedarf und Risiken bewerten. Die Frage einer Mitbestimmung wird mit der zuständigen Stelle geprüft, insbesondere bei personenbezogenen Auswertungen. Zuständige Personen und Vertretungen benennen.

**Ergebnis:** Entscheidungsliste zu Rechtsgrundlagen, Aufbewahrung, Archivziel, MFA, Betriebszuständigkeit und Freigabeverfahren. Der Verzicht auf öffentliche Referentendaten steht bereits fest. Keine offene Archivfrist durch eine vorläufig behauptete Rechtsgrundlage ersetzen.

### AP 02 Datenflüsse und Berechtigungen prüfen

**Federführung:** Entwicklung mit Fachverantwortung. **Voraussetzung:** fachlicher Rechteumfang aus AP 01.

Alle Server Actions, Seitenabfragen, Downloads, Kataloge, Kennzahlen, Historien und öffentliche Ausgaben erfassen. Lese- und Schreibzugriffe mit Bezirks- und Schuljahresgrenzen prüfen. Bei unbekannten Rollen oder fehlenden Zuordnungen Zugriff verweigern. Die Kalenderausnahme auf ihre ausdrücklich erlaubten Felder beschränken; keine fremden Teilnehmerzahlen durch Metadaten oder Nebenabfragen offenlegen.

Für reine Berichtsempfänger eine ausdrückliche Leseberechtigung erwägen. Diese muss je Zweck und Bezirk vergeben werden. Geteilte Referentenprofile bleiben fachlich möglich; Kontaktangaben und Notizen werden als gemeinsam sichtbar kenntlich gemacht und auf erforderliche Angaben beschränkt. Private oder sensible Angaben gehören nicht in Freitextfelder.

**Ergebnis:** Rollenmatrix, Datenflussübersicht und verpflichtende Testfälle. Datenbankseitige Zusatzbeschränkungen werden anhand Aufwand und Betriebsmodell bewertet; separate Datenbanken je Bezirk sind bei der gewünschten gemeinsamen Planung nicht automatisch erforderlich.

### AP 03 Schuljahresführung vereinheitlichen

**Federführung:** Entwicklung. **Voraussetzung:** AP 02.

Gemeinsame Funktionen für Schuljahresgrenzen, Zuordnung, Frist und operative Verfügbarkeit schaffen. Bestehende Filter und 400-Tage-Abfragen auf die neue Definition umstellen. Schuljahrabschluss, Wiederöffnung, Hinweise und Fristanzeige ergänzen. Jahresfilter in `searchParams` beibehalten. Historische Daten werden nach dokumentierter Regel zugeordnet; Änderungen des Veranstaltungsbeginns über eine Jahresgrenze benötigen vor Abschluss eine transparente Bestätigung und müssen den bisherigen Export entwerten.

**Ergebnis:** Durchgängige Schuljahresführung ohne Doppelzählung und ohne Abhängigkeit vom rechtzeitigen Lauf eines Hintergrundjobs: Auch direkte Abfragen respektieren den Fristablauf.

### AP 04 Freiwillige öffentliche Namensanzeige umgesetzt; Rollout offen

**Federführung:** Entwicklung; Texte durch Fachstelle und Datenschutzbeauftragten prüfen. **Voraussetzung:** Festlegung aus AP 01.

Die öffentliche Datenprojektion enthält nur bei nachweisbarer freiwilliger Einwilligung den Vor- und Nachnamen des zugeordneten Referenten. Dienststellen, Kontaktdaten, IDs und Profilverknüpfungen werden nicht geladen oder serialisiert. Die Entscheidung erfolgt durch die Referentin oder den Referenten bei Registrierung und im eigenen Konto als Ja/Nein-Auswahl, ist standardmäßig deaktiviert und gilt ausschließlich für eigene zugeordnete veröffentlichte Fortbildungen portalweit, auch künftig und bezirksübergreifend.

Die einzelne, nicht vorausgewählte Ja/Nein-Auswahl betrifft den bestimmten Zweck der Namensnennung auf Website, öffentlichem ICS-Feed und öffentlichen Ausschreibungs-PDFs. Die Einwilligung nennt Datenfeld, Zweck und diese zusammengehörigen Ausgaben, verweist auf die Datenschutzinformation und ist weder an Registrierung noch an Konto oder dienstliche Tätigkeit gekoppelt. Die Anwendung protokolliert die Textversion sowie Erteilungs- und Widerrufszeitpunkt; eine IP-Adresse wird nicht als Nachweis verlangt. Fehlende oder nicht nachweisbare Einwilligung, auch bei Altwert `true`, bedeutet keine Namensanzeige. Fotos, Marketing, Kontaktveröffentlichungen und weitere Zwecke sind davon nicht umfasst.

Stattdessen werden beide Kennzeichnungen einheitlich aus dem Veranstaltungsbezirk gebildet, zum Beispiel „Referentennetzwerk digitale Bildung – Memmingen-Unterallgäu“ und „Beratung digitale Bildung – Memmingen-Unterallgäu“. Sie stehen für die organisatorische Zuordnung und dürfen keine tatsächlich unzutreffende Trägerschaft behaupten; die fachliche Stelle bestätigt die Formulierung für die verwendeten Angebote.

Der Widerruf ist jederzeit im eigenen Konto möglich und wirkt für künftige Veröffentlichungen. Neue Abrufe der Website, des Feeds und der Ausschreibungs-PDFs berücksichtigen den Widerruf. Der Anwendungscache wird invalidiert; Feed und PDF werden mit `no-store` ausgeliefert. Externe Caches und bereits heruntergeladene ICS-Dateien oder PDFs können nicht zuverlässig zurückgeholt werden. BdBs dürfen die Veröffentlichung als Schutzmaßnahme stoppen, können aber weder eine Einwilligung abgeben noch wieder einschalten. Interne Auswertungs- und Archivexporte dürfen erforderliche Referentenzuordnungen unter ihren eigenen Berechtigungen enthalten.

Prüfumfang für den noch offenen Rollout: Startseite, Listen, Details, Kalender, ICS, Suchvorschauen, HTML-Metadaten, strukturierte Daten, öffentliche Aushänge/PDFs, Download-Dateinamen, QR-Zielseiten und an den Browser übergebene Daten. Automatisierte Tests prüfen Registrierung mit und ohne Zustimmung, die Bindung an das eigene Konto, Bezirksrechte, den Widerruf und die Ausgabe im öffentlichen Datenmodell, ICS und Aushang-PDF. Die tatsächliche Cache-Konfiguration der späteren Betriebsumgebung bleibt Bestandteil der Rollout-Prüfung.

E-Mail-Adressen, Signaturen und sonstige persönliche Angaben in Titeln, Beschreibungen, importierten FIBS-Texten oder Veranstaltungsorten müssen weiterhin entfernt beziehungsweise fachlich bereinigt werden. Eine freiwillige Namensanzeige ersetzt diese Prüfung nicht; HTML-Sanitizing entfernt solche Inhalte nicht. Vor Freigabe ist eine redaktionelle Inhaltsprüfung vorgesehen. Falls Planungsbeschreibungen interne Personenangaben brauchen, werden ein interner Text und ein eigener Veröffentlichungstext geführt.

FIBS-Verlinkungen bleiben möglich. Dass auf der externen FIBS-Seite gegebenenfalls Namen stehen, wird nicht durch dieses Portal gesteuert; solche Angaben werden nicht wieder als Vorschau importiert oder veröffentlicht. Die Zielregel verspricht daher keine vollständige Nichtidentifizierbarkeit über externe Quellen.

Die optionale kurze Unterschriftenvorlage bestätigt nur den Erhalt der Informationen und bleibt unverändert. Notwendige interne Verarbeitung erhält eine eigenständig geprüfte Rechtsgrundlage. Kein für alle Referenten sichtbares Kontaktverzeichnis und keine dienstfremde Werbung werden durch die Namenseinwilligung freigegeben. [Quelle: BayLfD zu Einwilligungsnachweisen](https://www.datenschutz-bayern.de/datenschutzreform2018/aki08.html)

**Ergebnis:** Die Namensfreigabe ist im Projekt umgesetzt. Vor dem Rollout bleiben die folgenden Prüfungen und betrieblichen Schritte offen; daraus folgt keine vollständige Datenschutzkonformität.

#### Rollout der Namensfreigabe

1. Einwilligungstext, verantwortliche Stelle und Informationen nach Art. 13/14 DSGVO finalisieren und freigeben; auch Änderungen der ergänzenden Datenschutzinformationen versioniert dokumentieren.
2. Datenbankmigration und App-Update gemeinsam nach dem betrieblichen Freigabeverfahren ausrollen; diese Planung nimmt selbst keine Produktivänderung vor.
3. Alttexte manuell auf Namen, Kontaktdaten und Signaturen prüfen und bereinigen. Die Checkbox bereinigt Freitexte nicht.
4. Öffentliche Caches bereinigen und die vorgesehenen automatisierten sowie manuellen Prüfungen durchführen.
5. Nachweisaufbewahrung für die Einwilligung verbindlich festlegen; sie ist weiterhin offen.

### AP 05 Konten und Anmeldung absichern

**Federführung:** Entwicklung und IT-Betrieb. **Voraussetzung:** Rollenmatrix.

MFA für RvS, BdBs und weitere Konten mit umfassendem Berichts-/Verwaltungszugriff vorsehen; geeignete Verfahren und Wiederherstellung festlegen. Persönliche Konten, geprüfte dienstliche Einladungsadressen und kurze Einladungsfristen. Ein wiederverwendbarer Link ersetzt keine Identitätsprüfung. Falls dieser Einladungsweg erhalten bleibt, erfolgt Freischaltung durch eine zuständige Person, bevor interne Daten zugänglich werden.

Rollenwechsel, MFA-Rücksetzung und Kontowiederherstellung besonders absichern. Sitzungen bei Sperrung, Passwort- und sicherheitsrelevanten Rechteänderungen widerrufen. Rate-Limits und vertrauenswürdige Proxy-Header testen; bei mehreren Instanzen einen gemeinsamen Speicher verwenden. Geheimnisse und Link-Token aus Logs, Referrer-Übertragung und Exporten fernhalten.

**Ergebnis:** Dokumentierter Kontolebenszyklus samt Ausscheiden und Vertretung; kein gemeinsames Administrationspasswort.

### AP 06 Netcup und Softwarebetrieb härten

**Federführung:** IT-Betrieb, mit Entwicklung. **Voraussetzung:** Betriebsmodell aus AP 01.

Eigene Produktionskonfiguration: nur HTTPS öffentlich, interner App-Port nicht auf allen öffentlichen Schnittstellen; Datenbank intern. Direktzugriff darf TLS, Proxy-Schutz und Rate-Limits nicht umgehen. Proxy überschreibt relevante Weiterleitungsheader kontrolliert. Sichere Cookies verbindlich im Produktivbetrieb. SSH-Schlüssel, eingeschränkter Verwaltungszugang, getrennte Dienstkonten, möglichst geringe Container- und Datenbankrechte; Laufzeit- und Migrationskonto getrennt prüfen.

Transportwege, Datenträger und Backups angemessen verschlüsseln; Schlüssel getrennt verwalten und Wiederherstellung dokumentieren. Ein lokales Docker-Netz allein ist kein Verschlüsselungsnachweis. Netcup-Standort, Supportzugriffe, Unterauftragnehmer, etwaige weitere Proxy-/Mail-/Backup-Dienste und Datenflüsse im AVV-/TOM-Konzept erfassen.

Reproduzierbare Versionen statt unkontrollierter `latest`-Aktualisierung; Sicherheits- und Abhängigkeitsprüfungen, Updatezuständigkeit, getestete Migration und Rückfallplan. Automatische Migration beim Start muss vor Datenlöschungen kontrolliert werden. Keine Produktivdaten oder Geheimnisse in Tests, CI, Git oder externen KI-Diensten.

**Ergebnis:** Geprüfte Netcup-Konfiguration, Betriebsanleitung, Systeminventar und dokumentierter Patchprozess.

### AP 07 Archivierung und Bereinigung implementieren

**Federführung:** Entwicklung, Archiv-/Registraturstelle und IT. **Voraussetzung:** AP 03 und bestätigtes Aufbewahrungssystem samt Regeln.

Umgesetzt sind der Datenbank-Trigger für stabile Schuljahreszuordnung und Frist, die zentrale Sperre auch bei ausgefallenem Scheduler sowie ein ZIP-Paket je Bezirk und Schuljahr mit JSON, CSV und Hash. Es enthält interne Referenten-IDs und Namen sowie Höchstteilnehmerzahl, aber keine Kontakte, Notizen oder Beschreibungen. Externe Übernahme und Bereinigung erfolgen erst nach Hash-Prüfung. Überfällige Archivdownloads sind auf RVS mit begründetem, höchstens siebentägigem Sonderzugriff beschränkt. Produktive Zielablage, Übernahmebelege und Rechte bleiben vor Start einzurichten.

**Ergebnis vor Freigabe:** Trockenlauf mit der tatsächlichen Zielablage, geprüfte externe Übernahme, idempotente Bereinigung und beherrschter Fehlerfall. Ein manueller Tabellenexport ersetzt den Archivprozess nicht.

### AP 08 Backup und Sicherheitsüberwachung einrichten

**Federführung:** IT-Betrieb. **Voraussetzung:** AP 06 und Archivverfahren.

Die Anwendung erstellt täglich ab 06:00 Uhr eine age-verschlüsselte Vollsicherung. RvS mit MFA übernimmt sie per HTTPS/VPN in den festzulegenden UNC-Pfad und bestätigt dort Dateiablage und SHA-256; ohne Werkzeuglauf bleibt die Netzlaufwerkbereinigung aus. Server: 30 Tage (7–90), Netzlaufwerk: Vorschlag 30 Tage (7–90) und zwei neueste geprüfte Dateien. Diese Werte und der Wiederanlauf sind keine bereits erreichten Zusagen.

Vor Wiederfreigabe einer Wiederherstellung: Fristen, Veröffentlichungsverbote, Kontosperren und Rechteänderungen erneut abgleichen. Archive und Backups haben unterschiedliche Zwecke. Monitoring überwacht fehlende Backups, Lösch-/Archivfehler, erfolglose Anmeldungen, auffällige Exporte, Zertifikate, Speicher und fehlgeschlagene Sicherheitsprotokollierung. Datenschutzvorfälle werden bewertet und mit einem dokumentierten Meldeweg behandelt.

**Ergebnis:** Nachgewiesener Wiederherstellungstest, Alarmwege, Vertretung und Vorfallsplan.

Das Portal erzeugt das Vollbackup und liefert `Uebernehme-Vollbackup.ps1` sowie eine auf Testdatenbanken beschränkte Wiederherstellungsprobe mit. Der private age-Schlüssel liegt nicht auf dem Produktionsserver. Eine produktive Sicherung, Netzablage oder Wiederherstellungsprobe ist noch nicht belegt. `ops/sichere-postgres-sicherung.sh` bleibt nur ein alternativer hostdirekter Ablauf.

### AP 09 Datenschutzunterlagen fertigstellen

**Federführung:** Fachverantwortung mit Datenschutzbeauftragtem; technische Nachweise durch Entwicklung und IT. **Voraussetzung:** bestätigte Entscheidungen und tatsächliche Umsetzung aus AP 01 bis AP 08.

Unterlagen aus Abschnitt 7 erstellen, mit dem realen System abgleichen, offene Felder schließen und versioniert ablegen. Die Dokumente werden parallel vorbereitet; ihre endgültige Fassung beschreibt den abgenommenen Betrieb, keine geplanten Schutzmaßnahmen als bereits vorhanden.

**Ergebnis:** Vollständige Unterlagen und dokumentierte Entscheidung der zuständigen verantwortlichen Stelle über die Inbetriebnahme. Der Datenschutzbeauftragte berät; seine Beteiligung ersetzt nicht die Betreiberverantwortung.

### AP 10 Migration und Abnahme

**Federführung:** Entwicklung, IT und Fachverantwortung.

Zunächst Testbetrieb mit künstlichen Daten für mindestens zwei Bezirke, mehreren Rollen und mehreren Schuljahren. Altbestand inventarisieren, zuordnen und Ablaufplan als Vorschau ausgeben. Bereits überfällige Daten vor jeder Löschung in das bestätigte Verfahren überführen. Prüfen, welches bestehende Konto durch die Bezirksmigration zur RvS-Rolle hochgestuft wurde; Gesamtzugriff nicht ungeprüft übernehmen.

Danach gesicherte und protokollierte Migration, fachlicher Abgleich, Wiederherstellungsprobe sowie Test mit getrennten UAMM-/Günzburg-Konten. Die vorhandene automatische Schema-Migration darf keinen ungeprüften Massenlöschlauf auslösen.

**Ergebnis:** Abnahmeprotokoll, dokumentierte Restpunkte, Betriebsübergabe und Termin für die erste jährliche Überprüfung.

## 7 Dokumente und Nachweise

| Dokument | Inhalt | Federführung |
| --- | --- | --- |
| Verzeichnis der Verarbeitungstätigkeiten VVT | Zwecke, Betroffene, Datenarten, Empfänger, Verantwortlichkeit, Rechtsgrundlagen ergänzend, Drittlandbezug, Fristen und TOM-Verweis; Portal, Netzwerkverwaltung und Aufbewahrung fachlich unterscheidbar | Verantwortliche Stelle mit Datenschutzberatung |
| Technische und organisatorische Maßnahmen TOM | Zutritt, Zugang/MFA, Berechtigungen, Übertragung, Verschlüsselung/Schlüssel, Nachvollziehbarkeit, Verfügbarkeit/Backup, Wiederherstellung, Trennung, Auftragskontrolle, Datenminimierung, Löschung und regelmäßige Wirksamkeitsprüfung | IT und Entwicklung |
| Rollen- und Berechtigungskonzept | RvS, BdB, Referent, gegebenenfalls Berichtsempfänger; Bezirk, Schuljahr, Archivzugriff, Vertretung und Rechteentzug | Fachverantwortung |
| Lösch- und Aufbewahrungskonzept | 400-Tage-Regel, getrennte Datenarten, Ausnahmen, Archivfristen, endgültige Vernichtung und Backup-Nachlauf | Fachstelle und Registratur/Archivstelle |
| Archiv- und Exportkonzept | Paketinhalt, Formate, Versionen, Integrität, Übernahmebeleg, Zielsystem, Herausgabe und Löschung | Registratur/Archivstelle und IT |
| Datenschutzhinweise nach Art. 13/14 | Website, Konten/Referenten und importierte Bestandsdaten; Herkunft, Empfänger, Rechte, Fristen und Kontakte | Verantwortliche Stelle |
| Empfangsbestätigung, Informations- und Einwilligungsnachweise | Optionale kurze Unterschriftenvorlage; Art-13/14-Information; Einwilligungstextversion, Ja/Nein-Entscheidung, Erteilungs-/Widerrufszeitpunkt, Nachweisaufbewahrung | Fachstelle mit Datenschutzberatung |
| AVV und Dienstleisterunterlagen | Netcup-Vertrag, TOM des Anbieters, Unterauftragnehmer, Standorte, Weisungen, Beendigung; weitere beteiligte Dienstleister | Vertragspartner/IT |
| Risikoanalyse und DSFA-Schwellenprüfung | Schutzbedarf, Bedrohungen, Bewertung; begründete Entscheidung über Erfordernis einer Datenschutz-Folgenabschätzung, erforderlichenfalls vollständige DSFA | Verantwortliche Stelle mit IT und Datenschutzberatung |
| Betriebshandbuch | Updates, Konfiguration, Schlüssel, Backups, Monitoring, Zuständigkeiten und Vertretung | IT |
| Vorfalls- und Betroffenenrechteverfahren | Erkennen/Bewerten/Melden von Vorfällen; Auskunft, Berichtigung, Widerspruch, Einschränkung, Löschung und Fristen | Verantwortliche Stelle |
| Nutzungs- und Redaktionsregeln | Dienstlicher Zweck, zulässige Freitexte, Exportablage, keine Teilnehmerlisten, Umgang mit gemeinsamen Referentenprofilen | Fachverantwortung |
| Test-, Migrations- und Abnahmeprotokoll | Rechteprüfungen, Paketabgleich, Wiederherstellung, Löschtests, Restpunkte, Inbetriebnahmeentscheidung | Entwicklung/IT/Fachverantwortung |

VVT und TOM dürfen aufeinander und auf weitere Konzepte verweisen, müssen aber vollständig auffindbar und aktuell sein. Grundlage für das VVT ist die Beschreibung des tatsächlichen Verfahrens. [Quelle: BayLfD zum Verarbeitungsverzeichnis](https://www.datenschutz-bayern.de/datenschutzreform2018/verarbeitungsverzeichnis.html)

## 8 Verbindliche Abnahmekriterien

- [ ] UAMM und Günzburg können gegenseitig weder Auswertungen noch Verwaltungsdaten lesen, verändern oder exportieren; manipulierte IDs und Filter werden mitgeprüft.
- [ ] Gemeinsame Referenten erweitern keine Veranstaltungs-/Auswertungsrechte; die dokumentierte Kalenderausnahme bleibt auf erlaubte Felder beschränkt.
- [ ] Tests laufen automatisch vor Veröffentlichung gegen eine isolierte Testdatenbank und prüfen auch tatsächliche Excel-/PDF-Inhalte.
- [ ] Schuljahreswechsel, 31. Juli mit Sekunden, Sommerzeit, Schaltjahr und jahresübergreifende Termine sind geprüft; der Ablauf am 04.09.2028 für 2026/2027 stimmt.
- [ ] Die Nachbereitung verwendet die Schuljahresfrist statt 400 Tagen seit Veranstaltungsende.
- [ ] Abgelaufene Daten sind auch bei ausgefallenem Hintergrundjob nicht mehr regulär abrufbar; verspätete Importe werden abgefangen.
- [ ] Archivpakete enthalten ausschließlich den genehmigten Datenumfang und korrekte Summen; Übernahme und Lesbarkeit sind bestätigt.
- [ ] Netzwerkunterbrechung, voller Archivspeicher, doppelte Jobausführung, nachträgliche Änderung und teilweise fehlgeschlagene Löschung sind getestet.
- [ ] Löschung erfolgt erst nach gültigem Übernahmebeleg; Ausnahmefälle werden gesperrt, gemeldet und befristet bearbeitet.
- [ ] Öffentliche Referentennamen erscheinen ausschließlich nach nachweisbarer Einwilligung für den benannten gemeinsamen Veröffentlichungszweck und nur als Vor- und Nachname; Dienststellen, Kontakte, IDs und Profilverknüpfungen fehlen in allen öffentlichen Ausgaben und Browserdaten einschließlich ICS, Metadaten und öffentlichen PDFs.
- [ ] Einzelne Ja/Nein-Auswahl, eigenes-Konto-Guard, Altwerte ohne Nachweis, Widerruf und Cache-Bereinigung sind getestet; BdBs können nur stoppen, nicht einwilligen oder einschalten.
- [ ] Beide Organisationskennzeichnungen verwenden unabhängig von der Namensanzeige den korrekten Ausschreibungsbezirk. Freitexte, FIBS-Importe und Altbestände sind redaktionell geprüft.
- [ ] Die Einwilligung ist nicht vorausgewählt und keine Voraussetzung für Konto, Registrierung oder dienstliche Tätigkeit; die Unterschrift der optionalen Empfangsbestätigung bleibt davon getrennt.
- [ ] MFA, Einladungen, Rechteentzug und Kontowiederherstellung wurden einschließlich Missbrauchsfällen geprüft.
- [ ] Öffentliche Ports, TLS, Proxy-Header, Datenbankrechte und tatsächliche Backup-Verschlüsselung wurden auf dem Zielsystem geprüft.
- [ ] Wiederherstellung einschließlich erneuter Löschung abgelaufener Daten und Sperrung alter Konten wurde praktisch durchgeführt.
- [ ] Archivdauer, Datenartenfristen, Kontakte, Rechtsgrundlagen und Dienstleisterangaben sind verbindlich festgelegt; alle Dokumente entsprechen dem abgenommenen Stand.

## 9 Offene Entscheidungen

| ID | Entscheidung | Zuständige Stelle | Spätestens erforderlich |
| --- | --- | --- | --- |
| E01 | Verantwortlichkeit und Verhältnis Regierung/Schulämter | Regierung, Datenschutzberatung | Vor endgültigen Rechtstexten |
| E02 | Rechtsgrundlage für dienstliche Netzwerkverwaltung, Auswertungen und FIBS-Übernahme | Verantwortliche Stelle | Vor Echtdatenbetrieb |
| E03 | Dauer der öffentlichen Veranstaltungsanzeige und fachlich korrekte Organisationskennzeichnung | Fachverantwortung | Vor öffentlichem Start |
| E04 | Archivziel, genehmigter Paketinhalt und Aufbewahrungsfrist; Archivrecht | Registratur/Archivstelle und Fachverantwortung | Vor Archivimplementierung und Echtdatenbetrieb |
| E05 | Konten-, Protokoll-, Nachweis- und Backupfristen | Fachstelle/IT/Datenschutzberatung | Vor finalem Löschkonzept |
| E06 | MFA-Verfahren und sichere Wiederherstellung | IT/Fachverantwortung | Vor breiter Kontofreischaltung |
| E07 | Persönliche Einladungen oder Link plus geprüfte Freischaltung | Fachverantwortung | Vor Registrierungsausbau |
| E08 | Speicherorte, weitere Dienstleister, Backupziele und Betriebsvertretung | IT und Vertragspartner | Vor Serverabnahme |
| E09 | DSFA-Erfordernis und gegebenenfalls Beteiligung weiterer Stellen | Verantwortliche Stelle | Vor Inbetriebnahme |
| E10 | Behördenanschrift, Datenschutzbeauftragter, Portal-URL und Kontakt für Betroffenenanliegen | Regierung | Vor Aushändigung der Formulare |

## 10 Empfohlene Umsetzungsetappen

1. **Entscheidungsgrundlage:** AP 01, Dateninventar/Rollenmatrix aus AP 02, Dokumentengerüste aus AP 09. Archivstelle früh beteiligen.
2. **Schutz der Anwendung:** AP 02, AP 03 und AP 05 einschließlich verpflichtender Tests sowie der noch offene Rollout aus AP 04. Die technischen Arbeiten können nach Festlegung ihrer jeweiligen Voraussetzungen zusammen geplant werden.
3. **Gesicherter Betrieb und Aufbewahrung:** AP 06, AP 07 und AP 08; Übergabe und Wiederherstellung praktisch nachweisen.
4. **Verbindliche Unterlagen und Start:** AP 09 abschließen, AP 10 durchführen, Betrieb übergeben. Die konkrete Reihenfolge steht in [INBETRIEBNAHME.md](INBETRIEBNAHME.md).

Die Reihenfolge ist wichtiger als eine ungeprüfte Kalenderzusage. Eine Aufwandsschätzung erfolgt nach Auswahl von MFA-Verfahren und Aufbewahrungssystem; insbesondere die Anbindung eines behördlichen DMS kann externe Abstimmung erfordern.

## 11 Quellen und ergänzende Entwürfe

Rechtsfragen werden anhand der tatsächlichen Aufgaben und Organisation entschieden. Die folgenden Quellen unterstützen die Prüfung; sie sind keine Freigabe des konkreten Verfahrens.

- [Art. 5 BayEUG – Schuljahr](https://www.gesetze-bayern.de/Content/Document/BayEUG-5)
- [Art. 6 BayArchivG – Anbietung](https://www.gesetze-bayern.de/Content/Document/BayArchivG-6)
- [BayLfD – Einwilligung nach der DSGVO](https://www.datenschutz-bayern.de/datenschutzreform2018/einwilligung.pdf)
- [BayLfD – Aufbewahren von Einwilligungen](https://www.datenschutz-bayern.de/datenschutzreform2018/aki08.html)
- [BayLfD – Verarbeitungsverzeichnis](https://www.datenschutz-bayern.de/datenschutzreform2018/verarbeitungsverzeichnis.html)
- [BayLfD – Beschäftigtendaten in der Öffentlichkeit, Abschnitt 5.4](https://www.datenschutz.bayern/tbs/tb34/k5.html)
- [Netcup – Auftragsverarbeitung](https://www.netcup.com/de/helpcenter/dokumentation/general/avv)

Im gleichen Ordner liegen die kurze Word-Vorlage `Empfangsbestaetigung_Datenschutzhinweise_Entwurf.docx` und die zugehörigen ausführlichen Informationen `DATENSCHUTZINFORMATIONEN_ENTWURF.md`. Die optionale Word-Vorlage bleibt unverändert und darf erst nach Vervollständigung und Prüfung der zugehörigen Informationen verwendet werden. Die freiwillige elektronische Einwilligung zur öffentlichen Namensanzeige ist hiervon getrennt. Die endgültigen TOM, das VVT und die weiteren Konzepte sind Arbeitsergebnisse dieses Plans und noch nicht als fertig umgesetzt anzusehen.
