-- Bestehende Orte und sämtliche Fortbildungszuordnungen bleiben erhalten.
-- Die Schulamtszuordnung wird erst durch einen geprüften Schulimport ergänzt.
ALTER TABLE "Veranstaltungsort" ADD COLUMN "schulamtId" TEXT;
CREATE INDEX "Veranstaltungsort_schulamtId_idx" ON "Veranstaltungsort"("schulamtId");
ALTER TABLE "Veranstaltungsort" ADD CONSTRAINT "Veranstaltungsort_schulamtId_fkey"
  FOREIGN KEY ("schulamtId") REFERENCES "Bezirk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
