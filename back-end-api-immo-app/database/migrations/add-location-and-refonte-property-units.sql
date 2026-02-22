-- ============================================================
-- Référentiel Location (pays, villes) + Refonte Property/Unit
-- Marché immobilier Bénin — à exécuter si synchronize = false
-- ============================================================

-- 1. Pays
CREATE TABLE IF NOT EXISTS countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  iso_code varchar(3) NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
COMMENT ON TABLE countries IS 'Référentiel pays (Admin uniquement).';

-- 2. Villes
CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id uuid NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  name varchar(150) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(country_id, name)
);
COMMENT ON TABLE cities IS 'Référentiel villes (Admin uniquement). Propriétaire choisit city_id.';

-- 3. Types de bien (Property)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_building_type_enum') THEN
    CREATE TYPE property_building_type_enum AS ENUM (
      'villa', 'immeuble', 'bureau', 'boutique', 'magasin', 'terrain', 'maison_de_ville'
    );
  END IF;
END
$$;

-- 4. Colonnes Property (refonte) — ajout des nouveaux champs
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS name varchar(255),
  ADD COLUMN IF NOT EXISTS building_type property_building_type_enum,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city_id uuid REFERENCES cities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS main_image varchar(500),
  ADD COLUMN IF NOT EXISTS gallery jsonb DEFAULT '[]';

-- Commentaires
COMMENT ON COLUMN properties.name IS 'Ex: Villa Rose';
COMMENT ON COLUMN properties.building_type IS 'Villa, Immeuble, Bureau, Boutique, Magasin, Terrain, Maison de ville';
COMMENT ON COLUMN properties.address IS 'Adresse complète';
COMMENT ON COLUMN properties.city_id IS 'FK référentiel villes (sélection obligatoire)';
COMMENT ON COLUMN properties.main_image IS 'URL image principale';
COMMENT ON COLUMN properties.gallery IS 'Tableau d’URLs d’images';

-- 5. Table units (chambres/appartements) — remplace/complète rooms
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unit_type_enum') THEN
    CREATE TYPE unit_type_enum AS ENUM (
      'studio', 'chambre_salon', '2_chambres_salon', '3_chambres_salon', '4_chambres_salon', 'maison'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name varchar(150) NOT NULL,
  type unit_type_enum NOT NULL DEFAULT 'studio',
  price decimal(12,2) NOT NULL,
  description text,
  features jsonb DEFAULT '[]',
  images jsonb DEFAULT '[]',
  management_docs_enc text,
  is_available boolean DEFAULT true,
  surface_m2 int,
  floor int,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);
COMMENT ON TABLE units IS 'Chambre/Appartement. Une Property peut avoir plusieurs Units (Villa unique = 1 unit).';
COMMENT ON COLUMN units.features IS 'Ex: Compteur personnel, clim, balcon';
COMMENT ON COLUMN units.images IS 'Tableau d’URLs d’images';
COMMENT ON COLUMN units.management_docs_enc IS 'Documents de gestion chiffrés (AES-256-GCM, salt propriétaire).';

-- 6. Seed Bénin + villes principales (idempotent)
INSERT INTO countries (id, name, iso_code)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Bénin', 'BJ')
ON CONFLICT (iso_code) DO NOTHING;

INSERT INTO cities (country_id, name)
SELECT id, 'Cotonou' FROM countries WHERE iso_code = 'BJ' LIMIT 1
ON CONFLICT (country_id, name) DO NOTHING;

INSERT INTO cities (country_id, name)
SELECT id, 'Calavi' FROM countries WHERE iso_code = 'BJ' LIMIT 1
ON CONFLICT (country_id, name) DO NOTHING;

INSERT INTO cities (country_id, name)
SELECT id, 'Porto-Novo' FROM countries WHERE iso_code = 'BJ' LIMIT 1
ON CONFLICT (country_id, name) DO NOTHING;

INSERT INTO cities (country_id, name)
SELECT id, 'Parakou' FROM countries WHERE iso_code = 'BJ' LIMIT 1
ON CONFLICT (country_id, name) DO NOTHING;

INSERT INTO cities (country_id, name)
SELECT id, 'Abomey-Calavi' FROM countries WHERE iso_code = 'BJ' LIMIT 1
ON CONFLICT (country_id, name) DO NOTHING;
