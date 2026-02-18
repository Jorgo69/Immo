# Roadmap — Immo Bénin

Une seule liste de tâches, par phase. Cocher au fur et à mesure.

---

## Phase 1 — Fondations backend (NestJS + CQRS)

### 1.1 Infra & config
- [x] Vérifier NestJS + TypeORM + CQRS déjà en place.
- [x] Configurer PostgreSQL avec l’extension `pgvector` (script DB + TypeORM).
- [ ] Configurer TypeORM : UUID partout, pas de `synchronize` en prod (prévoir migrations).
- [x] Créer le **EncryptionService** (AES-256-GCM) pour champs sensibles (réutilisable partout).

### 1.2 Auth (identifiant = téléphone, OTP)
- [x] Aligner l’entité **User** avec le schéma : `phone_number`, `role`, `preferred_lang`, `is_active` (sans email/password).
- [x] Adapter **Auth** : envoi OTP (mock puis WhatsApp/SMS), vérification OTP, émission JWT.
- [x] DTOs + validation (class-validator) pour request-otp / verify-otp.
- [x] (Optionnel) Entité **Profile** (lien 1–1 User) et champs chiffrés (module Profile + page front).

### 1.3 Module Wallet (Tirelire + transactions)
- [x] Entités **Wallet** et **Transaction** alignées sur le schéma DBML.
- [x] CRUD / CQRS de base (création wallet, enregistrement transaction).
- [x] Logique Tirelire : versement, seuils, statut (épargne vs disponible).
- [x] Transactions DB obligatoires (ACID) pour tout mouvement d’argent.
- [x] DTOs + validation pour chaque commande.

### 1.4 Module Property (biens immobiliers)
- [x] Entités **Property** et **Media** (alignées schéma : titre/description JSONB ; pgvector à venir).
- [x] CRUD + CQRS de base (création, mise à jour, liste, détail, médias).
- [x] Recherche par texte (GET /property/search).
- [x] Soft delete sur toutes les entités (données sensibles conservées, masquées).
- [x] Seed ~100 biens (script generate-seed-100.js + seed-dev-100.sql).
- [ ] Recherche sémantique : génération d’embeddings et requête pgvector (à brancher sur un modèle d’embeddings).
- [ ] DTOs + validation ; gestion des rôles (proprio, agent, admin).

---

## Phase 2 — Interface (Vue.js 3 + PWA)

### 2.1 Setup frontend
- [x] Initialiser Vue 3 (Vite) + Tailwind + Pinia + vue-i18n.
- [x] Design system minimaliste (Bento, palette #F9FAFB / #111827 / #059669, Lucide-Vue).
- [x] Structure de routes et layout (auth, dashboard, recherche, etc.).

### 2.2 Parcours utilisateur
- [x] Pages Auth (saisie téléphone, OTP, redirection).
- [x] Dashboard locataire : vue d’ensemble Tirelire + prochain loyer.
- [x] Filtres de recherche (ville, prix) + liste et détail biens.
- [x] Carte géographique (Leaflet, vue Liste/Carte sur la recherche).
- [x] Barre de recherche texte (titre, ville, description) ; sémantique pgvector à brancher plus tard.
- [ ] Interface recherche IA (chat / embeddings).

### 2.3 PWA & offline
- [x] Service Workers + stratégie de cache (vite-plugin-pwa).
- [ ] IndexedDB pour consultation annonces/biens sans connexion (optionnel).
- [x] Gestion du mode hors-ligne (message « Vous êtes hors ligne » en bas de page).

---

## Phase 3 — Fonctionnalités avancées

### 3.1 Médias & disponibilité
- [ ] Lecteur médias 360° (ex. Three.js) et vidéos courtes.
- [ ] Module préavis : envoi préavis → mise à jour statut bien « Bientôt libre » / `available_date`.

### 3.2 Paiements & notifs
- [ ] Intégration réelle FedaPay / KkiPay (split payment Proprio / Agent / Plateforme).
- [ ] Intégration WhatsApp (et/ou SMS) pour relances loyer et envoi de reçus.
- [ ] Module de relevé des compteurs avec preuve photo (SBEE/SONEB), champs chiffrés.

### 3.3 Recherche IA
- [ ] Pipeline embeddings (modèle choisi) → stockage dans `description_vector`.
- [ ] Recherche sémantique multilingue (FR/EN) exposée dans l’API et l’UI.

---

## Phase 4 — Sécurité & production

- [ ] Chiffrement effectif de toutes les tables sensibles (profiles, compteurs, etc.) via EncryptionService.
- [ ] Désactiver `synchronize` en prod ; migrations TypeORM versionnées.
- [ ] Tests d’intrusion / revue sécurité (auth, rôles, injections).
- [ ] Monitoring (ex. Sentry, Prometheus) et logs structurés.
- [ ] Documentation API (Swagger/OpenAPI à jour) et README déploiement.
