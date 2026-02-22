# Module References — Moteur de référentiels

## Objectif

Permettre à l’**Admin** d’ajouter de nouveaux types (ex: Parcelle, Bureau) et caractéristiques en base **sans modifier le code**. Le système reste agnostique (Location, Vente, etc.) et isolé : un futur module Vente n’impacte pas le module Location.

## Hiérarchie des données

- **RefCategory** (ex: Location, Vente) : catégorie de ressources.
- **RefType** (ex: Chambre, Studio, Parcelle, Bureau) : lié à une **RefCategory**.
- **RefFeature** (ex: Staffé, Dallé, Compteur personnel, Titre foncier) : lié à un **RefType**.

Les tables legacy `unit_types` et `unit_features` restent pour compatibilité (GET /ref/all). Les nouvelles entités sont `ref_categories`, `ref_types`, `ref_features`.

## Tables

### ref_categories

| Colonne     | Type         | Description                    |
|------------|--------------|--------------------------------|
| id         | uuid PK      |                                |
| code       | varchar(50)  | Unique (ex: location, vente)   |
| label_fr   | varchar(100) |                                |
| label_en   | varchar(100) |                                |
| sort_order | int          | Ordre d’affichage               |

### ref_types

| Colonne         | Type        | Description                          |
|-----------------|-------------|--------------------------------------|
| id              | uuid PK     |                                      |
| ref_category_id | uuid FK     | ref_categories(id) ON DELETE CASCADE |
| code            | varchar(50) | Unique par catégorie                 |
| label_fr        | varchar(100)|                                      |
| label_en        | varchar(100)|                                      |
| sort_order      | int         |                                      |

Contrainte : `UNIQUE(ref_category_id, code)`.

### ref_features

| Colonne     | Type        | Description                     |
|-------------|-------------|---------------------------------|
| id          | uuid PK     |                                 |
| ref_type_id | uuid FK     | ref_types(id) ON DELETE CASCADE |
| code        | varchar(80) | Unique par type                |
| label_fr    | varchar(100)|                                 |
| label_en    | varchar(100)|                                 |
| sort_order  | int         |                                 |

Contrainte : `UNIQUE(ref_type_id, code)`.

## Relations

- **RefCategory** 1 ——→ N **RefType**
- **RefType** 1 ——→ N **RefFeature**
- **Unit** (module Property) N ——→ 1 **RefType** (chaque unité a un `ref_type_id`).
- Les équipements d’une unité sont stockés comme tableau de **codes** ref_feature dans `unit.features` (JSONB string[]).

## Isolation

- Le module **Location** consomme la catégorie « Location » et ses types (Chambre, Studio, etc.).
- Un futur module **Vente** consommera la catégorie « Vente » et ses types (Parcelle, etc.) sans modifier les entités ou handlers Location.
