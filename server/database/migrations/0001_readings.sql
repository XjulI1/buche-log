-- Passage de la saisie par delta (type + percentage) a la saisie par releve de niveau.
-- Les colonnes `level`, `reload_from` et `reload_to` sont remplies au demarrage du serveur
-- par le plugin `server/plugins/migrate-readings.ts` (rejeu chronologique par porte-buches).
-- Les anciennes colonnes deviennent facultatives et pourront etre supprimees plus tard.

ALTER TABLE consumptions
  ADD COLUMN level TINYINT UNSIGNED NULL AFTER rack_id,
  ADD COLUMN reload_from TINYINT UNSIGNED NULL AFTER level,
  ADD COLUMN reload_to TINYINT UNSIGNED NULL AFTER reload_from,
  MODIFY COLUMN type ENUM('reload', 'consumption') NULL,
  MODIFY COLUMN percentage TINYINT UNSIGNED NULL;
