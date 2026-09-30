ALTER TABLE "Fortbildung"
ADD COLUMN "dauerKorrigiertAm" TIMESTAMPTZ(3),
ADD COLUMN "endeVorKorrektur" TIMESTAMPTZ(3);
