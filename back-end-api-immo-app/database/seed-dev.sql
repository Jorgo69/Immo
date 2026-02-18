-- =====================================================================
-- 🌱 Données de démo — Immo Bénin (dev uniquement)
-- =====================================================================
-- À exécuter APRES :
--   1) npm run db:setup[:local]
--   2) premier démarrage du backend (TypeORM crée les tables)
--
-- Exemple :
--   psql -U postgres -d back_end_api_immo_app -f database/seed-dev.sql
--   # ou avec l’utilisateur root :
--   psql -U root -d back_end_api_immo_app -f database/seed-dev.sql
--
-- Le script est idempotent (ON CONFLICT DO NOTHING) : on peut le relancer.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Utilisateurs (4 rôles : tenant, landlord, agent, admin)
-- ---------------------------------------------------------------------

INSERT INTO users (id, phone_number, preferred_lang, role, is_active, created_at, updated_at)
VALUES
  -- Admin plateforme
  ('00000000-0000-0000-0000-000000000001', '+22961111111', 'fr', 'admin', true, NOW(), NOW()),
  -- Proprios
  ('00000000-0000-0000-0000-000000000002', '+22962222222', 'fr', 'landlord', true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003', '+22963333333', 'fr', 'landlord', true, NOW(), NOW()),
  -- Agents
  ('00000000-0000-0000-0000-000000000004', '+22964444444', 'fr', 'agent', true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000005', '+22965555555', 'fr', 'agent', true, NOW(), NOW()),
  -- Locataires (tenants)
  ('00000000-0000-0000-0000-000000000006', '+22966666666', 'fr', 'tenant', true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000007', '+22967777777', 'fr', 'tenant', true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000008', '+22968888888', 'fr', 'tenant', true, NOW(), NOW())
ON CONFLICT (phone_number) DO NOTHING;

-- ---------------------------------------------------------------------
-- Wallets (Tirelire Loyer) pour quelques users
-- ---------------------------------------------------------------------

INSERT INTO wallets (id, user_id, balance_total, balance_savings, created_at)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006',  '75000.00', '50000.00', NOW()),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000007', '150000.00', '90000.00', NOW()),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000008', ' 30000.00', '15000.00', NOW())
ON CONFLICT (user_id) DO NOTHING;

-- ---------------------------------------------------------------------
-- Transactions associées aux wallets
-- ---------------------------------------------------------------------

INSERT INTO transactions (id, wallet_id, amount, type, status, gateway_ref, created_at)
VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '50000.00', 'saving',    'completed', 'SEED-SAV-1', NOW() - INTERVAL '15 days'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '25000.00', 'rent',      'completed', 'SEED-RENT-1', NOW() - INTERVAL '3 days'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', '90000.00', 'saving',    'completed', 'SEED-SAV-2', NOW() - INTERVAL '20 days'),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', '60000.00', 'rent',      'completed', 'SEED-RENT-2', NOW() - INTERVAL '5 days'),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', '15000.00', 'saving',    'completed', 'SEED-SAV-3', NOW() - INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- Biens immobiliers (properties) + quelques médias
-- ---------------------------------------------------------------------

INSERT INTO properties (
  id,
  owner_id,
  agent_id,
  title,
  title_translations,
  description_translations,
  price_monthly,
  city,
  district,
  address_details,
  latitude,
  longitude,
  status,
  available_date,
  created_at,
  updated_at
)
VALUES
  -- Studio à Calavi (bientôt libre)
  (
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002', -- landlord
    '00000000-0000-0000-0000-000000000004', -- agent
    'Studio moderne à Calavi',
    '{"fr": "Studio moderne à Calavi", "en": "Modern studio in Calavi"}',
    '{"fr": "Petit studio calme proche université, idéal étudiant.", "en": "Quiet studio near university, ideal for students."}',
    '40000.00',
    'Abomey-Calavi',
    'Kpota',
    'Rue pavée après le carrefour Kpota, maison peinte en blanc.',
    '6.4170000',
    '2.3400000',
    'coming_soon',
    NOW() + INTERVAL '20 days',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '2 days'
  ),
  -- Appartement F3 à Fidjrossè
  (
    '30000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000005',
    'Appartement F3 à Fidjrossè',
    '{"fr": "Appartement F3 à Fidjrossè"}',
    '{"fr": "Appartement lumineux, 2 chambres, salon, proche plage.", "en": "Bright 2-bedroom flat near the beach."}',
    '120000.00',
    'Cotonou',
    'Fidjrossè',
    'Rue pavée, à 300m de la plage, quartier résidentiel.',
    '6.3520000',
    '2.4000000',
    'available',
    NULL,
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '1 day'
  ),
  -- Chambre à louer à Akpakpa
  (
    '30000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000004',
    'Chambre à louer à Akpakpa',
    '{"fr": "Chambre à louer à Akpakpa"}',
    '{"fr": "Chambre simple avec douche interne, quartier populaire.", "en": "Simple room with bathroom in popular district."}',
    '35000.00',
    'Cotonou',
    'Akpakpa',
    'Non loin du marché Dantokpa, accès facile aux taxis.',
    '6.3600000',
    '2.4600000',
    'available',
    NULL,
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '3 days'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO media (id, property_id, url, type)
VALUES
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'https://picsum.photos/seed/studio-calavi/800/600', 'image'),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'https://picsum.photos/seed/fidjrosse-f3/800/600', 'image'),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'https://picsum.photos/seed/akpakpa-room/800/600', 'image')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- Chambres (rooms) par bien
-- ---------------------------------------------------------------------

INSERT INTO rooms (id, property_id, name, type, price_monthly, surface_m2, floor, is_available, description_translations)
VALUES
  -- Studio Calavi: 1 grande pièce + coin nuit
  ('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
    'Pièce principale', 'studio', '40000.00', 18, 2, true,
    '{"fr": "Grande pièce avec coin cuisine et salon."}'),
  ('50000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001',
    'Coin nuit', 'chambre', NULL, 10, 2, true,
    '{"fr": "Espace nuit séparé visuellement du séjour."}'),

  -- F3 Fidjrossè: 2 chambres
  ('50000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002',
    'Chambre principale', 'chambre', '80000.00', 16, 1, true,
    '{"fr": "Chambre avec balcon et grande fenêtre."}'),
  ('50000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000002',
    'Chambre secondaire', 'chambre', '60000.00', 12, 1, true,
    '{"fr": "Idéale pour enfant ou colocataire."}'),

  -- Chambre Akpakpa: 1 chambre unique
  ('50000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000003',
    'Chambre Akpakpa', 'chambre', '35000.00', 12, 0, true,
    '{"fr": "Chambre simple avec douche interne."}')
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------
-- Biens supplémentaires pour les démos (plus de données en front)
-- ---------------------------------------------------------------------

INSERT INTO properties (
  id,
  owner_id,
  agent_id,
  title,
  title_translations,
  description_translations,
  price_monthly,
  city,
  district,
  address_details,
  latitude,
  longitude,
  status,
  available_date,
  created_at,
  updated_at
)
VALUES
  -- Studio centre-ville Cotonou
  (
    '30000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000005',
    'Studio meublé au centre de Cotonou',
    '{"fr": "Studio meublé au centre de Cotonou"}',
    '{"fr": "Studio climatisé, proche des administrations et des commerces."}',
    '90000.00',
    'Cotonou',
    'Ganhi',
    'Immeuble moderne près du port autonome.',
    '6.3605000',
    '2.4400000',
    'available',
    NULL,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '1 days'
  ),
  -- Maison 3 chambres à Godomey
  (
    '30000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000004',
    'Maison 3 chambres à Godomey',
    '{"fr": "Maison 3 chambres à Godomey"}',
    '{"fr": "Cour commune, route carrossable, proche des écoles et commerces."}',
    '85000.00',
    'Abomey-Calavi',
    'Godomey',
    'Rue pavée après le carrefour IITA.',
    '6.4050000',
    '2.3300000',
    'available',
    NULL,
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '3 days'
  ),
  -- Duplex moderne à Akossombo
  (
    '30000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000005',
    'Duplex moderne à Akossombo',
    '{"fr": "Duplex moderne à Akossombo"}',
    '{"fr": "Grand séjour, 4 chambres, cuisine équipée, gardiennage 24/7."}',
    '300000.00',
    'Cotonou',
    'Akossombo',
    'Lotissement calme avec gardiennage.',
    '6.3670000',
    '2.4200000',
    'available',
    NULL,
    NOW() - INTERVAL '40 days',
    NOW() - INTERVAL '10 days'
  ),
  -- Chambre étudiante à Calavi Zogbadjè
  (
    '30000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000004',
    'Chambre étudiante à Zogbadjè',
    '{"fr": "Chambre étudiante à Zogbadjè"}',
    '{"fr": "Petite chambre proche campus, eau et électricité incluses."}',
    '25000.00',
    'Abomey-Calavi',
    'Zogbadjè',
    'À 10 minutes à pied du campus.',
    '6.4360000',
    '2.3405000',
    'available',
    NULL,
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '2 days'
  ),
  -- Appartement standing à Akpakpa PK10
  (
    '30000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000005',
    'Appartement standing à Akpakpa PK10',
    '{"fr": "Appartement standing à Akpakpa PK10"}',
    '{"fr": "Résidence sécurisée, 2 chambres salon, piscine partagée."}',
    '180000.00',
    'Cotonou',
    'Akpakpa PK10',
    'Résidence fermée avec parking.',
    '6.3800000',
    '2.5000000',
    'available',
    NULL,
    NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '4 days'
  ),
  -- Maison familiale à Porto-Novo
  (
    '30000000-0000-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000004',
    'Maison familiale à Porto-Novo',
    '{"fr": "Maison familiale à Porto-Novo"}',
    '{"fr": "4 chambres, grande cour, idéale pour famille nombreuse."}',
    '70000.00',
    'Porto-Novo',
    'Ouando',
    'Quartier résidentiel proche marché Ouando.',
    '6.4950000',
    '2.6200000',
    'available',
    NULL,
    NOW() - INTERVAL '18 days',
    NOW() - INTERVAL '5 days'
  ),
  -- Chambre économique à Sèmè-Kpodji
  (
    '30000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000005',
    'Chambre économique à Sèmè-Kpodji',
    '{"fr": "Chambre économique à Sèmè-Kpodji"}',
    '{"fr": "Chambre simple, idéal pour jeune actif, proche de la RNIE1."}',
    '20000.00',
    'Sèmè-Kpodji',
    'Sèmè',
    'En bordure de la voie inter-États.',
    '6.4000000',
    '2.6500000',
    'available',
    NULL,
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '1 days'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO media (id, property_id, url, type)
VALUES
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', 'https://picsum.photos/seed/cotonou-center-studio/800/600', 'image'),
  ('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', 'https://picsum.photos/seed/godomey-house/800/600', 'image'),
  ('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000006', 'https://picsum.photos/seed/akossombo-duplex/800/600', 'image'),
  ('40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000007', 'https://picsum.photos/seed/zogbadje-room/800/600', 'image'),
  ('40000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000008', 'https://picsum.photos/seed/akpakpa-stand/800/600', 'image'),
  ('40000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000009', 'https://picsum.photos/seed/porto-novo-house/800/600', 'image'),
  ('40000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000010', 'https://picsum.photos/seed/seme-room/800/600', 'image')
ON CONFLICT (id) DO NOTHING;

INSERT INTO rooms (id, property_id, name, type, price_monthly, surface_m2, floor, is_available, description_translations)
VALUES
  ('50000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000004',
    'Studio Cotonou', 'studio', '90000.00', 20, 4, true,
    '{"fr": "Studio meublé climatisé, balcon sur le port."}'),
  ('50000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000005',
    'Chambre parents', 'chambre', '50000.00', 14, 0, true,
    '{"fr": "Chambre principale avec douche interne."}'),
  ('50000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000005',
    'Chambre enfant', 'chambre', '35000.00', 10, 0, true,
    '{"fr": "Chambre pour enfant ou bureau."}'),
  ('50000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000006',
    'Suite parentale', 'chambre', '150000.00', 22, 1, true,
    '{"fr": "Suite avec dressing et salle de bain attenante."}'),
  ('50000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000007',
    'Chambre étudiant Zogbadjè', 'chambre', '25000.00', 9, 1, true,
    '{"fr": "Chambre étudiante avec petit balcon."}'),
  ('50000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000008',
    'Chambre vue piscine', 'chambre', '100000.00', 15, 2, true,
    '{"fr": "Chambre avec vue sur la piscine de la résidence."}'),
  ('50000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000006',
    'Chambre amis', 'chambre', '80000.00', 14, 1, true,
    '{"fr": "Chambre amis avec balcon."}'),
  ('50000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000008',
    'Chambre appoint', 'chambre', '80000.00', 12, 2, true,
    '{"fr": "Chambre appoint pour invités."}'),
  ('50000000-0000-0000-0000-000000000014', '30000000-0000-0000-0000-000000000009',
    'Chambre parents Porto-Novo', 'chambre', '40000.00', 16, 0, true,
    '{"fr": "Grande chambre dans maison familiale."}'),
  ('50000000-0000-0000-0000-000000000015', '30000000-0000-0000-0000-000000000010',
    'Chambre Sèmè', 'chambre', '20000.00', 10, 0, true,
    '{"fr": "Chambre économique proche de la voie."}')
ON CONFLICT (id) DO NOTHING;
