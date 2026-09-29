-- Telefonnummern gehören nicht mehr zu den Referentenstammdaten.
-- Entfernt auch vorhandene Werte; sie werden nicht in andere Felder übertragen.
ALTER TABLE "Referent" DROP COLUMN "telefon";
