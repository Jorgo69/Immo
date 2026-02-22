-- Tables de référence (property_types, property_statuses, unit_types, unit_features)
-- À exécuter manuellement si synchronize TypeORM est désactivé.
-- Avec synchronize: true, TypeORM crée les tables. Ce fichier sert surtout au seed.

-- 1. property_types
CREATE TABLE IF NOT EXISTS property_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(50) UNIQUE NOT NULL,
  label_fr varchar(100) NOT NULL,
  label_en varchar(100) DEFAULT '',
  sort_order int DEFAULT 0
);

INSERT INTO property_types (code, label_fr, label_en, sort_order) VALUES
  ('villa', 'Villa', 'Villa', 1),
  ('immeuble', 'Immeuble', 'Building', 2),
  ('bureau', 'Bureau', 'Office', 3),
  ('boutique', 'Boutique', 'Shop', 4),
  ('magasin', 'Magasin', 'Store', 5),
  ('terrain', 'Terrain', 'Land', 6),
  ('maison_de_ville', 'Maison de ville', 'Town house', 7)
ON CONFLICT (code) DO NOTHING;

-- 2. property_statuses
CREATE TABLE IF NOT EXISTS property_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(50) UNIQUE NOT NULL,
  label_fr varchar(100) NOT NULL,
  label_en varchar(100) DEFAULT '',
  color varchar(30) DEFAULT NULL,
  sort_order int DEFAULT 0
);

INSERT INTO property_statuses (code, label_fr, label_en, color, sort_order) VALUES
  ('available', 'Disponible', 'Available', 'green', 1),
  ('coming_soon', 'Bientôt disponible', 'Coming soon', 'amber', 2),
  ('occupied', 'Occupé', 'Occupied', 'gray', 3),
  ('maintenance', 'En maintenance', 'Under maintenance', 'orange', 4)
ON CONFLICT (code) DO NOTHING;

-- 3. unit_types
CREATE TABLE IF NOT EXISTS unit_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(50) UNIQUE NOT NULL,
  label_fr varchar(100) NOT NULL,
  label_en varchar(100) DEFAULT '',
  sort_order int DEFAULT 0
);

INSERT INTO unit_types (code, label_fr, label_en, sort_order) VALUES
  ('studio', 'Studio', 'Studio', 1),
  ('chambre_salon', 'Chambre-Salon', 'Bedroom-Living', 2),
  ('2_chambres_salon', '2 Chambres-Salon', '2 Bedrooms-Living', 3),
  ('3_chambres_salon', '3 Chambres-Salon', '3 Bedrooms-Living', 4),
  ('4_chambres_salon', '4 Chambres-Salon', '4 Bedrooms-Living', 5),
  ('maison', 'Maison', 'House', 6)
ON CONFLICT (code) DO NOTHING;

-- 4. unit_features
CREATE TABLE IF NOT EXISTS unit_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(80) UNIQUE NOT NULL,
  label_fr varchar(100) NOT NULL,
  label_en varchar(100) DEFAULT '',
  sort_order int DEFAULT 0
);

INSERT INTO unit_features (code, label_fr, label_en, sort_order) VALUES
  ('Clim', 'Climatisation', 'Air conditioning', 1),
  ('Balcon', 'Balcon', 'Balcony', 2),
  ('Compteur personnel', 'Compteur personnel', 'Private meter', 3)
ON CONFLICT (code) DO NOTHING;
