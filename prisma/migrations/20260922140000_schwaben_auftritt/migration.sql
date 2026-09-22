-- Der öffentliche Auftritt gilt für Schwaben. Nur unveränderte UAMM-Standardwerte
-- ersetzen; individuelle Texte, Rechtstexte und Kalenderkennungen bleiben erhalten.
WITH ersetzungen (feld, alt, neu) AS (
  VALUES
    ('name', 'Staatliches Schulamt im Landkreis Unterallgäu und in der Stadt Memmingen', 'Fortbildungsportal Schwaben'),
    ('kurzname', 'Schulamt Memmingen-Unterallgäu', 'Fortbildungen Schwaben'),
    ('region', 'Memmingen · Unterallgäu', 'Schwaben'),
    ('angebotsRegion', 'Memmingen und dem Unterallgäu', 'Schwaben'),
    ('startText', 'Suche für das neue Fortbildungsangebot für Grund- und Mittelschulen in Memmingen und dem Unterallgäu.', 'Suche für das neue Fortbildungsangebot für Grund- und Mittelschulen in Schwaben.')
), aktualisierungen AS (
  SELECT eintrag."id", jsonb_object_agg(ersetzungen.feld, ersetzungen.neu) AS werte
  FROM "SystemSetting" AS eintrag
  CROSS JOIN ersetzungen
  WHERE eintrag."id" = 'schulamtProfil'
    AND eintrag."value"::jsonb ->> ersetzungen.feld = ersetzungen.alt
  GROUP BY eintrag."id"
)
UPDATE "SystemSetting" AS eintrag
SET "value" = (eintrag."value"::jsonb || aktualisierungen.werte)::text,
    "updatedAt" = CURRENT_TIMESTAMP
FROM aktualisierungen
WHERE eintrag."id" = aktualisierungen."id";
