-- =====================================================================
-- Migration : colonnes deleted_at (soft delete)
-- =====================================================================
-- Objectif : les données sensibles ne disparaissent pas en 1 coup.
-- Suppression = marquage (deleted_at), les enregistrements restent en base.
--
-- À exécuter si synchronize TypeORM est désactivé (prod).
-- Avec synchronize: true, TypeORM crée les colonnes automatiquement.
-- =====================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;
ALTER TABLE media ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

-- Index optionnels pour filtrer rapidement les actifs (deleted_at IS NULL)
CREATE INDEX IF NOT EXISTS idx_properties_deleted_at ON properties (deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users (deleted_at);
