# RBAC — Rôles et Permissions Dynamiques

> **Role-Based Access Control** : Système de contrôle d'accès fin pour les sous-administrateurs.

---

## Vue d'ensemble

Le projet a deux couches de gestion d'accès :

```
Couche 1 : users.role (Fixe)
  → Définit le TYPE de compte : tenant | landlord | agent | admin
  → Non modifiable sans intervention admin directe

Couche 2 : users.rbac_role_id (Dynamique, optionnel)
  → Définit les PERMISSIONS PRÉCISES d'un admin
  → Peut être changé par un admin à tout moment
  → Null = pas de restriction (ou non-admin)
```

---

## Architecture en base de données

```
┌─────────────────┐        ┌──────────────────┐       ┌────────────────────┐
│     users       │        │      roles       │       │    permissions     │
│─────────────────│  M:1   │──────────────────│  M:M  │────────────────────│
│ rbac_role_id ───┼───────▶│ id               │───────│ id                 │
│                 │        │ name             │       │ name               │
│                 │        │ is_system        │       │ description        │
└─────────────────┘        └──────────────────┘       └────────────────────┘
                                    │
                                    │ via table de jonction
                                    ▼
                         ┌─────────────────────┐
                         │  role_permissions   │
                         │─────────────────────│
                         │ role_id             │
                         │ permission_id       │
                         └─────────────────────┘
```

---

## Permissions système (seedées au démarrage)

| Permission | Signification |
|---|---|
| `manage:users` | Créer, modifier, changer le statut des utilisateurs |
| `view:users` | Consulter la liste et le détail des utilisateurs (lecture seule) |
| `manage:kyc` | Approuver ou rejeter des dossiers KYC |
| `view:kyc` | Voir les dossiers KYC en lecture seule |
| `manage:roles` | Créer, modifier, supprimer des rôles RBAC |
| `manage:settings` | Modifier les configurations système (activer/désactiver WhatsApp, SMS...) |
| `manage:references` | Modifier les référentiels (types de biens, features...) |
| `view:activity_logs` | Consulter la trace d'audit |
| `view:dashboard` | Accéder au dashboard admin avec KPIs |

---

## Rôles pré-créés (System Roles)

Ces rôles sont créés automatiquement au premier démarrage (`OnModuleInit` dans `RbacService`) :

| Rôle | `is_system` | Permissions |
|---|---|---|
| **System Admin** | `true` | Toutes les permissions |

> 🔒 Les rôles `is_system = true` ne peuvent pas être supprimés, même par un admin.

---

## Implémentation Backend

### Structure des fichiers
```
src/rbac/
├── entities/
│   ├── permission.entity.ts    → Table permissions
│   └── role.entity.ts          → Table roles + relation M:M
├── rbac.controller.ts           → Endpoints CRUD
├── rbac.module.ts               → Module NestJS
└── rbac.service.ts              → Logique + Seeding au démarrage
```

### Endpoints API disponibles
```
GET    /rbac/permissions           → Lister toutes les permissions
GET    /rbac/roles                 → Lister tous les rôles
POST   /rbac/roles                 → Créer un rôle
PATCH  /rbac/roles/:id             → Modifier un rôle (nom, description, permissions)
DELETE /rbac/roles/:id             → Supprimer un rôle (interdit si is_system=true)

PATCH  /user/:id/rbac-role         → Assigner un rôle RBAC à un utilisateur
```

### Décorateur `@RequirePermissions`
```typescript
// Appliquer sur un endpoint pour restreindre l'accès
@RequirePermissions('manage:kyc')
@Patch(':id/kyc')
async reviewKyc(@Param('id') userId: string, ...) {
  // Seul un admin avec la permission 'manage:kyc' peut accéder
}
```

### Guard `PermissionsGuard`
```typescript
// Vérification automatique en 3 étapes :
// 1. JWT valide via JwtAuthGuard
// 2. Rôle 'admin' via RolesGuard
// 3. Permission RBAC via PermissionsGuard

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.ADMIN)
@RequirePermissions('manage:users')
```

---

## Gestion dans l'interface Admin

### Page Rôles (`/admin/roles`)
- Liste de tous les rôles avec leurs permissions
- Formulaire de création d'un nouveau rôle
- Chef liste de cases à cocher pour les permissions
- Suppression protégée (is_system bloqué)

### Fiche utilisateur (`/admin/users/:id`)
- Section "Rôle RBAC (Permissions fines)"
- Bouton "Modifier le rôle" → modal avec sélecteur
- Motif obligatoire (tracé en Audit Log)
- Option "Aucun (Standard)" pour retirer le rôle

---

## Exemples de configuration recommandée

### Scénario 1 : Équipe Support
```
Rôle : "Support Client"
Permissions :
  ✅ view:users
  ✅ view:kyc
  ❌ manage:users         (ne peut pas bannir)
  ❌ manage:settings      (ne peut pas changer les configs)
```

### Scénario 2 : Validateur KYC
```
Rôle : "Validateur KYC"
Permissions :
  ✅ view:users
  ✅ view:kyc
  ✅ manage:kyc
  ❌ manage:roles         (ne peut pas créer d'autres admins)
```

### Scénario 3 : Administrateur Technique
```
Rôle : "Admin Tech"
Permissions :
  ✅ manage:settings
  ✅ manage:references
  ✅ view:activity_logs
  ❌ manage:users         (séparation des responsabilités)
```
