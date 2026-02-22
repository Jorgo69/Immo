# Module Property — Documentation technique

## Relation Parent / Enfant : Maison (Property) ↔ Chambre/Unité (Unit)

### Modèle métier (marché immobilier Bénin)

- **Property (La Maison)** : le bien immobilier dans son ensemble (ex. « Villa Rose », « Immeuble à Calavi »).
  - Types : Villa, Immeuble, Bureau, Boutique, Magasin, Terrain, Maison de ville.
  - Une Property a une **adresse**, un **city_id** (référentiel villes, Admin uniquement), des **coordonnées GPS** (optionnelles), une **image principale**, une **galerie**, un **titre de propriété** (chiffré).

- **Unit (ressource transactionnelle)** : Chambre, Studio, Parcelle, Bureau, etc. — entité **principale**.
  - Peut exister **sans Property** (ex: vente de parcelle) : `property_id` null, `owner_id` + adresse/ville/GPS renseignés.
  - Si rattachée à une **Property** : hérite de la localisation du bien, garde son **prix**, **description**, **équipements** (codes ref_feature), **images**, **documents de gestion** (chiffrés).
  - **Type** : référentiel `ref_types` (ref_type_id). **Statut** : `unit_status` (available, occupied, notice_given) ; si `notice_given`, **available_from** (date) obligatoire.

### Cardinalité

- Une **Property** peut avoir **plusieurs Units** (optionnel) : `Property 0..1 ——→ N Unit` (clé étrangère `unit.property_id` **nullable**).
- Une **Unit** peut être **autonome** (property_id null) : alors `owner_id`, `address`, `city_id`, `gps_*` sont utilisés.

### Chiffrement (ARCHITECTURE.md)

- **Property** : `title_deed_enc` — titre de propriété chiffré via `EncryptionService` + `owner.encryption_salt`.
- **Unit** : `management_docs_enc` — documents de gestion de la chambre/appartement, chiffrés avec le même schéma (salt du propriétaire de la Property).

### Flux de création

1. Le propriétaire crée la **Maison** (CreatePropertyCommand) : name, type, address, city_id, gps, main_image, gallery, title_deed (optionnel, chiffré).
2. **Unités** (CreateUnitCommand) : soit `property_id` (rattachée au bien), soit unité autonome avec `owner_id`, `address`, `city_id`, `gps_*`. Toujours : `ref_type_id`, name, price, description, features (codes ref_feature), images, unit_status, available_from (si notice_given), management_docs (optionnel, chiffré).

### Tables

- `properties` : id, owner_id, agent_id, name, building_type, address, city_id, gps_latitude, gps_longitude, main_image, gallery (jsonb), title_deed_enc, status, created_at, updated_at, deleted_at.
- `units` : id, **property_id (FK nullable)**, **ref_type_id (FK ref_types)**, **owner_id (FK nullable, si unité autonome)**, name, price, description, **features (jsonb string[] — codes ref_feature)**, images (jsonb), management_docs_enc, **unit_status** (available | occupied | notice_given), **available_from** (date, obligatoire si notice_given), **address, city_id, gps_latitude, gps_longitude** (pour unité autonome), surface_m2, floor, caution_months, avance_months, frais_dossier, prepaid_electricity, water_included, created_at, updated_at, deleted_at.

### Référentiel villes

- Le propriétaire **ne saisit pas librement** la ville : il **choisit** dans la liste (GET /location/cities).
- Seul l’**Admin** peut créer des pays et des villes (POST /location/countries, POST /location/cities).

---

## i18n (Internationalisation)

- **description** (Property et Unit) : JSONB `{ "fr": "...", "en": "..." }`. **fr** par défaut (`normalizeI18n`).
- **features** (Unit) : tableau de **codes** ref_feature (JSONB string[]), ex. `["Clim", "Balcon"]`. Les libellés i18n viennent du référentiel ref_features.
- Description d'image (media ou unit.images[].description) : même structure i18n.

## Images avancées

- **Property** : table `media` (url, **rank**, **is_primary**, **description** i18n). Une seule image → is_primary=true, rank=1 ; sinon première = principale si non spécifié (`normalizePropertyImages`).
- **Unit** : champ JSONB **images** = `[{ url, rank, is_primary, description? }]` (`normalizeUnitImages`).

## Traçabilité (Ownership)

- **Property** : `created_by` (UUID créateur), `owner_id` = utilisateur connecté (Landlord).
- **Unit** : `created_by` (UUID créateur, = owner du bien à la création).

## CRUD — Commandes et Handlers

| Commande | Handler | Rôle |
|----------|---------|------|
| CreatePropertyCommand | CreatePropertyHandler | Crée bien ; created_by=owner ; chiffre title_deed ; description i18n + images (media). |
| UpdatePropertyCommand | UpdatePropertyHandler | MAJ bien ; si images fourni, remplace médias. |
| CreateUnitCommand | CreateUnitHandler | Crée unité ; created_by=owner bien ; description/features/images i18n ; chiffre management_docs. |
| UpdateUnitCommand | UpdateUnitHandler | MAJ unité ; chiffre management_docs si fourni. |
| AddMediaCommand | AddMediaHandler | Ajoute média (url, type, rank, is_primary, description i18n). |

## DTOs (property/dto)

- `i18n.dto.ts` : I18nDto, normalizeI18n
- `property-image.dto.ts` : PropertyImageItemDto, normalizePropertyImages
- `unit-image.dto.ts` : UnitImageItemDto, normalizeUnitImages
- `features-i18n.dto.ts` : FeaturesI18nDto, normalizeFeaturesI18n

## Tables (colonnes ajoutées)

- **properties** : created_by, description (jsonb).
- **media** : rank, is_primary, description (jsonb), created_at.
- **units** : created_by, description (jsonb i18n), features (jsonb i18n), images (jsonb tableau structuré).
