-- Colonne preferred_zones (plusieurs zones, type Twitter « sujets qui m’intéressent »).
-- À exécuter si synchronize TypeORM est désactivé (prod).
-- Avec synchronize: true, TypeORM crée la colonne automatiquement.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS preferred_zones jsonb DEFAULT NULL;

COMMENT ON COLUMN profiles.preferred_zones IS 'Liste d’identifiants de zones (ex. quartiers) sélectionnées par l’utilisateur.';
