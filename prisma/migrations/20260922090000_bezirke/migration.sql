-- Gemeinsame Plattform für Schwaben: bestehende Daten bleiben dem
-- Ausgangsbezirk zugeordnet. Der älteste aktive ADMIN wird einmalig RvS.
CREATE TABLE "Bezirk" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    "pflichtSchlagworte" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    CONSTRAINT "Bezirk_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Bezirk_name_key" ON "Bezirk"("name");

INSERT INTO "Bezirk" ("id", "name", "aktiv", "pflichtSchlagworte")
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'Memmingen-Unterallgäu',
  true,
  COALESCE(
    (SELECT ARRAY(SELECT jsonb_array_elements_text("value"::jsonb -> 'pflichtSchlagworte'))
     FROM "SystemSetting" WHERE "id" = 'schulamtProfil'),
    ARRAY['UAMM', 'Medienteam-UAMM']
  )
);

CREATE TABLE "_BezirkToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);
ALTER TABLE "_BezirkToUser" ADD CONSTRAINT "_BezirkToUser_AB_pkey" PRIMARY KEY ("A", "B");
CREATE INDEX "_BezirkToUser_B_index" ON "_BezirkToUser"("B");
ALTER TABLE "_BezirkToUser" ADD CONSTRAINT "_BezirkToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Bezirk"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_BezirkToUser" ADD CONSTRAINT "_BezirkToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "_BezirkToReferent" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);
ALTER TABLE "_BezirkToReferent" ADD CONSTRAINT "_BezirkToReferent_AB_pkey" PRIMARY KEY ("A", "B");
CREATE INDEX "_BezirkToReferent_B_index" ON "_BezirkToReferent"("B");
ALTER TABLE "_BezirkToReferent" ADD CONSTRAINT "_BezirkToReferent_A_fkey" FOREIGN KEY ("A") REFERENCES "Bezirk"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_BezirkToReferent" ADD CONSTRAINT "_BezirkToReferent_B_fkey" FOREIGN KEY ("B") REFERENCES "Referent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Altbestand gehört zu UAMM. Referenten und die bisherigen Redaktionskonten
-- werden ebenfalls dort verankert, damit der Betrieb direkt weiterläuft.
INSERT INTO "_BezirkToReferent" ("A", "B")
SELECT '00000000-0000-4000-8000-000000000001', "id" FROM "Referent";
INSERT INTO "_BezirkToUser" ("A", "B")
SELECT '00000000-0000-4000-8000-000000000001', "id" FROM "User" WHERE "role" IN ('ADMIN', 'REDAKTEUR');

-- Bootstrap: Der älteste aktive bisherige ADMIN erhält einmalig die globale RvS-Rolle.
-- Alle weiteren ADMIN-Konten bleiben BdBs des UAMM-Bezirks.
UPDATE "User" SET "role" = 'RVS'
WHERE "id" = (
  SELECT "id" FROM "User" WHERE "role" = 'ADMIN' AND "isActive" = true ORDER BY "createdAt" ASC, "id" ASC LIMIT 1
);

ALTER TABLE "Fortbildung" ADD COLUMN "bezirkId" TEXT;
UPDATE "Fortbildung" SET "bezirkId" = '00000000-0000-4000-8000-000000000001' WHERE "bezirkId" IS NULL;
ALTER TABLE "Fortbildung" ALTER COLUMN "bezirkId" SET NOT NULL;
ALTER TABLE "Fortbildung" ADD CONSTRAINT "Fortbildung_bezirkId_fkey" FOREIGN KEY ("bezirkId") REFERENCES "Bezirk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Fortbildung_bezirkId_beginn_idx" ON "Fortbildung"("bezirkId", "beginn");

ALTER TABLE "ReferentenRegistrierungslink" ADD COLUMN "bezirkId" TEXT;
UPDATE "ReferentenRegistrierungslink" SET "bezirkId" = '00000000-0000-4000-8000-000000000001' WHERE "bezirkId" IS NULL;
ALTER TABLE "ReferentenRegistrierungslink" ALTER COLUMN "bezirkId" SET NOT NULL;
ALTER TABLE "ReferentenRegistrierungslink" ADD CONSTRAINT "ReferentenRegistrierungslink_bezirkId_fkey" FOREIGN KEY ("bezirkId") REFERENCES "Bezirk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "ReferentenRegistrierungslink_bezirkId_idx" ON "ReferentenRegistrierungslink"("bezirkId");

-- Der ursprüngliche lange Constraintname wurde von PostgreSQL gekürzt.
-- An die Namenskonvention des aktuellen Prisma-Clients angleichen.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"Fortbildung"'::regclass
    AND conname = 'Fortbildung_teilnahmebestaetigungenTeilnehmendeVersandtVonId_fk') THEN
    ALTER TABLE "Fortbildung" RENAME CONSTRAINT
      "Fortbildung_teilnahmebestaetigungenTeilnehmendeVersandtVonId_fk" TO
      "Fortbildung_teilnahmebestaetigungenTeilnehmendeVersandtVon_fkey";
  END IF;
END $$;
