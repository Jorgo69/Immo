# 📖 Glossaire du Projet — Immo Bénin Platform

Ce fichier explique tous les termes techniques et métier utilisés dans le projet.
Il est destiné à toute personne (développeur, chef de projet, partenaire) qui rejoint l'équipe.

---

## Table des matières

1. [Termes Métier Immobilier](#1-termes-métier-immobilier)
2. [KYC — Know Your Customer](#2-kyc--know-your-customer)
3. [KPI — Key Performance Indicator](#3-kpi--key-performance-indicator)
4. [RBAC — Role-Based Access Control](#4-rbac--role-based-access-control)
5. [Redis — Cache & File d'attente](#5-redis--cache--file-dattente)
6. [Onboarding](#6-onboarding)
7. [Dashboard Admin](#7-dashboard-admin)
8. [Autres termes techniques](#8-autres-termes-techniques)

---

## 1. Termes Métier Immobilier

| Terme | Définition |
|---|---|
| **Property** (Bien) | Un immeuble, villa, groupe de bâtiments. Un bien peut contenir plusieurs unités (chambres, studios, appartements). |
| **Unit** (Unité / Chambre) | Une unité locative dans un bien. Ex : Studio A, Appartement 2B. C'est ce qu'on loue. |
| **Landlord** (Propriétaire) | Personne physique ou morale qui possède le bien et/ou l'unité. |
| **Agent** | Mandataire gérant un ou plusieurs biens pour le compte d'un propriétaire. Peut avoir ses propres droits RBAC. |
| **Tenant** (Locataire) | Chercheur de logement. Peut faire une demande de location (RentalRequest). |
| **RentalRequest** (Demande de location) | Formulaire soumis par un locataire pour une unité précise. Statuts : `pending`, `accepted`, `rejected`. |
| **Caution** | Dépôt de garantie (nombre de mois). Ex : caution_months = 2 → le locataire paye 2 mois en avance au bail. |
| **Avance** | Loyers payés en avance au moment de la signature. |
| **Frais de dossier** | Coût administratif unique à la signature du contrat. |
| **Titre foncier** | Document légal attestant la propriété d'un bien immobilier (`title_deed_enc`, chiffré). |
| **RCCM** | Registre du Commerce et du Crédit Mobilier — document légal d'enregistrement d'une entreprise au Bénin. |
| **IFU** | Identifiant Fiscal Unique — numéro fiscal béninois obligatoire pour les agents et propriétaires professionnels. |

---

## 2. KYC — Know Your Customer

> **KYC = Connais Ton Client**

C'est le processus de **vérification d'identité** des utilisateurs avant de leur accorder un accès complet à la plateforme.

### Pourquoi le KYC?
- **Légal** : Les lois béninoises exigent l'identification des parties dans un contrat immobilier.
- **Sécurité** : Éviter les fraudes, les fausses identités, les arnaques.
- **Confiance** : Les propriétaires veulent savoir qui loue leur bien.

### Qui doit passer le KYC?
| Rôle | KYC requis? |
|---|---|
| Locataire | Partiel (pièce d'identité uploadée) |
| Propriétaire | **Complet** (pièce identité + IFU si pro) |
| Agent | **Complet** (pièce identité + IFU + RCCM) |
| Admin | Non (compte interne) |

### États du KYC (`kyc_status`)
```
pending   → Dossier non encore soumis ou en attente de révision
verified  → Approuvé par un admin
rejected  → Refusé par un admin (avec motif obligatoire)
```

### Processus complet
```
1. L'utilisateur uploade sa pièce d'identité dans son profil
2. Le kyc_status passe en "pending"
3. L'admin voit le dossier dans /admin/kyc
4. L'admin approuve ou rejette (avec motif)
5. Si approuvé → is_verified = true sur le compte
6. Si rejeté → le motif est affiché à l'utilisateur
```

### Champs en base
```
profiles.kyc_status              : pending | verified | rejected
profiles.kyc_submitted_at        : date de soumission du dossier
profiles.kyc_reviewed_at         : date de la décision admin
profiles.kyc_rejection_reason    : motif du rejet (texte libre)
users.id_card_url                : URL de la pièce d'identité
```

---

## 3. KPI — Key Performance Indicator

> **KPI = Indicateur Clé de Performance**

Dans notre dashboard admin, les KPIs sont des **chiffres résumant l'état de la plateforme** en temps réel.

### KPIs du Dashboard Admin

| KPI | Source | Signification |
|---|---|---|
| **Total Utilisateurs** | `COUNT(users)` | Nombre total de comptes créés (actifs + inactifs, hors supprimés) |
| **Actifs** | `status = 'active'` | Comptes pouvant se connecter normalement |
| **KYC en attente** | `kyc_status = 'pending'` | Dossiers à valider (urgent pour les agents/propriétaires) |
| **Inscrits (30j)** | `created_at >= now - 30 days` | Nouvelles inscriptions dans les 30 derniers jours (croissance) |
| **Restreints** | `status = 'restricted'` | Comptes avec accès limité (inactivité ou décision admin) |
| **Bannis** | `status = 'banned'` | Comptes définitivement désactivés |
| **KYC Vérifiés** | `kyc_status = 'verified'` | Utilisateurs validés et de confiance |

### KPIs Propriétaire/Agent (dashboard non-admin)
| KPI | Signification |
|---|---|
| **Revenu** | Solde du wallet |
| **Biens** | Nombre de properties gérées |
| **Unités occupées** | Unités avec `unit_status = 'occupied'` |
| **Alertes** | Nombre de demandes en pending |

---

## 4. RBAC — Role-Based Access Control

> **RBAC = Contrôle d'Accès Basé sur les Rôles**

Système permettant de définir **qui peut faire quoi** dans l'administration.

### Deux niveaux de rôles

#### Rôle Global (`users.role`) — Fixe
```
tenant   → Locataire (cherche un logement)
landlord → Propriétaire (possède des biens)
agent    → Agent immobilier (gère des biens)
admin    → Administrateur (accès total)
```
Ce rôle défini le **type de compte** et ne change pas (sauf intervention admin).

#### Rôle RBAC (`users.rbac_role_id`) — Dynamique et optionnel
Permet de créer des **sous-rôles d'administration** avec des permissions précises.

**Exemples de rôles RBAC créés :**
- `System Admin` → toutes les permissions
- `Validateur KYC` → uniquement `view:kyc` + `manage:kyc`
- `Support Client` → `view:users` + `view:activity_logs`
- `Modérateur` → `manage:users` (sans les configs système)

### Permissions disponibles
```
Format : action:ressource

manage:users          → CRUD complet des utilisateurs
view:users            → Lecture seule des utilisateurs
manage:kyc            → Approuver/Rejeter des dossiers KYC
view:kyc              → Voir les dossiers KYC
manage:roles          → Gérer les rôles RBAC
manage:settings       → Modifier les configs système
manage:references     → Éditer les référentiels (types de biens...)
view:activity_logs    → Lire la trace d'audit
view:dashboard        → Accès au tableau de bord admin
```

### Comment ça fonctionne en code
```typescript
// Décorateur sur un endpoint
@RequirePermissions('manage:kyc')
@Patch(':id/kyc')
async reviewKyc(...) { ... }

// Guard vérifie automatiquement :
// 1. Le token JWT est valide
// 2. Le rôle global est 'admin'
// 3. Le rôle RBAC de l'admin contient la permission demandée
```

### Gestion dans l'interface
- **Page** : `/admin/roles` — Créer, éditer, supprimer des rôles
- **Fiche Utilisateur** : `/admin/users/:id` → Section "Rôle RBAC" pour assigner

---

## 5. Redis — Cache & File d'attente

> **Redis = Base de données en mémoire ultra-rapide**

### Qu'est-ce que Redis?
Redis est une base de données qui stocke les données **directement dans la RAM** (mémoire vive), ce qui la rend **100 à 1000x plus rapide** qu'une base relationnelle (PostgreSQL).

### Pourquoi Redis dans notre projet?

| Usage | Détail |
|---|---|
| **Cache Onboarding** | Sauvegarde temporaire des étapes de création de profil. Si l'utilisateur ferme l'onglet, ses données sont conservées (TTL 24h). |
| **Sessions temporaires** | Données qui n'ont pas encore besoin d'aller en BDD |
| **Future: File BullMQ** | Envoi d'emails/SMS en tâche de fond sans bloquer l'API |
| **Future: Embeddings IA** | Stockage des vecteurs du dossier `semantic-embeddings/` |

### Comment Redis est utilisé dans le code
```typescript
// RedisService — API simplifiée
await redisService.set('key', value, 86400) // TTL 24h
await redisService.get('key')
await redisService.del('key')

// Exemple onboarding
await redisService.set(`onboarding:${userId}`, draftData, 86400)
```

### Voir la documentation complète
→ [docs/redis/README.md](../redis/README.md)

---

## 6. Onboarding

> **Processus d'inscription complète d'un utilisateur**

### Définition
L'onboarding est le **parcours guidé par étapes** que parcourt un nouveau utilisateur après son premier login pour compléter son profil en fonction de son rôle.

### Étapes par rôle

#### Locataire (Tenant)
```
Étape 1 → Infos personnelles (nom, prénom)
Étape 2 → Zone recherchée + budget
Étape 3 → Upload pièce d'identité (KYC)
```

#### Propriétaire (Landlord)
```
Étape 1 → Infos personnelles
Étape 2 → Upload pièce d'identité
Étape 3 → IFU (optionnel si particulier)
```

#### Agent
```
Étape 1 → Infos personnelles + société
Étape 2 → Upload pièce d'identité
Étape 3 → IFU + RCCM (obligatoire)
```

### Sauvegarde avec Redis
Chaque étape est sauvegardée dans Redis sous la clé :
```
onboarding:{userId}  → données du brouillon (TTL 24h)
```
→ Cela évite de polluer PostgreSQL avec des données incomplètes.
→ À la fin, **un seul appel en BDD** valide tout le profil.

### Indicateur de complétion
```
users.is_profile_complete = true  → onboarding terminé
```

---

## 7. Dashboard Admin

> **Tableau de bord de supervision de la plateforme**

### Accès
- URL : `/admin` (après login en tant qu'admin)
- Rôle requis : `admin`

### Sections

#### Pour les Admins — Vue globale
| Section | Description |
|---|---|
| 4 cartes KPIs | Total users, Actifs, KYC en attente, Inscrits 30j |
| 3 compteurs | Restreints, Bannis, KYC Vérifiés |
| Liste KYC en attente | Top 5 des dossiers à traiter (avec lien "Tout voir") |
| Dernières inscriptions | Top 10 des nouveaux comptes |

#### Pour les Propriétaires/Agents — Vue personnelle
| Section | Description |
|---|---|
| 4 cartes KPIs | Revenus, Biens, Unités occupées, Alertes |
| Activité récente | Dernières demandes de location |
| Biens performants | Top 5 des biens par nombre d'unités |

---

## 8. Autres termes techniques

| Terme | Définition |
|---|---|
| **JWT** | JSON Web Token — jeton d'authentification signé. Contient l'ID user, son rôle, et une expiration. |
| **CQRS** | Command Query Responsibility Segregation — Pattern architectural séparant les "commandes" (écriture) des "requêtes" (lecture). |
| **Soft Delete** | Suppression logique : `deleted_at` est renseigné, la donnée reste en base mais est cachée des requêtes normales. Hard Delete automatique après 30j. |
| **Audit Log** | Trace complète de chaque action importante (qui, quoi, quand, depuis quelle IP). |
| **Swagger** | Documentation interactive de l'API backend. Accessible sur `http://localhost:3000/api`. |
| **TypeORM** | ORM (Object-Relational Mapper) — Traduit les entités TypeScript en tables SQL. |
| **Seeder** | Script qui pré-remplit la base avec des données initiales (permissions, rôles système, configs, devises). |
| **TTL** | Time To Live — Durée de vie d'une donnée en cache Redis avant suppression automatique. |
| **AES-256** | Algorithme de chiffrement symétrique utilisé pour les données sensibles (pièce d'identité, IFU, budget...). |
| **FCFA** | Franc CFA — devise officielle du Bénin (XOF). 1 EUR ≈ 655 FCFA. |
| **PWA** | Progressive Web App — L'application frontend peut être installée comme une app native sur mobile. |
