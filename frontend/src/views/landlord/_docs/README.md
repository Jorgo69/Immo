# Module Landlord — Gestion des propriétés (propriétaire)

Ce dossier contient les vues réservées au rôle **landlord** (propriétaire). Les agents immobiliers et admins ont d’autres entrées (admin) pour gérer l’ensemble des biens.

## Flux principal

1. **Liste des biens** (`Properties.vue`)  
   Grille large (grid-cols-12, 4 colonnes sur desktop). Chaque carte affiche le **nombre d’unités** (badge).  
   EmptyState avec CTA « Déclarer un bien » si aucun bien.

2. **Création d’une maison** (`AddPropertyModal.vue`)  
   Stepper en 3 étapes :
   - **Étape 1** : Nom, type de bien (Villa, Immeuble, Bureau, Boutique, Magasin, Terrain, Maison de ville), adresse, **Pays** (select référentiel), **Ville** (select chargé selon le pays), statut.  
     Validation stricte : tous ces champs obligatoires pour débloquer « Suivant ».
   - **Étape 2** : GPS optionnel (lat/long).
   - **Étape 3** : Titre de propriété (optionnel, chiffré côté back), photos (dropzone).

3. **Après création de la maison**  
   Le modal se ferme et **AddUnitModal** s’ouvre automatiquement pour ajouter au moins une unité (chambre, studio, appartement) au bien créé.  
   L’utilisateur peut créer plusieurs unités à la suite ou fermer et revenir plus tard.

4. **Ajout d’unités** (`AddUnitModal.vue`)  
   Saisie : Nom (ex. Studio A1), Type (Studio, Chambre-Salon, 2 Chambres-Salon, etc.), Prix mensuel (FCFA), Équipements (checkboxes : Clim, Balcon, Compteur personnel).  
   Ouvert soit après création de maison (propertyId + propertyName), soit depuis une fiche bien (à brancher si besoin).

## Propriétés complexes (immeubles, villas multi-unités)

- **Un bien (Property)** = une maison / un immeuble / un terrain. Il a un **nom**, un **type** (Villa, Immeuble, etc.), une **adresse**, une **ville** (obligatoirement choisie dans le référentiel).
- **Chaque bien contient une ou plusieurs unités (Units)**. Une villa « unique » = 1 bien avec 1 unité. Un immeuble = 1 bien avec N unités.
- Pour gérer un **immeuble** : créer le bien (nom, type « Immeuble », adresse, ville), puis ajouter autant d’unités que nécessaire (Studio A1, Appart B2, etc.) avec prix et équipements par unité.
- Le **badge « X unités »** sur chaque carte permet de voir d’un coup d’œil la taille du bien. Revenu et détail par unité pourront être ajoutés plus tard (fiche bien, tableaux de bord).

## Conformité

- **Référentiel** : Pays et villes chargés via `GET /location/countries` et `GET /location/cities?country_id=...`. Aucune saisie libre de ville.
- **Validation** : Les champs requis du formulaire maison correspondent à `CreatePropertyCommand` (name, building_type, address, city_id). Le bouton « Suivant » n’est actif que lorsque l’étape courante est valide.
- **Design** : Tokens Tailwind (pas de HEX en dur), composants `@/components/ui`, grille large desktop (grid-cols-12).
