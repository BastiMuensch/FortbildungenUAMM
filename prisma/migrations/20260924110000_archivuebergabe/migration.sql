-- Kontrollierte Archivübergabe: ein datensparsames Paket pro Bezirk/Schuljahr
-- und ein separater Nachweis der externen, lesbaren Ablage.
CREATE TABLE "Archivpaket" (
    "id" TEXT NOT NULL,
    "bezirkId" TEXT NOT NULL,
    "schuljahr" INTEGER NOT NULL,
    "paketkennung" TEXT NOT NULL,
    "inhaltsHash" TEXT NOT NULL,
    "anzahl" INTEGER NOT NULL,
    "erstelltAm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "erstelltVonId" TEXT,
    CONSTRAINT "Archivpaket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Archivuebernahme" (
    "id" TEXT NOT NULL,
    "archivpaketId" TEXT NOT NULL,
    "externeAblage" TEXT NOT NULL,
    "lesbarkeitBestaetigtAm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bestaetigtVonId" TEXT NOT NULL,
    "inhaltsHash" TEXT NOT NULL,
    CONSTRAINT "Archivuebernahme_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Archivpaket_paketkennung_key" ON "Archivpaket"("paketkennung");
CREATE UNIQUE INDEX "Archivpaket_bezirkId_schuljahr_key" ON "Archivpaket"("bezirkId", "schuljahr");
CREATE INDEX "Archivpaket_schuljahr_idx" ON "Archivpaket"("schuljahr");
CREATE INDEX "Archivuebernahme_archivpaketId_lesbarkeitBestaetigtAm_idx" ON "Archivuebernahme"("archivpaketId", "lesbarkeitBestaetigtAm");

ALTER TABLE "Archivpaket" ADD CONSTRAINT "Archivpaket_bezirkId_fkey"
  FOREIGN KEY ("bezirkId") REFERENCES "Bezirk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Archivpaket" ADD CONSTRAINT "Archivpaket_erstelltVonId_fkey"
  FOREIGN KEY ("erstelltVonId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Archivuebernahme" ADD CONSTRAINT "Archivuebernahme_archivpaketId_fkey"
  FOREIGN KEY ("archivpaketId") REFERENCES "Archivpaket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Archivuebernahme" ADD CONSTRAINT "Archivuebernahme_bestaetigtVonId_fkey"
  FOREIGN KEY ("bestaetigtVonId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
