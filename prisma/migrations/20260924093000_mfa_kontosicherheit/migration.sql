ALTER TABLE "User"
  ADD COLUMN "mfaSecretVerschluesselt" TEXT,
  ADD COLUMN "mfaAusstehendesSecretVerschluesselt" TEXT,
  ADD COLUMN "mfaAusstehendBis" TIMESTAMPTZ(3),
  ADD COLUMN "mfaAktiviertAm" TIMESTAMPTZ(3),
  ADD COLUMN "mfaLetzterZaehler" INTEGER,
  ADD COLUMN "mfaWiederherstellungscodeHashes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
