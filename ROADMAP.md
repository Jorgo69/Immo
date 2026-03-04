# 🗺️ ROADMAP — Immo Bénin Platform

> Dernière mise à jour : 27/02/2026  
> Pour reprendre le travail : lire ce fichier puis mentionner `@ROADMAP.md` en conversation.

---

## Légende
- ✅ Terminé et testé
- 🔧 En cours / partiellement fait
- 🔜 Prochain à faire
- 📋 Backlog (prévu mais pas encore commencé)
- ❌ Non prévu / annulé

---

## 🏗️ INFRASTRUCTURE & SOCLE TECHNIQUE

### Base de données & ORM
- ✅ PostgreSQL + TypeORM configuré
- ✅ Migrations automatiques (`synchronize: true` en dev)
- ✅ Schéma DBML complet (`schema_database.dbml`)
- ✅ Seeders : permissions RBAC, rôles système, configs, devises

### Redis (Cache)
- ✅ `RedisModule` + `RedisService` global injectable
- ✅ Cache des brouillons Onboarding (TTL 24h)
- ✅ Docker : conteneur `redis-immo` sur port 6379
- 📋 BullMQ — file d'attente email/SMS en background
- 📋 Rate limiting par IP via Redis
- 📋 Cache des résultats de recherche de biens

### Chiffrement
- ✅ `EncryptionService` AES-256-GCM
- ✅ Salt unique par utilisateur
- ✅ Données sensibles chiffrées (nom, IFU, RCCM, budget, contact urgence)
- ✅ Champs hash pour recherche unique (ifu_hash, rccm_hash)

### Pattern CQRS
- ✅ Commands (écriture) séparées des Queries (lecture)
- ✅ CommandBus + QueryBus NestJS

### Documentation
- ✅ Swagger / OpenAPI sur `http://localhost:3000/api`
- ✅ `docs/` : Redis, RBAC, KYC, Admin, Onboarding, Architecture, Glossaire

---

## 🔐 AUTHENTIFICATION & SÉCURITÉ

- ✅ Login par numéro de téléphone + OTP (WhatsApp / SMS / Email)
- ✅ JWT signé (expire 7 jours)
- ✅ `JwtAuthGuard` sur toutes les routes protégées
- ✅ `RolesGuard` — rôle global (tenant/landlord/agent/admin)
- ✅ Vérification statut compte (banned → 403) au login

### Unicité des champs clés (anti-doublon)
- ✅ `phone_number` — UNIQUE en base
- ✅ `ifu_hash` — UNIQUE en base (agents/propriétaires)
- ✅ `rccm_hash` — UNIQUE en base (agents)
- ✅ `email` — UNIQUE en base (validation décorateur)
- ✅ `cpi_hash` — UNIQUE en base (numéro d'identité personnelle)
- ✅ Validation format CPI béninois (regex strict)

---

## 👥 GESTION DES UTILISATEURS

- ✅ CRUD utilisateurs (admin)
- ✅ Enum rôles : `tenant | landlord | agent | admin`
- ✅ Champ `status` : `active | restricted | banned`
- ✅ `last_login_at` mis à jour à chaque connexion
- ✅ Soft delete (30j puis purge)
- ✅ Endpoint `PATCH /user/:id/status` (ban, restriction, réactivation)

### Lifecycle automatique (Cron)
- ✅ `UserCronService` — inactivité 180j → `restricted`
- 📋 Notification email/SMS avant restriction (J-7)
- 📋 Purge hard delete après 30j de soft delete

---

## 📋 ONBOARDING (Inscription guidée)

- ✅ Flux multi-étapes selon le rôle (tenant / landlord / agent)
- ✅ Sauvegarde Redis à chaque étape (TTL 24h, reprise possible)
- ✅ Validation format IFU béninois (`RB/XXXXX/AAAA`)
- ✅ Validation format RCCM
- ✅ `is_profile_complete` mis à jour à la fin
- ✅ Redirection automatique vers `/onboarding` si profil incomplet
- 📋 Upload guidé des documents dans l'onboarding

---

## ✅ KYC — VALIDATION D'IDENTITÉ

### Backend
- ✅ `profiles.kyc_status` : `pending | verified | rejected`
- ✅ `profiles.kyc_submitted_at`, `kyc_reviewed_at`, `kyc_rejection_reason`
- ✅ `users.is_verified` : validation finale admin
- ✅ `ReviewKycCommand` : approve → `is_verified=true` + `kyc_status=verified`
- ✅ Upload pièce d'identité (`PUT /user/id-card`)
- 🔜 Détection documents flous / invalides (validation basique côté serveur)
- 📋 OCR automatique pour pré-remplir nom depuis la pièce d'identité

### Frontend Admin
- ✅ Page `/admin/kyc` : liste filtrable (En attente / Vérifiés / Rejetés)
- ✅ Filtre "En attente" = `is_verified = false` (capture TOUS les non-validés)
- ✅ Filtre "Vérifiés" = `is_verified = true`
- ✅ Filtre "Rejetés" = `kyc_status = 'rejected'`
- ✅ Actions Approuver / Rejeter avec motif obligatoire
- ✅ Avatar utilisateur + initiales si pas de photo
- ✅ Traductions i18n complètes (`kyc.*`)
- ✅ Aperçu de la pièce d'identité directement dans la liste

### Règles métier KYC
- Locataire : pièce d'identité (partiel) + hash CPI pour unicité ✅
- Propriétaire : pièce d'identité + IFU (optionnel si particulier) ✅
- Agent : pièce d'identité + IFU + RCCM ✅

---

## 🛡️ RBAC — RÔLES & PERMISSIONS DYNAMIQUES

- ✅ Entités `roles` + `permissions` + `role_permissions`
- ✅ `users.rbac_role_id` — rôle RBAC optionnel pour les admins
- ✅ Seeder : 9 permissions système + rôle "System Admin"
- ✅ `@RequirePermissions()` décorateur + `PermissionsGuard`
- ✅ Endpoint `PATCH /user/:id/rbac-role`
- ✅ Page `/admin/roles` : CRUD rôles et permissions
- ✅ Protection rôles système (`is_system = true` → non supprimable)

---

## 📊 DASHBOARD ADMIN & KPIs

- ✅ Endpoint `GET /user/admin-stats` — KPIs globaux
- ✅ `AdminDashboardView.vue` : 4 KPI cards + compteurs + listes
- ✅ KPIs : Total users, Actifs, KYC en attente, Inscrits 30j, Restreints, Bannis, KYC Vérifiés
- ✅ Liste Top 5 KYC en attente (lien vers page KYC)
- ✅ Liste Top 10 dernières inscriptions
- 📋 Graphe d'évolution des inscriptions (7j / 30j / 90j)
- 📋 KPI revenus de la plateforme (commissions)

---

## 📋 AUDIT TRAIL (Traçabilité)

- ✅ Entité `activity_logs`
- ✅ `AuditService` + `AuditInterceptor`
- ✅ Enregistrement : qui, quoi, quand, depuis quelle IP, ancien/nouvel état
- ✅ Page `/admin/activity-logs` (frontend)
- 📋 Filtres par utilisateur, type d'action, date

---

## ⚙️ PARAMÈTRES SYSTÈME

- ✅ `system_configs` : clé/valeur (whatsapp_enabled, sms_enabled, maintenance_mode...)
- ✅ `notification_preferences` par utilisateur
- ✅ Page `/admin/settings`
- 📋 Mode maintenance : bloquer l'API avec message personnalisé
- 📋 Limites configurables (caution max légale, délai d'inactivité...)

---

## 🏠 BIENS IMMOBILIERS

- ✅ Entité `properties` + `units`
- ✅ CRUD biens et unités (propriétaire / agent)
- ✅ Upload photos et documents
- ✅ Titre foncier chiffré
- ✅ Recherche et filtres (zone, prix, type...)
- ✅ Taux d'occupation calculé
- ✅ Règle : impossible de publier si `is_verified = false` (`VerifiedUserGuard`)
- ✅ Validation : caution et avance max 3 mois (conformité 2021)
- 📋 Géolocalisation GPS des biens

---

## 📝 DEMANDES DE LOCATION

- ✅ Entité `rental_requests`
- ✅ Statuts : `pending | accepted | rejected`
- ✅ Règle : impossible de postuler si `is_verified = false` (`VerifiedUserGuard`)
- 📋 Dossier de candidature complet (revenus, garanties)
- 📋 Score de réputation locataire affiché au propriétaire

---

## 💰 WALLET & TRANSACTIONS

- ✅ Entité `wallets` + `transactions`
- ✅ Wallet principal + Tirelire (épargne loyer)
- ✅ Historique transactions pour admins
- ✅ Simulateur Mobile Money (MTN, Moov Bénin) avec Webhook
- 🔧 Intégration réelle FedaPay / KKiapya
- 📋 Calcul automatique commissions agents
- 📋 Reçus PDF téléchargeables

---

## 🌍 LOCALISATION & RÉFÉRENTIELS

- ✅ `countries` + `cities` + `neighborhoods`
- ✅ `currency_rates` (FCFA/EUR/USD)
- ✅ `ref_categories` + `ref_types` + `ref_features`
- ✅ Page `/admin/references` (gestion référentiels)
- ✅ Page `/admin/currencies` (taux de change)
- 📋 Intégration API taux de change automatique

---

## ⭐ RÉPUTATION LOCATAIRE (Score de confiance)

> Système de notation basé sur l'historique réel

- 📋 Champ `reputation_score` sur `users` (float, 0-5)
- 📋 Critères : ponctualité paiements, no-shows, signalements
- 📋 Affiché aux propriétaires lors d'une candidature
- 📋 Badge "Locataire de confiance" si score > 4.5

---

## 🤖 IA & EMBEDDINGS (Futur)

> Dossier `semantic-embeddings/` préparé

- 📋 Vectorisation des descriptions de biens (OpenAI / local)
- 📋 Recherche sémantique ("appartement calme près école")
- 📋 Recommandations personnalisées selon profil locataire
- 📋 Stockage vecteurs dans Redis ou pgvector

---

## 📱 PWA & MOBILE

- ✅ Configuration PWA (Service Worker, manifest)
- ✅ Mode hors-ligne partiel
- ✅ Centre de notifications (In-app + Historique)
- 🔧 Notifications push natives (Infrastructure OK, alertes de base OK)
- 📋 App React Native ou Capacitor.js (phase 2)

---

## 🔜 PROCHAINES ACTIONS IMMÉDIATES

> À faire lors de la prochaine session de travail

1. **🔜 Score de Confiance (Réputation)** — Système de notation basé sur l'historique (Rigueur)
2. **🔜 Automatisation Système** — Intégrer Notifications/Audits sur KYC, Loyers et Rôles
3. **🔜 Mobile Money** — Intégration réelle des clés API (FedaPay/KKiapya)
4. **🔜 OCR KYC** — test de reconnaissance optique sur les pièces d'identité

---

## 📅 SESSIONS DE TRAVAIL

| Date | Commit | Ce qui a été fait |
|---|---|---|
| 26/02/2026 | `initial` | Init projet, auth OTP, profil, biens, wallet |
| 27/02/2026 | `91fd469` | Epic 0→5 : Redis, Audit, Settings, Lifecycle, RBAC, Dashboard KYC, Documentation complète |
| 03/03/2026 | `epic-6-7`| Epics 6 & 7 : Unicité Email/CPI, VerifiedUserGuard, Conformité Légale (3 mois), Bannière KYC Transparency |

---

*Pour reprendre : ouvre ce fichier, regarde la section "PROCHAINES ACTIONS IMMÉDIATES" et commence par le premier item non coché.*
