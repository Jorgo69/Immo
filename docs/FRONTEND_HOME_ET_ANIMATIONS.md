## Accueil & Animations Frontend – Immo Bénin

Ce document décrit la nouvelle expérience d’accueil (inspirée Airbnb / Bien’ici) et l’infrastructure d’animations mise en place pour le front.

---

### 1. Design system & layout

- **Largeur max** : `max-w-layout` = **1440px** (voir `tailwind.config.js` → `extend.maxWidth.layout`).
- **Typographie** (`extend.fontSize`) :
  - `xs`: `0.9rem / 1.25rem`
  - `sm`: `1rem / 1.5rem`
  - `base`: `1.125rem / 1.75rem` (18px standard)
  - `lg`: `1.25rem / 1.75rem`
  - `xl`: `1.5rem / 2rem`
- **Charte couleur** : variables CSS dans `style.css` (`--color-bg`, `--color-text`, `--color-accent`, `--color-muted`), cohérentes avec `@.cursorrules` et `PROJECT_BRAIN.md`.
- **Dark mode** : stratégie `class` Tailwind (`darkMode: 'class'`), avec transitions douces sur `body` et `#app` (`transition: background-color 0.35s ease, color 0.35s ease;`).

---

### 2. Header (MainLayout) : langue, devise, thème

Fichier : `frontend/src/layouts/MainLayout.vue`

- Conteneur : `max-w-layout mx-auto px-6 md:px-8 h-14 flex items-center justify-between gap-4`.
- **Langue** : `LanguageSwitcher.vue` (FR/EN)
  - Utilise `useI18n()` et le store `useAppStore` (`locale` + `setLocale`).
  - Changement de langue **instantané** via `locale.value = value` (composition API) sans `window.location.reload`.
  - Persistance dans `localStorage` (`immo_locale`).
- **Devise** : `CurrencySwitcher.vue`
  - Options : `XOF` (FCFA, défaut), `NGN` (Naira), `USD` (Dollar).
  - Stockée dans `useAppStore.currency` + `localStorage` (`immo_currency`).
  - Utilisée dans les cartes via la fonction `formatPrice` (`PropertyCard`).
- **Thème** : `ThemeToggle.vue`
  - Basé sur `useTheme()` (`src/composables/useTheme.ts`).
  - Toggle `light` / `dark` avec persistance (`immo_theme`) et classe `.dark` sur `document.documentElement`.
  - Label i18n (`nav.themeLight`, `nav.themeDark`).

---

### 3. Accueil : structure globale (`HomeView.vue`)

Fichier : `frontend/src/views/HomeView.vue`

Ordre des sections dans `<main class="max-w-layout mx-auto px-6 md:px-8 pb-16">` :

1. **`<HeroCarousel />`**  
   - Hero 80vh (min 420px) avec carrousel d’images (`HeroCarousel.vue`).
   - Overlay sombre (`bg-black/50`) pour lisibilité du texte.
   - Titre + intro (`home.welcome` / `home.intro`) en blanc.
   - Barre de recherche centrale inspirée Airbnb/Zillow :
     - Formulaire `max-w-2xl`, `rounded-2xl`, fond `bg-white/95`, icône `Search`, input texte, bouton CTA.
     - Redirige vers `/property` avec `?q=...` si le texte est renseigné.

2. **`<QuartiersBar />`**  
   - Barre horizontale scrollable avec boutons pour les quartiers : Fidjrossè, Calavi, Akpakpa, Cotonou, Godomey, Abomey-Calavi.
   - Chaque bouton : icône Lucide circulaire, libellé i18n (`home.quartiers.*`), redirection vers `/property?city=slug`.

3. **Section “Comment ça marche ?”** (`data-reveal`)  
   - Titre + tagline à gauche.
   - 3 cartes (`AppCard`) décrivant les étapes (`home.howStep1/2/3`).

4. **Section “Aujourd’hui sur Immo Bénin”** (`data-reveal`, `#featured-cards`)  
   - Titre + sous-titre, CTA “Explorer les biens”.
   - **Skeletons** (`PropertyCardSkeleton`) pendant le chargement (3 placeholders).
   - Ensuite : grille 3 colonnes de `PropertyCard` (mini-carrousel, favoris, hover).
   - Stagger GSAP via `registerStaggerReveal('#featured-cards')` après `nextTick()` quand `featured` est chargé.

5. **Section “Pourquoi Immo Bénin ?” + Parcours rapide** (`data-reveal`)  
   - Liste des 3 raisons (`home.whyItem1..3`).
   - Carte “Parcours rapide” avec CTA “Connexion” + “Recherche”.

6. **Section CTAs Explorer / Tirelire** (`data-reveal`)  
   - Deux boutons larges (`Explorer les biens`, `Commencer ma Tirelire`) annotés `data-btn-elastic` (micro-interactions GSAP).

---

### 4. Composants d’accueil

#### `HeroCarousel.vue` — `src/components/home/HeroCarousel.vue`

- Carrousel d’images plein écran (80vh) avec :
  - Tableau `heroImages` (URLs Unsplash, remplaçables par des médias maison).
  - Auto-rotation (`setInterval`, 5.5s) + indicateurs de slide cliquables.
  - Overlay sombre et contenu centré : titre, texte, barre de recherche.
- Barre de recherche :
  - Input `searchQuery` (v-model).
  - `onSubmit` → `/property` + `?q=...` (si non vide).

#### `QuartiersBar.vue` — `src/components/home/QuartiersBar.vue`

- Liste de quartiers (id/slug/labelKey/icon).
- Boutons horizontaux `overflow-x-auto`, design minimal, icône circulaire + label.
- Navigation vers `/property?city=<slug>`.

#### `PropertyCard.vue` — `src/components/PropertyCard.vue`

- Props :
  - `id`, `title`, `city`, `priceMonthly`, `imageUrl?`, `media?` (liste de `{ id, url, type? }`).
- Mini-carrousel :
  - Au plus 4 images (de `media` ou de `imageUrl`).
  - Indicateurs en bas si plusieurs images.
- Bouton Favoris :
  - Bouton rond en haut à droite, icône `Heart`, évènement `@favorite="(id) => ..."` (à brancher sur store ou API plus tard).
- Prix :
  - Formatté selon la devise du store (`currency`: XOF / NGN / USD).
- Micro-interaction :
  - Attribut `data-hover-scale` pour être pris en charge par GSAP (`useHoverScale`).

#### `PropertyCardSkeleton.vue` — `src/components/home/PropertyCardSkeleton.vue`

- Placeholder animé (`animate-pulse`) : bloc image + pseudo-lignes texte.
- Utilisé pendant `featuredLoading`.

---

### 5. Animations GSAP : usage dans `HomeView.vue`

Fichier : `frontend/src/views/HomeView.vue`

- Références :
  - `const mainRef = ref<HTMLElement | null>(null)` sur `<main ref=\"mainRef\">`.
  - `useScrollReveal({ scope: mainRef })` : active les reveals sur les sections marquées.
  - `useHoverScale(mainRef)` : active les hovers scale sur les éléments avec `data-hover-scale` (cartes).
  - `useButtonHover(mainRef)` : effet élastique sur les boutons `data-btn-elastic`.
- Stagger des cartes :
  - `watch(() => featured.value.length, ...)` → `nextTick()` → `staggerCleanup = registerStaggerReveal('#featured-cards')`.
  - `onUnmounted` nettoie via `staggerCleanup?.()`.

**Règles :**

- Toujours annoter les sections à révéler avec `data-reveal`.
- Pour un conteneur avec plusieurs éléments à faire apparaître en décalé, utiliser :
  - `id=\"...\"` (sélecteur unique pour `registerStaggerReveal` si chargé plus tard), ou
  - `data-reveal-stagger` + `data-reveal-item` et laisser `useScrollReveal` gérer.
- Pour les micro-interactions sur de nouveaux boutons/cartes :
  - Ajouter `data-btn-elastic` (boutons) ou `data-hover-scale` (cartes).

---

### 6. Devise & affichage des montants

- Store `useAppStore` :
  - `currency`: `'XOF' | 'NGN' | 'USD'`, persisté dans `localStorage` (`immo_currency`).
  - `setCurrency(value: string)`.
- `CurrencySwitcher.vue` :
  - Permet de changer la devise depuis le header (MainLayout + AdminLayout).
- `PropertyCard.vue` :
  - `formatPrice()` adapte l’affichage en fonction de la devise.

---

### 7. Bonnes pratiques & extensions

- Respecter les règles `@.cursorrules` :
  - **Minimal** : pas de dégradés criards, couleurs sobres, focus typographie + spacing.
  - **Lucide** pour les icônes (cohérence avec le reste de l’app).
- Pour ajouter de nouvelles sections animées :
  - Placer `data-reveal` ou `data-reveal-stagger` / `data-reveal-item` dans le template.
  - Vérifier que la section est sous le même scope (`mainRef`) ou appeler `useScrollReveal` avec un nouveau scope si besoin.

Ce fichier doit être mis à jour dès qu’on ajoute une nouvelle section d’accueil, un nouveau type de carte ou un nouveau comportement d’animation significatif.

