-- Bestehende Daten nur klassifizieren: Diese Migration löscht keine Datensätze.
ALTER TABLE "Fortbildung" ADD COLUMN "schuljahr" INTEGER;
ALTER TABLE "Fortbildung" ADD COLUMN "aufbewahrenBis" TIMESTAMPTZ(3);

CREATE FUNCTION "fortbildung_schuljahr_frist"() RETURNS trigger AS $$
DECLARE
  ortszeit TIMESTAMP;
  frist TIMESTAMPTZ;
BEGIN
  ortszeit := NEW."beginn" AT TIME ZONE 'Europe/Berlin';
  NEW."schuljahr" := EXTRACT(YEAR FROM ortszeit)::INTEGER
    - CASE WHEN EXTRACT(MONTH FROM ortszeit) < 8 THEN 1 ELSE 0 END;
  IF TG_OP = 'UPDATE' AND OLD."schuljahr" IS NOT NULL AND NEW."schuljahr" <> OLD."schuljahr" THEN
    RAISE EXCEPTION 'Ein Schuljahrwechsel erfordert eine neue Veranstaltung (Kopie).';
  END IF;
  frist := (make_date(NEW."schuljahr" + 1, 8, 1) + 400)::TIMESTAMP AT TIME ZONE 'Europe/Berlin';
  IF TG_OP = 'UPDATE' AND OLD."aufbewahrenBis" IS NOT NULL THEN
    NEW."aufbewahrenBis" := LEAST(OLD."aufbewahrenBis", frist);
  ELSE
    NEW."aufbewahrenBis" := frist;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auch direkte Änderungen der abgeleiteten Felder dürfen die Frist nicht verlängern.
CREATE TRIGGER "fortbildung_schuljahr_frist_setzen"
  BEFORE INSERT OR UPDATE ON "Fortbildung"
  FOR EACH ROW EXECUTE FUNCTION "fortbildung_schuljahr_frist"();

UPDATE "Fortbildung" SET "beginn" = "beginn";
ALTER TABLE "Fortbildung" ALTER COLUMN "schuljahr" SET NOT NULL;
ALTER TABLE "Fortbildung" ALTER COLUMN "aufbewahrenBis" SET NOT NULL;
CREATE INDEX "Fortbildung_aufbewahrenBis_idx" ON "Fortbildung"("aufbewahrenBis");
CREATE INDEX "Fortbildung_bezirkId_schuljahr_idx" ON "Fortbildung"("bezirkId", "schuljahr");
