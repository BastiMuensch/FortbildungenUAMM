-- Öffentliche, sprechende Kurzadressen für einzelne Schulamtsbezirke.
ALTER TABLE "Bezirk" ADD COLUMN "kuerzel" TEXT;

-- Der Altbestand erhält stabile, gut merkbare Adressen. Der Ablauf verarbeitet
-- jede Zeile einzeln, damit auch ungewöhnliche Namen, reservierte Pfade und
-- Kollisionen mit einem bereits gebildeten Namensslug sicher aufgelöst werden.
DO $$
DECLARE
  bezirk RECORD;
  basis TEXT;
  kandidat TEXT;
  versuch INTEGER;
BEGIN
  FOR bezirk IN SELECT "id", "name" FROM "Bezirk" ORDER BY "id" LOOP
    basis := CASE
      WHEN lower(bezirk."name") = 'günzburg' THEN 'gz'
      WHEN lower(bezirk."name") = 'memmingen-unterallgäu' THEN 'uamm'
      ELSE trim(both '-' FROM regexp_replace(
        replace(replace(replace(replace(lower(bezirk."name"), 'ä', 'ae'), 'ö', 'oe'), 'ü', 'ue'), 'ß', 'ss'),
        '[^a-z0-9]+', '-', 'g'
      ))
    END;
    basis := trim(trailing '-' FROM left(COALESCE(NULLIF(basis, ''), 'schulamt'), 60));

    IF length(basis) < 2 OR basis IN (
      'admin', 'api', 'datenschutz', 'favicon.ico', 'fortbildungen',
      'impressum', 'kalender', 'login', 'referenten-registrierung',
      'robots.txt', 'sitemap.xml', 'zugang'
    ) THEN
      basis := left('schulamt-' || basis, 60);
    END IF;

    kandidat := basis;
    versuch := 0;
    WHILE EXISTS (SELECT 1 FROM "Bezirk" WHERE "kuerzel" = kandidat) LOOP
      versuch := versuch + 1;
      -- Die UUID macht den ersten Ersatz stabil und eindeutig; der Zähler
      -- fängt selbst absichtlich gleichlautende historische Namen ab.
      kandidat := trim(trailing '-' FROM left(basis, 15)) || '-' || replace(bezirk."id", '-', '') ||
        CASE WHEN versuch = 1 THEN '' ELSE '-' || versuch::TEXT END;
    END LOOP;

    UPDATE "Bezirk" SET "kuerzel" = kandidat WHERE "id" = bezirk."id";
  END LOOP;
END $$;

ALTER TABLE "Bezirk" ALTER COLUMN "kuerzel" SET NOT NULL;
CREATE UNIQUE INDEX "Bezirk_kuerzel_key" ON "Bezirk"("kuerzel");
