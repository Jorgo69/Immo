# PROJECT BRAIN — Source de vérité

Document unique de référence pour la plateforme immobilière Immo Bénin.

---

## 1. Contexte : Problèmes & Solutions (Bénin / Afrique)

### Problèmes (Pain Points)

- **Frais de visite abusifs** — Les locataires paient des « frais de visite » à répétition pour des biens qui ne correspondent pas aux photos ou à la réalité.
- **Incapacité d’épargne** — Difficulté à sortir 3 à 6 mois de loyer/caution d’un coup.
- **Défiance des propriétaires** — Pas d’historique de fiabilité des locataires (impayés, dégradations).
- **Gestion manuelle** — Reçus papier perdus, litiges sur les compteurs (eau/électricité), préavis non respectés.
- **Barrière de la langue** — Difficulté pour les expatriés ou non-francophones de trouver des biens fiables.

### Solution (Value Proposition)

- **Visite immersive & transparente** — Réduire les déplacements par visites 360° et vidéos réelles.
- **Tirelire Loyer** — Épargne progressive quotidienne/hebdomadaire par Mobile Money pour payer le loyer à l’échéance.
- **Profil de confiance** — Notation réciproque et vérification KYC (identité).
- **Automatisation** — Contrats numériques, reçus auto via WhatsApp, gestion photo des compteurs.
- **Recherche IA multilingue** — Assistant en langage naturel (« Je veux un studio à Akpakpa… ») en FR/EN.

---

## 2. Vision

Une infrastructure immobilière complète pour le Bénin, gérant le cycle de vie du locataire de la recherche à la sortie : PropTech adaptée aux réalités locales pour automatiser la location longue durée, sécuriser les paiements et réduire les frictions entre Locataires, Propriétaires et Agents.

---

## 3. Fonctionnalités clés

| Domaine | Détail |
|--------|--------|
| **Tirelire Loyer** | Épargne progressive par Mobile Money (MTN/Moov/Celtiis). |
| **Recherche IA** | Sémantique en langage naturel (ex. « Chambre propre à Calavi à 40k ») via pgvector. |
| **Visites immersives** | Photos, vidéos 360°, vidéos courtes (style TikTok). |
| **Disponibilité** | Statut « Bientôt libre » déclenché par le préavis numérique. |
| **Finances** | Split payment automatique (FedaPay/KkiPay) : Proprio (X%), Agent (Y%), Plateforme (Z%). |
| **Notifications** | Rappels loyer et reçus via WhatsApp / SMS / Push In-App. |
| **Compteurs** | Relevé photo SBEE/SONEB à l’entrée/sortie. |

---

## 4. Stack technique

- **Backend** — NestJS (CQRS), TypeORM, PostgreSQL (+ extension pgvector).
- **Frontend** — Vue.js 3 (Vite), Tailwind CSS, design minimaliste (Bento, 0 gradients).
- **Cache** — Redis pour les annonces fréquentes.
- **Offline** — PWA avec IndexedDB et Service Workers.

---

## 5. Architecture

- **Backend** — CQRS strict : Commandes (écriture) / Queries (lecture). Try/catch/finally et transactions pour les flux financiers.
- **Sécurité** — Chiffrement AES-256 pour données sensibles (noms, téléphones, documents, relevés compteurs). Validation DTO (class-validator).
- **Frontend** — Offline-first, design system minimaliste, icônes Lucide-Vue.
- **i18n** — Contenu statique : `vue-i18n` (FR par défaut). Contenu dynamique : JSONB en base (titres/descriptions). Détection : préférence utilisateur ou langue navigateur.
- **Géolocalisation** — Coordonnées GPS par bien ; recherche par rayon (ex. « à moins de 2 km de moi »).

---

## 6. Conformité (Loi Numérique Bénin / APDP)

- Stockage sécurisé des documents KYC.
- Journalisation des accès aux données sensibles.
- Droit à l’oubli et suppression sécurisée.
