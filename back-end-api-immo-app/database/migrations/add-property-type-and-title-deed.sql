-- Type de bien (unique ou immeuble à plusieurs unités) et titre de propriété chiffré.
-- À exécuter si synchronize TypeORM est désactivé (prod).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_type_enum') THEN
    CREATE TYPE property_type_enum AS ENUM ('single', 'multi_unit');
  END IF;
END
$$;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS property_type property_type_enum DEFAULT 'single',
  ADD COLUMN IF NOT EXISTS title_deed_enc text DEFAULT NULL;

COMMENT ON COLUMN properties.property_type IS 'Bien unique (maison, studio) ou immeuble à plusieurs unités.';
COMMENT ON COLUMN properties.title_deed_enc IS 'Titre de propriété chiffré (AES-256-GCM, salt propriétaire).';
