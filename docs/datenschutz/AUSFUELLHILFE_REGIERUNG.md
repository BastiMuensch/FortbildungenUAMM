# Gemeinsame Ergänzungen für TOM VVT und DSFA

weiter.bilden · Fortbildungsportal Schwaben · Stand 5. Oktober 2026 · zu Version 1.1

**Die fachlichen und technischen Beschreibungen sind ausgearbeitet.** Diese Übersicht bündelt nur die Angaben zum konkreten Behördenbetrieb. Sachgebiet 40.1 und Doris Sippel sind bereits eingetragen. Bekannte Funktionen und Datenfelder müssen nicht erneut ermittelt werden. Eine gemeinsame Akte genügt; Angaben können durch Verweis auf vorhandene Dienstanweisungen oder Protokolle übernommen werden.

## Was bereits beantwortet ist

- **Aufgabe und Daten:** Fortbildungsplanung, Bewerbung, Nachbereitung und Berichte. Namen, dienstliche E-Mail und Bezirkszuordnung sowie Veranstaltungsdaten; optional Organisation und sachliche interne Notiz. Keine Telefonnummernfelder oder Privatanschriften.
- **Zugriffe:** RvS gesamt, BdBs in ihren zugewiesenen Bezirken, Referierende bei eigenen oder zugeordneten Veranstaltungen. Eng begrenzte Ausnahme für Veranstaltungsdaten im internen Planungskalender; keine fremden Auswertungen oder Kontakte.
- **Namensfreigabe:** Freiwillige eigene Zustimmung, Widerruf und Nachweis im Konto. Seit Textfassung 2026-10-05.1 sind auch SchiLf-Teilnahmebescheinigungen ausdrücklich umfasst. Frühere Zustimmungen müssen erneut bestätigt werden.
- **Neue Funktionen:** SchiLf-Bescheinigungen sind Blankoformulare, keine Teilnehmerdatenbank. Eine tatsächliche Dauer kann nachträglich berichtigt werden. Die Redaktionsrolle ist in der BdB-Rolle aufgegangen; der QR-Code für den zweiten Anmeldefaktor wird lokal erzeugt.
- **Frist:** 400 volle Tage nach Schuljahresende; für 2026/2027 regulärer Zugriff bis 03.09.2028, danach gesperrt. Bereinigung nach bestätigter Archivübernahme.
- **Betrieb:** netcup VPS 1000 G12.5 in Nürnberg, Vertrag und AVV durch die RvS. HTTPS mit Let’s Encrypt laut Betreiber vorhanden. Tägliche verschlüsselte Vollsicherung und Portalhinweis sind eingebaut; Ablage auf Regierungslaufwerken über Regierungslaptop und VPN. Facharchive bei RvS beziehungsweise zuständigem Schulamt.

## Gemeinsam mit der Regierung ergänzen

| Thema | Konkrete Ergänzung | Wer hilft |
| --- | --- | --- |
| Zuständigkeiten | Fachkontakt, Vertretung und tatsächlich ausführende Administration; beteiligte Schulämter und organisatorische Zuständigkeiten. RvS, SG 40.1 und Doris Sippel stehen bereits fest. | SG 40.1 |
| Archiv und weitere Fristen | Vor allem die Dauer des Facharchivs mit Beginn und Aufbewahrungsregel. Daneben bestehende Regeln für Konten nach Ausscheiden, Veröffentlichungsdauer, Nachweise und Exportkopien übernehmen. Die 400-Tage-Regel bleibt bestehen. | SG 40.1 und Registratur, beraten durch Datenschutz |
| Dienstliche Ablagen | Konkreter Pfad für Vollsicherungen und getrennte Facharchive, berechtigte Personen, tägliche Sicherungszuständigkeit und Vertretung. | Regierung und zuständige Schulämter |
| Vertrag und Akte | Fundstelle des unterzeichneten AVV mit Anlagen, Bestellung der Instanz Nürnberg, Portaladresse und gemeinsame Betriebsakte. | Vertragsstelle und IT-Betrieb |
| Tatsächliche Nutzung | Ungefähre Größenordnung für die DSFA und tatsächlich genutzte Datenquellen. Übernahme der beschriebenen Aufgaben, Auswertungen und Planungsausnahme bestätigen. | SG 40.1 |

**Keine neue Grundsatzrecherche erforderlich:** Die Aufgaben der Beratung digitale Bildung und des Referentennetzwerks sind im VVT mit amtlichen Quellen beschrieben. Die Regierung bestätigt, dass das Portal im beschriebenen Umfang für diese Aufgaben eingesetzt wird. Der optionale automatische FIBS-Import braucht erst bei geplanter Aktivierung eine Prüfung der tatsächlichen Quelle; er ist derzeit ausgeschaltet.

## Was das Projektteam und der IT-Betrieb erledigen

Diese technischen Punkte werden nicht auf die Datenschutzbeauftragte verlagert. Das Projektteam trägt die Antworten zusammen; für Regierungslaufwerke und deren Rechte unterstützt die zuständige Stelle der Regierung.

| Aufgabe | Einmal festzuhaltendes Ergebnis |
| --- | --- |
| Aktuellen Stand einspielen | Eingesetzte Version und Datenbankänderungen; dazu gehören das entfernte Telefonnummernfeld und die zusammengeführten Rollen. |
| Serverzugänge kontrollieren | HTTPS, Zertifikatserneuerung, abgeschirmte Datenbank und Verwaltungszugänge; tatsächliche Gateway- und Porteinstellungen berücksichtigen. |
| Sicherung praktisch abschließen | Verschlüsselungsschlüssel und getrennte Verwahrung, aktivierter täglicher Zeitplan, geprüfte Übernahme auf das Regierungslaufwerk, tägliche Person und Vertretung. |
| Wiederherstellung prüfen | Eine Sicherung vom Regierungslaufwerk in einer getrennten Testumgebung wiederherstellen und die wichtigen Funktionen kontrollieren; Datum und Ergebnis dokumentieren. |
| Bereinigung betreiben | Server standardmäßig 30 Tage; Netzlaufwerk 30 Tage vorgeschlagen, zusätzlich zwei neueste geprüfte Dateien. Tägliche Ausführung des Übernahmewerkzeugs beziehungsweise Aufgabenplanung einrichten. |
| Laufende Pflege | Zuständigkeit für Updates, Störungen und Betroffenenanfragen; angemessene Serverlogfristen und Prüfung der derzeitigen 365 Tage für Fehlanmeldungen. |

Die Programmfunktionen und eine echte Wiederherstellung mit synthetischen Daten sind bereits geprüft. Der tatsächliche Durchlauf im Behördennetz ist davon getrennt. **Ein kurzes gemeinsames Inbetriebnahmeprotokoll genügt als Betriebsnachweis.**

## Abschluss

Die Datenschutzbeauftragte berät zur gemeinsamen Fassung. Die befugte Stelle dokumentiert die Übernahme in den Betrieb mit Datum und Fundstelle. Die DSFA enthält bereits die Risikoanalyse; eine zweite parallele Vorprüfung oder zusätzliche Freigabe jeder einzelnen Funktion ist nicht vorgesehen.

Die drei Dokumente und die Betriebsakte werden bei wesentlichen Änderungen und im jährlichen Betriebscheck gemeinsam fortgeschrieben. Technische Einzelanleitungen bleiben in `INBETRIEBNAHME.md`, `VOLLBACKUP_BETRIEB.md` und `BACKUP_UND_WIEDERHERSTELLUNG.md`.
