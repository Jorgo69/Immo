-- ============================================================
-- Moteur de référentiels (RefCategory → RefType → RefFeature)
-- + Unit indépendante (property_id optionnel, unit_status, available_from)
-- + RentalRequest (demandes de location)
-- Isolation : module Location ; futur module Vente n'impacte pas ces tables.
-- ============================================================

-- 1. Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unit_status_enum') THEN
    CREATE TYPE unit_status_enum AS ENUM ('available', 'occupied', 'notice_given');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rental_request_status_enum') THEN
    CREATE TYPE rental_request_status_enum AS ENUM ('pending', 'accepted', 'rejected');
  END IF;
END
$$;

-- 2. Table ref_categories (Location, Vente, …)
CREATE TABLE IF NOT EXISTS ref_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(50) UNIQUE NOT NULL,
  label_fr varchar(100) NOT NULL,
  label_en varchar(100) DEFAULT '',
  sort_order int DEFAULT 0
);
COMMENT ON TABLE ref_categories IS 'Catégories de ressources (Location, Vente). Admin peut en ajouter sans déploiement.';

INSERT INTO ref_categories (code, label_fr, label_en, sort_order) VALUES
  ('location', 'Location', 'Rental', 1),
  ('vente', 'Vente', 'Sale', 2)
ON CONFLICT (code) DO NOTHING;

-- 3. Table ref_types (liée à une catégorie)
CREATE TABLE IF NOT EXISTS ref_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_category_id uuid NOT NULL REFERENCES ref_categories(id) ON DELETE CASCADE,
  code varchar(50) NOT NULL,
  label_fr varchar(100) NOT NULL,
  label_en varchar(100) DEFAULT '',
  sort_order int DEFAULT 0,
  UNIQUE(ref_category_id, code)
);
COMMENT ON TABLE ref_types IS 'Types d''unités par catégorie (Chambre, Studio, Parcelle, Bureau).';

INSERT INTO ref_types (ref_category_id, code, label_fr, label_en, sort_order)
SELECT id, 'studio', 'Studio', 'Studio', 1 FROM ref_categories WHERE code = 'location' LIMIT 1
ON CONFLICT (ref_category_id, code) DO NOTHING;
INSERT INTO ref_types (ref_category_id, code, label_fr, label_en, sort_order)
SELECT id, 'chambre_salon', 'Chambre-Salon', 'Bedroom-Living', 2 FROM ref_categories WHERE code = 'location' LIMIT 1
ON CONFLICT (ref_category_id, code) DO NOTHING;
INSERT INTO ref_types (ref_category_id, code, label_fr, label_en, sort_order)
SELECT id, '2_chambres_salon', '2 Chambres-Salon', '2 Bedrooms-Living', 3 FROM ref_categories WHERE code = 'location' LIMIT 1
ON CONFLICT (ref_category_id, code) DO NOTHING;
INSERT INTO ref_types (ref_category_id, code, label_fr, label_en, sort_order)
SELECT id, '3_chambres_salon', '3 Chambres-Salon', '3 Bedrooms-Living', 4 FROM ref_categories WHERE code = 'location' LIMIT 1
ON CONFLICT (ref_category_id, code) DO NOTHING;
INSERT INTO ref_types (ref_category_id, code, label_fr, label_en, sort_order)
SELECT id, '4_chambres_salon', '4 Chambres-Salon', '4 Bedrooms-Living', 5 FROM ref_categories WHERE code = 'location' LIMIT 1
ON CONFLICT (ref_category_id, code) DO NOTHING;
INSERT INTO ref_types (ref_category_id, code, label_fr, label_en, sort_order)
SELECT id, 'maison', 'Maison', 'House', 6 FROM ref_categories WHERE code = 'location' LIMIT 1
ON CONFLICT (ref_category_id, code) DO NOTHING;

-- 4. Table ref_features (liée à un type)
CREATE TABLE IF NOT EXISTS ref_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_type_id uuid NOT NULL REFERENCES ref_types(id) ON DELETE CASCADE,
  code varchar(80) NOT NULL,
  label_fr varchar(100) NOT NULL,
  label_en varchar(100) DEFAULT '',
  sort_order int DEFAULT 0,
  UNIQUE(ref_type_id, code)
);
COMMENT ON TABLE ref_features IS 'Caractéristiques par type (Staffé, Dallé, Compteur personnel, Titre foncier).';

-- Attacher les features au type chambre_salon pour le seed
INSERT INTO ref_features (ref_type_id, code, label_fr, label_en, sort_order)
SELECT rt.id, 'Clim', 'Climatisation', 'Air conditioning', 1 FROM ref_types rt JOIN ref_categories rc ON rt.ref_category_id = rc.id WHERE rc.code = 'location' AND rt.code = 'chambre_salon' LIMIT 1
ON CONFLICT (ref_type_id, code) DO NOTHING;
INSERT INTO ref_features (ref_type_id, code, label_fr, label_en, sort_order)
SELECT rt.id, 'Balcon', 'Balcon', 'Balcony', 2 FROM ref_types rt JOIN ref_categories rc ON rt.ref_category_id = rc.id WHERE rc.code = 'location' AND rt.code = 'chambre_salon' LIMIT 1
ON CONFLICT (ref_type_id, code) DO NOTHING;
INSERT INTO ref_features (ref_type_id, code, label_fr, label_en, sort_order)
SELECT rt.id, 'Compteur personnel', 'Compteur personnel', 'Private meter', 3 FROM ref_types rt JOIN ref_categories rc ON rt.ref_category_id = rc.id WHERE rc.code = 'location' AND rt.code = 'chambre_salon' LIMIT 1
ON CONFLICT (ref_type_id, code) DO NOTHING;

-- 5. Alter units : nouveaux champs
ALTER TABLE units
  ADD COLUMN IF NOT EXISTS ref_type_id uuid REFERENCES ref_types(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS unit_status unit_status_enum DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS available_from date,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city_id uuid REFERENCES cities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS gps_latitude decimal(10,7),
  ADD COLUMN IF NOT EXISTS gps_longitude decimal(10,7),
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES users(id) ON DELETE CASCADE;

COMMENT ON COLUMN units.ref_type_id IS 'Type d''unité (référentiel). Obligatoire.';
COMMENT ON COLUMN units.unit_status IS 'available | occupied | notice_given. Si notice_given, available_from obligatoire.';
COMMENT ON COLUMN units.available_from IS 'Date de libération si unit_status = notice_given.';
COMMENT ON COLUMN units.owner_id IS 'Propriétaire direct si property_id est null (unité autonome).';

-- Backfill ref_type_id depuis l''ancienne colonne type (unit_type_enum)
UPDATE units u
SET ref_type_id = rt.id
FROM ref_types rt
JOIN ref_categories rc ON rt.ref_category_id = rc.id
WHERE rc.code = 'location' AND rt.code = u.type::text
  AND u.ref_type_id IS NULL;

-- Rendre ref_type_id obligatoire après backfill (pour les nouvelles lignes)
ALTER TABLE units ALTER COLUMN ref_type_id SET NOT NULL;

-- Supprimer ancienne colonne type et is_available
ALTER TABLE units DROP COLUMN IF EXISTS type;
ALTER TABLE units DROP COLUMN IF EXISTS is_available;

-- property_id devient nullable (unité peut exister sans bien)
ALTER TABLE units ALTER COLUMN property_id DROP NOT NULL;

-- 6. Table rental_requests
CREATE TABLE IF NOT EXISTS rental_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status rental_request_status_enum DEFAULT 'pending',
  message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  responded_by uuid REFERENCES users(id) ON DELETE SET NULL
);
COMMENT ON TABLE rental_requests IS 'Demandes de location. Flux : création par locataire → validation propriétaire → unit_status = OCCUPIED. WhatsApp = notification uniquement.';
