-- Bestehende Sichtbarkeit ist kein Nachweis einer eigenen Einwilligung.
ALTER TABLE "Referent" ALTER COLUMN "oeffentlichSichtbar" SET DEFAULT false;
ALTER TABLE "Referent"
  ADD COLUMN "oeffentlicheEinwilligungVersion" TEXT,
  ADD COLUMN "oeffentlicheEinwilligungAm" TIMESTAMPTZ(3),
  ADD COLUMN "namensfreigabeStand" INTEGER NOT NULL DEFAULT 0;
UPDATE "Referent" SET "oeffentlichSichtbar" = false;

CREATE TABLE "NamensfreigabeNachweis" (
  "id" TEXT NOT NULL,
  "referentId" TEXT NOT NULL,
  "handelnderUserId" TEXT NOT NULL,
  "entscheidung" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "erklaerung" TEXT NOT NULL,
  "zeitpunkt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NamensfreigabeNachweis_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "NamensfreigabeNachweis_referentId_zeitpunkt_idx"
  ON "NamensfreigabeNachweis"("referentId", "zeitpunkt");
ALTER TABLE "NamensfreigabeNachweis" ADD CONSTRAINT "NamensfreigabeNachweis_referentId_fkey"
  FOREIGN KEY ("referentId") REFERENCES "Referent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
