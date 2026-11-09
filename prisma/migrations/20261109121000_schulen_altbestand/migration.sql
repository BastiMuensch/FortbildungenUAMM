-- Augsburg-Land steht nach der Erweiterung als Schulamt zur Auswahl.
-- Bereits angelegte Schulämter und deren Einstellungen werden nicht verändert.
INSERT INTO "Bezirk" ("id", "name", "kuerzel", "aktiv", "pflichtSchlagworte")
VALUES ('6391941d-b3f5-48cf-9fb3-31c4edc494b6', 'Augsburg-Land', 'augsburg-land', true, ARRAY[]::TEXT[])
ON CONFLICT DO NOTHING;

-- Nur die namentlich bekannten UAMM-Starteinträge werden ergänzt.
-- Namen, Adressen, IDs, Aktivstatus und Fortbildungen bleiben unverändert.
-- Amtliche Schulnummern: RvS-Verzeichnis, Abschnitte MM und UA, Abruf 09.11.2026.
-- https://www.regierung.schwaben.bayern.de/fachverfahren/schulverzeichnisse/grundschulen/index.php
-- Der frühere gemeinsame Ort Memmingerberg bleibt ohne einzelne Schulnummer:
-- Seine Fortbildungen dürfen nicht willkürlich der Grund- oder Mittelschule zugewiesen werden.
WITH altbestand (name, ort, schulnummer) AS (VALUES
  ('Bismarckschule, Mittelschule Memmingen', 'Memmingen', '8580'),
  ('Edith-Stein-Schule, Grundschule Memmingen', 'Memmingen', '8583'),
  ('Elsbethenschule, Grundschule Memmingen', 'Memmingen', '8582'),
  ('Lindenschule, Mittelschule Memmingen', 'Memmingen', '8581'),
  ('Theodor-Heuss-Schule, Grundschule Memmingen', 'Memmingen', '8585'),
  ('Grundschule Memmingen-Amendingen', 'Memmingen', '8418'),
  ('Mittelschule Memmingen-Amendingen', 'Memmingen', '8586'),
  ('Grundschule Memmingen-Dickenreishausen', 'Memmingen', '8862'),
  ('Grundschule Memmingen-Steinheim', 'Memmingen', '8882'),
  ('Grundschule St. Aloysius, Privatschule Memmingen', 'Memmingen', '8421'),
  ('Grundschule Babenhausen', 'Babenhausen', '8855'),
  ('Mittelschule Babenhausen', 'Babenhausen', '8856'),
  ('Sebastian-Kneipp-Grundschule Bad Grönenbach', 'Bad Grönenbach', '8990'),
  ('Sebastian-Kneipp-Mittelschule Bad Grönenbach', 'Bad Grönenbach', '8867'),
  ('Pfarrer-Kneipp-Grundschule Bad Wörishofen', 'Bad Wörishofen', '8985'),
  ('Pfarrer-Kneipp-Mittelschule Bad Wörishofen', 'Bad Wörishofen', '8857'),
  ('Grundschule Benningen-Lachen', 'Benningen', '8859'),
  ('Dominikus-Hertel-Grundschule Boos', 'Boos', '8860'),
  ('Grundschule Buxheim', 'Buxheim', '8861'),
  ('Grundschule Dirlewang', 'Dirlewang', '8863'),
  ('Grundschule Egg a.d. Günz', 'Egg a.d. Günz', '8864'),
  ('Grundschule Erkheim', 'Erkheim', '8979'),
  ('Mittelschule Erkheim', 'Erkheim', '8865'),
  ('Albert-Schweitzer-Grundschule Ettringen', 'Ettringen', '8986'),
  ('Albert-Schweitzer-Mittelschule Ettringen', 'Ettringen', '8866'),
  ('Grundschule Heimertingen', 'Heimertingen', '8868'),
  ('Grundschule Illerbeuren', 'Kronburg-Illerbeuren', '8871'),
  ('Grundschule Kammlach', 'Kammlach', '8562'),
  ('Grundschule Kettershausen', 'Kettershausen', '8889'),
  ('Grundschule Kirchheim', 'Kirchheim i. Schw.', '8987'),
  ('Mittelschule Kirchheim', 'Kirchheim i. Schw.', '8870'),
  ('Grundschule Legau', 'Legau', '8957'),
  ('Mittelschule Legau', 'Legau', '8872'),
  ('Grundschule Markt Rettenbach', 'Markt Rettenbach', '8989'),
  ('Mittelschule Markt Rettenbach', 'Markt Rettenbach', '8873'),
  ('Christoph-Scheiner-Grundschule Markt Wald', 'Markt Wald', '8874'),
  ('Grund- und Mittelschule Memmingerberg', 'Memmingerberg', NULL),
  ('Grundschule Mindelheim', 'Mindelheim', '8876'),
  ('Mittelschule Mindelheim', 'Mindelheim', '8877'),
  ('St.-Josef-Schule, Kath. Freie Grundschule Mindelheim', 'Mindelheim', '3296'),
  ('Grundschule Ottobeuren', 'Ottobeuren', '8878'),
  ('Mittelschule Ottobeuren', 'Ottobeuren', '8879'),
  ('Grundschule Pfaffenhausen', 'Pfaffenhausen', '8978'),
  ('Mittelschule Pfaffenhausen', 'Pfaffenhausen', '8880'),
  ('Grundschule Sontheim', 'Sontheim', '8881'),
  ('Grundschule Türkheim', 'Türkheim', '8883'),
  ('Ludwig-Aurbacher-Mittelschule Türkheim', 'Türkheim', '8884'),
  ('Grundschule Tussenhausen', 'Tussenhausen', '8885'),
  ('Grundschule Westerheim', 'Westerheim', '8886'),
  ('Grundschule Wiedergeltingen', 'Wiedergeltingen', '8887'),
  ('Grundschule Wolfertschwenden', 'Wolfertschwenden', '8577'),
  ('Grundschule Woringen', 'Woringen', '8888')
)
UPDATE "Veranstaltungsort" AS v
SET "schulamtId" = b."id",
    "schulnummer" = CASE
      WHEN v."schulnummer" IS NULL AND a.schulnummer IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM "Veranstaltungsort" AS anderer
                        WHERE anderer."schulnummer" = a.schulnummer AND anderer."id" <> v."id")
      THEN a.schulnummer ELSE v."schulnummer" END
FROM altbestand AS a, "Bezirk" AS b
WHERE b."name" = 'Memmingen-Unterallgäu'
  AND v."name" = a.name AND v."ort" = a.ort
  AND v."istOnline" = false AND v."schulamtId" IS NULL;
