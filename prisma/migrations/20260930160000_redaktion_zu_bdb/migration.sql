-- Bestehende Redaktionskonten werden BdB-Konten. Bezirkszuordnungen,
-- Kontostatus, Zugangstoken und MFA-Daten bleiben unverändert erhalten.
-- Die neue Rolle wird erst nach erneuter Anmeldung wirksam.
UPDATE "User"
SET "role" = 'ADMIN',
    "sessionVersion" = "sessionVersion" + 1,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "role" = 'REDAKTEUR';
