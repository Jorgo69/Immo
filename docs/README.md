# 📚 Documentation — Immo Bénin Platform

Bienvenue dans la documentation du projet. Retrouvez ici toutes les ressources pour comprendre, développer et maintenir la plateforme.

---

## Navigation rapide

| Sujet | Fichier | Description |
|---|---|---|
| 📖 **Glossaire** | [docs/glossaire/GLOSSAIRE.md](docs/glossaire/GLOSSAIRE.md) | Définitions de tous les termes (KYC, KPI, RBAC, Redis...) |
| 🏗️ **Architecture** | [docs/architecture/README.md](docs/architecture/README.md) | Stack, structure dossiers, pattern CQRS, sécurité, démarrage |
| 🔴 **Redis** | [docs/redis/README.md](docs/redis/README.md) | Installation, configuration, commandes CLI, stratégie cache |
| 🛡️ **RBAC** | [docs/rbac/README.md](docs/rbac/README.md) | Rôles, permissions, sous-admins, implémentation |
| ✅ **KYC** | [docs/kyc/README.md](docs/kyc/README.md) | Validation identité, flux complet, API, interface admin |
| 🏠 **Administration** | [docs/admin/README.md](docs/admin/README.md) | Dashboard, gestion users, règles métier, audit |
| 📋 **Onboarding** | [docs/onboarding/README.md](docs/onboarding/README.md) | Inscription guidée par rôle, étapes, formats IFU/RCCM |
| 🗃️ **Schéma BD** | [schema_database.dbml](schema_database.dbml) | Schéma complet de toutes les tables (format DBML) |

---

## Epics développées

| Epic | Description | Statut |
|---|---|---|
| **Epic 0** | Infrastructure Redis (cache, onboarding) | ✅ Livré |
| **Epic 1** | Audit Trail (traçabilité des actions) | ✅ Livré |
| **Epic 2** | Configurations système & Notifications | ✅ Livré |
| **Epic 3** | Lifecycle des comptes (Bans, Inactivité) | ✅ Livré |
| **Epic 4** | RBAC — Rôles & Permissions Dynamiques | ✅ Livré |
| **Epic 5** | Dashboard Admin Central & KYC | ✅ Livré |

---

## Démarrage rapide

```bash
# 1. Redis (Docker)
docker start redis-immo
# Si jamais créé :
docker run -d --name redis-immo -p 6379:6379 redis:alpine

# 2. Backend
cd back-end-api-immo-app && npm run start:dev

# 3. Frontend
cd frontend && npm run dev
```

**URLs :**
- Frontend → http://localhost:5173
- API → http://localhost:3000
- Swagger → http://localhost:3000/api
