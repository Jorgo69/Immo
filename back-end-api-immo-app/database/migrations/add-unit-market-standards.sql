-- Standards marché local : caution, avance, frais dossier, SBEE, eau incluse.
-- À exécuter manuellement si synchronize TypeORM est désactivé.

ALTER TABLE units
  ADD COLUMN IF NOT EXISTS caution_months int DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS avance_months int DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS frais_dossier decimal(12,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS prepaid_electricity boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS water_included boolean DEFAULT false;
