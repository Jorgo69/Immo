-- Migration: ajout de la colonne description_vector pour la recherche sémantique (pgvector).
-- À exécuter après que la table properties existe (créée par TypeORM au premier démarrage).
-- Prérequis: extension vector déjà créée (voir setup-database.sql).
--
-- Dimension 384 = modèle courant (ex. sentence-transformers/all-MiniLM-L6-v2).
-- À adapter si vous utilisez un autre modèle d'embeddings.
--
-- Usage: psql -U root -d back_end_api_immo_app -f database/migrations/add-description-vector.sql

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS description_vector vector(384);

-- Index pour recherche par similarité (optionnel, améliore les perfs)
-- CREATE INDEX IF NOT EXISTS idx_properties_description_vector
--   ON properties USING ivfflat (description_vector vector_cosine_ops) WITH (lists = 100);

COMMENT ON COLUMN properties.description_vector IS 'Embedding de la description (titre+description) pour recherche sémantique pgvector.';
