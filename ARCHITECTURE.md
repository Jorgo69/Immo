# 🏛️ STANDARD D'ARCHITECTURE - 41DEVS (IMMO BÉNIN)

Ce document définit les règles strictes de développement pour garantir la scalabilité, la sécurité et la maintenabilité du projet. **Toute modification de code doit s'y conformer.**

---

## 🏗️ 1. BACK-END (NestJS & CQRS)

### Principes Fondamentaux
- **CQRS Pur :** Les `CommandHandlers` orchestrent, ils n'exécutent pas la logique métier complexe.
- **Services de Domaine (Laravel Style) :** Toute logique métier répétable doit être extraite dans un `DomainService` ou un `Helper`.
- **Transactions :** Toute opération impliquant plusieurs entités (ex: User + Profile) DOIT être enveloppée dans une transaction TypeORM.
- **Sécurité & Chiffrement :**
    - Les données sensibles (KYC, Identité) sont stockées dans `ProfileEntity` avec le suffixe `_enc`.
    - Utilisation obligatoire du `EncryptionService` combinant la `MASTER_KEY` et le `user.encryption_salt`.
    - Ne jamais logger de données sensibles.

### Structure des Dossiers
Chaque module doit suivre cette hiérarchie :
- `commands/` : Actions modifiant l'état.
- `queries/` : Actions de lecture.
- `services/` : Logique métier partagée (Domain Services).
- `entities/` : Modèles de données.
- `_docs/` : Documentation technique du module (README.md).

---

## 🎨 2. FRONT-END (Vue 3, Tailwind & Design System)

### Règle d'or Tailwind (Strict)
- **Aucune valeur arbitraire** dans les classes : interdiction d'écrire `text-[#345678]`, `p-[13px]`, `w-[237px]`, etc.
- **Couleurs, ombres, rayons :** Si une valeur des maquettes n'existe pas dans `tailwind.config.js`, l'ajouter sous un **nom sémantique** (ex: `brand-dark`, `ui-surface`, `primary-emerald`, `warning-orange`, `shadow-soft`, `rounded-card`).
- **Cohérence :** Utiliser exclusivement les variables du thème pour garantir une charte unifiée.

### Atomic Design & Réutilisabilité
- **Composants UI :** Interdiction de coder des styles complexes en dur. Utiliser ou créer des composants dans `@/components/ui`.
- **Composants de base (AppButton, AppInput, AppCard, AppModal, StatCard, ConfirmModal) :** Aucune valeur en dur (ex: `#ffffff`, `12px`, `red-600`) dans les fichiers `.vue`. Couleurs, bordures et fonds doivent être mappés sur les tokens du `tailwind.config.js` (ex: `bg-ui-surface`, `border-ui-border`, `text-danger-red`, `dark:bg-ui-surface-dark`, `dark:border-ui-border-dark`). Backdrop des modals : token `bg-overlay`.
- **Tokens Tailwind :** Utiliser EXCLUSIVEMENT les classes définies dans `tailwind.config.js` (ex: `text-primary-emerald`, `bg-ui-surface`). Pas de valeurs HEX arbitraires.
- **Composables :** La logique d'API, le state management et les calculs complexes doivent résider dans `@/composables`.
- **Responsive "Desktop-First Optimization" :** Bien que Mobile-First, chaque page doit exploiter l'espace horizontal sur Desktop via des Grids (`grid-cols-12`) et des Sidebars.

### Thème global (Light / Dark)
- **Un seul état à la fois :** Si le mode **light** est actif, toute l’interface est en thème clair (sidebar, header, contenu, cartes). Si le mode **dark** est actif, toute l’interface est en thème sombre. Aucune zone ne doit rester fixée en clair ou en sombre indépendamment du choix utilisateur.
- **Stratégie technique :** La classe `.dark` est appliquée sur `<html>` (voir `useTheme`). Tous les composants doivent fournir des variantes `dark:` en utilisant les **tokens dark** du thème : `dark:bg-ui-surface-dark`, `dark:border-ui-border-dark`, `dark:text-gray-100` (éviter `dark:bg-gray-800` en faveur de `dark:bg-ui-surface-dark`).

### Règles visuelles strictes (Zéro arbitraire, MallOS)
Lors de toute modification de vues ou de composants UI (en particulier en taguant `ARCHITECTURE.md` ou les vues Landlord) :

- **Zéro classe arbitraire, 100 % tokens thème :** Aucune valeur en dur dans les classes Tailwind (`text-[#xxx]`, `p-[12px]`, `min-w-[160px]`, etc.). Tout doit être mappé dans `tailwind.config.js` sous un nom sémantique (couleurs, `spacing`, `borderRadius`, `boxShadow`, `maxWidth`). Si un besoin nouveau apparaît (ombre, espacement), l’ajouter d’abord dans la config puis l’utiliser.
- **Cartes (grilles, listes) :** Utiliser le composant `AppCard` avec la prop `padding="none"` lorsque le contenu gère son propre padding. Classes obligatoires pour l’enveloppe : `bg-ui-surface`, `border-ui-border`, `rounded-2xl`, `shadow-soft` et variantes dark : `dark:bg-ui-surface-dark`, `dark:border-ui-border-dark`.
- **Densité MallOS :** Cartes denses, pas de vide inutile. Typographie : `text-sm` pour les détails/secondaire, `text-xs` pour les badges et libellés courts.
- **Badges (intelligence métier) :**
  - **Nombre de ménages :** Calcul dynamique du nombre d’unités rattachées au bien ; affichage avec le libellé i18n `landlord.kpi.households`.
  - **Accès véhicule :** Affichage du badge (icône Lucide `Car`) si le **bien** ou **au moins une de ses unités** possède un équipement de type « Parking » ou « Accès véhicule » (référentiel / `features`).
- **Barre de remplissage (occupation) :** Fond de la barre : `bg-ui-border` / `dark:bg-ui-border-dark` ; remplissage : `bg-primary-emerald`. Pas de couleurs arbitraires.
- **Icônes (Lucide-Vue-Next uniquement) :**
  - **Bibliothèque exclusive :** Toutes les icônes de l’interface proviennent de `lucide-vue-next`. Aucune autre librairie d’icônes ni emojis pour les indicateurs métier (ménages, accès véhicule, etc.).
  - **Équivalents sémantiques :** Utiliser les composants Lucide adaptés au sens (ex: `Users` pour les ménages, `Car` pour l’accès véhicule, `Home` pour les biens, `Building2` pour le patrimoine, `MapPin` pour la localisation).
  - **Tailles standard (densité MallOS) :** Dans les **cartes** (grille, compact) : `size="18"` ou `size="20"` ; dans les **KPI** (StatCard et blocs chiffrés) : `size="24"`. Pour les badges très denses (overlay sur image) : `size="14"` acceptable.
  - **Couleurs thème :** Toujours passer par les classes Tailwind du thème (ex: `text-primary-emerald`, `text-ui-muted`, `text-danger-red`, `text-white` sur fond sombre). Pas de couleur en dur sur l’icône ; utiliser `text-current` lorsque l’icône doit hériter de la couleur du parent (ex: dans StatCard).
  - **Cohérence :** Préférer la prop `size` (nombre en pixels) plutôt que `class="w-x h-x"` pour uniformiser les dimensions.
- **Sidebar :** Fine, icônes minimalistes, **thème-aware** (claire en light, sombre en dark) ; état **collapse** persisté en `localStorage` ; sous-menus **flottants** au survol en mode réduit, **accordéon** en mode étendu pour Biens et Finances.
- **Dashboard / Properties :** En-tête **KPI** (Revenu mensuel, Taux d'occupation avec barre de progression, Unités vacantes avec alerte si > 0, Paiements en attente). Cartes biens **data-dense**, `rounded-2xl`, bordures fines, `shadow-soft` ; sur chaque carte : icône `Users` + nombre de ménages, icône `Car` + badge « Accès véhicule » si pertinent, barre de progression de remplissage. Icônes Lucide exclusives, tailles 18/20 dans les cartes et 24 dans les KPI.
- **Modals :** Largeur généreuse (`max-w-modal-lg`), centrées, **backdrop blur** ; transitions douces.
- **Toasts (vue-sonner) :** Stylés selon la charte (couleurs sémantiques, ombres du thème).

### Vue Tenant (Recherche publique — Explore)
- **Page :** `src/views/tenant/Explore.vue` ; route `/explore`. Style MallOS, tokens strict, mode sombre pris en charge.
- **Filtres dynamiques :** Type (référentiel `unitTypes`), Budget (range slider min/max), Quartiers (autocomplete via `/location/cities`). Recherche texte optionnelle.
- **Affichage Split-View :** Grille 12 colonnes ; sur desktop carte 5/12 à gauche, liste résultats 7/12 à droite, avec **toggle Carte on/off** (`showMap`) pour éviter de prendre tout l'écran si l'utilisateur préfère se concentrer sur la liste. Carte = `PropertyMap` avec tokens (`border-ui-border`, `bg-ui-background`, dark).
- **Résultats :** Un flux par **unité disponible** (annonce = bien + unité). Composant `AppCard` avec `padding="none"`. Même intelligence métier que Landlord : badges Lucide `Users` (nombre de ménages du bien), `Car` (accès véhicule). Affichage du **Prix total d'entrée** (loyer + caution + frais de dossier) calculé via `useListingDisplay.totalEntryPrice`.
- **Réutilisation :** `getPrimaryImageUrlForProperty`, `hasVehicleAccess`, `totalEntryPrice` dans `@/composables/useListingDisplay.ts`. Pas de duplication de logique Landlord.
- **Navbar publique :** Logo, lien « Explorer » vers `/explore`, CTA « Devenir Landlord » (vers `/auth` si non connecté), lien **Dashboard** (vers `/admin` si connecté, contenu adapté au rôle — admin, landlord, agent, tenant). Icônes Lucide `size="20"`, couleurs thème. Menu volontairement aéré (3 entrées centrales max + actions à droite).

### Page détail bien (Vue Tenant — après clic sur une annonce)
- **Vue :** `src/views/PropertyDetailView.vue` ; route détail bien (ex. `/property/:id`). Layout **split** type Marketplace : gauche = carousel, droite = toutes les infos.
- **Carousel :** Fond = image courante en arrière-plan avec **flou** (`blur-2xl`) et overlay sombre (`bg-overlay`) ; **image nette** au premier plan (centrée, cliquable pour lightbox). **Boutons prev/next très visibles** (Lucide `ChevronLeft` / `ChevronRight`, `rounded-full`, `bg-ui-surface/90`, `shadow-soft`, bordures thème). Indicateurs de position (points) en bas. Une unité à la fois ; sélecteur d’unité en haut à droite si plusieurs.
- **Panneau droit :** Titre, ville/quartier, prix, **CTA principal « Je suis intéressé(e) »** (ouvre la modale de candidature / `RentalRequestForm`), WhatsApp secondaire. Puis **localisation** : **carte statique** (composant `PropertyMapSnippet`) — pas de scroll ni zoom sur la page ; affichage **figé** avec **cercle** de localisation approximative (rayon configurable). **Au clic** sur la carte → ouverture d’un **modal** contenant la **carte interactive** (`PropertyMap`) avec zoom/pan et bouton « Terminé » pour fermer. Texte sous la carte : ville + « La localisation est approximative » (i18n `property.locationApproximate`). Ensuite : description, équipements, conditions d’entrée (total à payer), avantages du bâtiment. Tokens strict (`border-ui-border`, `bg-ui-surface`, `text-primary-emerald`, etc.).
- **Composants :** `PropertyMapSnippet.vue` pour la carte statique (Leaflet avec `dragging: false`, `scrollWheelZoom: false`, cercle `L.circle` ; émet `click` pour ouvrir le modal). Réutilisation de `PropertyMap` dans le modal carte.

---

## 📝 3. DOCUMENTATION & CLEAN CODE

### JSDoc Obligatoire
Chaque méthode, interface ou classe doit être documentée :
```typescript
/**
 * Calcule la progression de la tirelire loyer.
 * @param currentAmount - Le solde actuel
 * @param targetAmount - L'objectif à atteindre
 * @returns Le pourcentage de progression (0-100)
 */



## 📂 5. RESPECT DE LA STRUCTURE EXISTANTE (STRICT)

### BACK-END (NestJS / CQRS)
- **Logique métier :** Interdiction de sortir du cadre `src/[Module]/commands`, `src/[Module]/queries`, etc.
- **Entités :** Toujours dans `src/[Module]/entities`.
- **Nomenclature :** Suit le format `nom-du-fichier.model.ts` ou `nom-du-fichier.handler.ts` selon l'existant.
- **Zéro déviation :** Si un dossier existe déjà pour une fonctionnalité, utilise-le. Ne crée pas de dossiers "temp" ou "misc".

### FRONT-END (Vue 3 / Vite)
- **Composants :** - `src/components/ui/` pour les atomes (boutons, inputs).
  - `src/components/layout/` pour la structure.
  - `src/components/composites/` (ou ton dossier équivalent) pour les blocs complexes.
- **Pages :** Toujours dans `src/views/` ou `src/pages/`.
- **Services/API :** Utilise tes dossiers `src/services/` ou `src/api/` sans en créer de nouveaux.
- **Prise en compte** du mode dark et light, de monnaie qui devra refleter exemple 100 XOF peut pas etre egale a $100 tu comprend?
peut etre au niveau du back tu devra le faire ou front pour pouvoir facilement manipuler

## 📊 6. PATTERN DE VISUALISATION (MULTI-VIEW)

### Règle de Densité d'Information
Pour tout module de gestion (Dashboard, Listes de biens, Users, Transactions), le système doit impérativement supporter trois modes d'affichage switchables :

1. **Vue Grille (Grid) :** - Priorité au visuel.
   - Desktop : Minimum 4 colonnes (`lg:grid-cols-4`), idéalement 6 (`xl:grid-cols-6`).
   - Cartes compactes avec image principale (`is_primary`), titre et indicateurs clés (badges).

2. **Vue Liste (Tableau) :**
   - Priorité à la gestion de masse.
   - Utilisation d'un composant de table avec tri, recherche et pagination.
   - Colonnes denses avec actions rapides (Quick Edit, Delete).

3. **Vue Compacte :**
   - Liste ultra-serrée sans images pour une vision d'ensemble rapide.

### Implémentation Technique
- **Persistance :** Le mode sélectionné doit être stocké en `localStorage` pour chaque vue.
- **Toggle UI :** Utiliser un groupe de boutons d'icônes standardisé en haut à droite de la section contenu.
- **Condition :** Si la liste contient moins de 3 éléments, la vue 'Grille' peut être imposée par défaut, mais le switch doit rester accessible.

7. ROLES & PERMISSIONS" :

NOMENCLATURE DES RÔLES (STRICT) :

Landlord : Le propriétaire bailleur (celui qui possède les Properties et Units).

Tenant : Le locataire (celui qui loue les Units).

Agent : Le gestionnaire ou démarcheur (intermédiaire).

Admin : Le gestionnaire de la plateforme (gestion des pays, villes, types).

RÈGLE : Interdiction d'utiliser le terme 'Owner'. Dans le code (URLs, variables, dossiers), utilise systématiquement ces termes. Ex: /admin/landlord/properties au lieu de /admin/owner/properties

## 🔌 8. DATA FETCHING & API CALLS (STRICT)

### Isolation des Appels API
- **Interdiction Formelle :** Aucun appel API (axios, fetch, etc.) ne doit être écrit directement dans un composant `.vue` ou une page.
- **Services API :** Tous les appels doivent résider dans `@/services/api/`. Chaque domaine (Landlord, Tenant, Location) a son propre fichier de service (ex: `landlord.service.ts`).
- **Composables (Logic Layer) :** Les composants utilisent des **Composables** (`@/composables/`) qui consomment ces services. 
    - *Exemple :* `EditPropertyModal.vue` appelle `useProperty.update()`, qui lui-même appelle `LandlordService.updateProperty()`.

### Gestion des États (State Management)
- Utilise **Pinia** pour les états globaux (User, Auth, Config).
- Utilise des états locaux réactifs (`ref`, `reactive`) dans les composables pour les formulaires éphémères.

### Centralisation des Endpoints
- Ne tape jamais d'URL en dur. Utilise une configuration centrale ou des constantes.

## 🌐 9. ROUTING & ENVIRONNEMENT (VITE PROXY)

### Gestion de l'API (Front-end)
- **Préfixe Obligatoire :** Tous les appels API doivent utiliser la variable `import.meta.env.VITE_API_BASE_URL`.
- **Proxy Dev :** En développement, l'API est préfixée par `/api`. Ne jamais coder d'URL absolue (ex: http://localhost:3000) dans les services.
- **Séparation API vs SPA :** - Les routes définies dans `vue-router` (Front) ne doivent JAMAIS entrer en conflit avec les routes du contrôleur NestJS (Back).
    - Toujours privilégier des routes Back-end claires (ex: `/api/landlord/properties`) pour éviter que le proxy ne tente d'intercepter les routes Front (ex: `/landlord/properties`).

### Configuration du Backend
- **Static Files :** Les fichiers uploadés (images) doivent être servis via un préfixe distinct (ex: `/uploads`) géré par le middleware de fichiers statiques de NestJS.
- **Base URL :** Le backend doit utiliser une variable d'environnement `BACKEND_URL` pour générer les liens absolus des images (utilisée dans les services d'upload).


## 🧱 11. DESIGN SYSTEM & COMPOSANTS ATOMIQUES

- **Principe :** Aucun élément HTML de base (`<button>`, `<input>`, `<select>`) ne doit être utilisé directement dans les vues métiers.
- **Composants Requis :**
  - `AppButton` : Gère nativement les états `:loading`, `:disabled`, les variantes (primary, danger) et prévient les doubles clics.
  - `AppInput` / `AppSelect` : Gère les labels, les messages d'erreur de validation et le style consistant.
  - `AppCard` : Structure standard pour les annonces (maison/chambre) avec ombre et arrondis uniformes.
  - `AppUpload` : Composant unique pour le drop de fichiers (images/docs) avec prévisualisation immédiate.
- **Typographie :** Utilisation systématique de `AppTitle` et `AppText` pour contrôler les tailles et couleurs de police partout.

## 📌 Unités indépendantes (sans bien)

- Les unités avec `property_id = null` (unités autonomes) sont créées via l’API (POST /property/units avec `property_id` null).
- **Listes actuelles :** Les endpoints de liste (GET /property, GET /property/owner/me, search) ne retournent que des **biens** (PropertyEntity). Les unités indépendantes n’apparaissent donc pas dans la liste globale ni dans « Mes biens ».
- **Évolution possible :** Pour les afficher comme annonces à part entière, étendre le handler « propriétés par owner » (ou un endpoint dédié) pour inclure les unités dont `property_id IS NULL` et `owner_id = owner`, en les mappant en entrées de type « bien virtuel » (même forme que PropertyListItemDto) côté backend, et adapter le front (lien détail unité vs bien).