-- Backfill ref_type_id pour les unités existantes (après sync TypeORM).
-- À exécuter une fois que ref_categories et ref_types sont peuplés (seed ou migration manuelle).
-- Attribue le type "chambre_salon" (Location) à toutes les unités sans ref_type_id.

UPDATE units u
SET ref_type_id = rt.id
FROM ref_types rt
JOIN ref_categories rc ON rt.ref_category_id = rc.id
WHERE rc.code = 'location' AND rt.code = 'chambre_salon'
  AND u.ref_type_id IS NULL;

-- Optionnel : rendre la colonne obligatoire pour les nouvelles lignes (décommenter après backfill)
-- ALTER TABLE units ALTER COLUMN ref_type_id SET NOT NULL;
