-- Tägliche verschlüsselte Anwendungssicherungen. Die Statuswerte bleiben
-- absichtlich Strings, siehe Projektkonvention zu Prisma-Enums.
CREATE TABLE "Datensicherung" (
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'LAEUFT',
    "dateiname" TEXT,
    "sha256" TEXT,
    "bytes" BIGINT,
    "erstelltAm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "abgelegtAm" TIMESTAMPTZ(3),
    "abgelegtVonId" TEXT,
    "externeAblage" TEXT,
    "fehler" TEXT,
    "geloeschtAm" TIMESTAMPTZ(3),
    "heruntergeladenAm" TIMESTAMPTZ(3),
    CONSTRAINT "Datensicherung_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Datensicherung_tag_key" ON "Datensicherung"("tag");
CREATE INDEX "Datensicherung_status_tag_idx" ON "Datensicherung"("status", "tag");
CREATE INDEX "Datensicherung_geloeschtAm_idx" ON "Datensicherung"("geloeschtAm");
ALTER TABLE "Datensicherung" ADD CONSTRAINT "Datensicherung_abgelegtVonId_fkey"
  FOREIGN KEY ("abgelegtVonId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
