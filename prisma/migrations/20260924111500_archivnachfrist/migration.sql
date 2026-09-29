CREATE TABLE IF NOT EXISTS "ArchivnachfristFreigabe" (
  "id" TEXT NOT NULL,
  "bezirkId" TEXT NOT NULL,
  "schuljahr" INTEGER NOT NULL,
  "begruendung" TEXT NOT NULL,
  "erteiltAm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "gueltigBis" TIMESTAMPTZ(3) NOT NULL,
  "erteiltVonId" TEXT NOT NULL,
  CONSTRAINT "ArchivnachfristFreigabe_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ArchivnachfristFreigabe_bezirkId_schuljahr_key" ON "ArchivnachfristFreigabe"("bezirkId", "schuljahr");
CREATE INDEX IF NOT EXISTS "ArchivnachfristFreigabe_gueltigBis_idx" ON "ArchivnachfristFreigabe"("gueltigBis");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ArchivnachfristFreigabe_bezirkId_fkey') THEN
    ALTER TABLE "ArchivnachfristFreigabe" ADD CONSTRAINT "ArchivnachfristFreigabe_bezirkId_fkey" FOREIGN KEY ("bezirkId") REFERENCES "Bezirk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ArchivnachfristFreigabe_erteiltVonId_fkey') THEN
    ALTER TABLE "ArchivnachfristFreigabe" ADD CONSTRAINT "ArchivnachfristFreigabe_erteiltVonId_fkey" FOREIGN KEY ("erteiltVonId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
