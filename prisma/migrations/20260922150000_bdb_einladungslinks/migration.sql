-- Bestehende Token bleiben gültig. Ihr Klartext lässt sich aus dem Hash nicht
-- rekonstruieren; nur neu erzeugte BdB-Links erhalten einen verschlüsselten Wert.
ALTER TABLE "Zugangstoken" ADD COLUMN "tokenVerschluesselt" TEXT;
