# Administration — Guide Complet

> Documentation dédiée à l'espace d'administration de la plateforme Immo Bénin.

---

## Accès à l'administration

| Information | Valeur |
|---|---|
| URL | `/admin` (après login) |
| Rôle requis | `admin` sur le compte |
| Redirection auto | Si non-admin → retour au dashboard personnel |

---

## Structure de la navigation (Sidebar)

```
📊 TABLEAU DE BORD
  └── /admin                     → Vue KPIs globaux + KYC pending + Inscrits récents

🏠 IMMOBILIER (Propriétaire/Agent)
  ├── /admin/landlord/properties  → Mes biens
  └── /admin/landlord/requests   → Demandes de location

⚙️  ADMINISTRATION
  ├── /admin/references           → Référentiels (types biens, équipements...)
  ├── /admin/currencies           → Taux de devises
  ├── /admin/users                → Gestion des utilisateurs
  ├── /admin/kyc                  → Validation KYC (dossiers d'identité)
  ├── /admin/roles                → Rôles & Permissions (RBAC)
  └── /admin/activity-logs        → Trace d'Audit
```

---

## Dashboard Admin (`/admin`)

### KPI Cards — Ligne 1 (Chiffres clés)

| Carte | Donnée | Origine |
|---|---|---|
| 👥 Total Utilisateurs | `users.total` | `COUNT(users)` hors supprimés |
| ✅ Actifs | `users.active` | `status = 'active'` |
| 🛡️ KYC en attente | `kyc.pending` | `kyc_status = 'pending'` |
| 📈 Inscrits (30j) | `users.newLast30Days` | `created_at >= now - 30j` |

### Compteurs — Ligne 2 (Alertes)

| Compteur | Couleur | Signification |
|---|---|---|
| Restreints | 🟡 Ambre | Comptes avec accès limité |
| Bannis | 🔴 Rouge | Comptes définitivement fermés |
| KYC Vérifiés | 🟢 Vert | Total des identités validées |

### Listes — Zone principale

**KYC en attente** (max 5, lien "Tout voir" → `/admin/kyc`)
- Affiche : téléphone, rôle, date soumission
- Clic sur une ligne → profil de l'utilisateur

**Dernières inscriptions** (max 10, lien "Tout voir" → `/admin/users`)
- Affiche : téléphone, rôle, statut, date

---

## Gestion des Utilisateurs (`/admin/users`)

### Filtres disponibles
```
Recherche : numéro de téléphone
Rôle : tous | tenant | landlord | agent | admin
Statut : tous | active | restricted | banned
```

### Fiche Utilisateur (`/admin/users/:id`)

#### Carte de profil
- Avatar (initiales si pas de photo)
- Numéro de téléphone
- Rôle + langue préférée
- Badge de statut (Actif / Restreint / Banni)
- Date d'inscription

#### Section Stats (selon le rôle)
- **Propriétaire** : Nombre de biens + chambres en tant que propriétaire
- **Agent** : Nombre de biens + chambres gérés
- **Locataire** : Solde wallet + solde épargne + transactions

#### Section Historique (Locataire)
- Tableau des 10 dernières transactions

#### Section Vérification KYC
- Statut KYC avec badge couleur
- Aperçu de la pièce d'identité (image) ou lien PDF
- Dates de soumission et vérification
- Motif de rejet (si applicable)
- **Actions** : Approuver / Rejeter (avec motif)

#### Section Connexion / Sécurité
- Statut du compte
- **Boutons d'action** : Réactiver | Restreindre | Bannir
- Chaque action nécessite un **motif obligatoire** (enregistré en Audit Log)
- Rôle RBAC actuel avec bouton "Modifier le rôle"

---

## Validation KYC (`/admin/kyc`)

### Filtres
- ⏳ **En attente** (par défaut)
- ✅ **Vérifiés**
- ❌ **Rejetés**

### Carte dossier KYC
```
┌─────────────────────────────────────────┐
│ 📱 +229 96 XX XX XX          [PENDING] ↗│
│ Agent                                   │
│──────────────────────────────────────── │
│ Inscrit le : 25 fév. 2026              │
│ Soumis le  : 26 fév. 2026              │
│──────────────────────────────────────── │
│ [✅ Approuver]        [❌ Rejeter]      │
└─────────────────────────────────────────┘
```

---

## Gestion des Rôles RBAC (`/admin/roles`)

### Interface
- Liste des rôles avec nombre de permissions
- Badge "SYSTÈME" sur les rôles protégés
- Bouton "Créer un rôle"
- Formulaire avec liste de cases à cocher (permissions)
- Protection : rôles `is_system=true` → bouton Supprimer désactivé

---

## Trace d'Audit (`/admin/activity-logs`)

### Ce qui est enregistré automatiquement
- Connexions réussies
- Changements de statut (ban, restriction)
- Validations/rejets KYC
- Modifications de profil
- Assignations de rôle RBAC
- Créations/suppressions de biens et unités

### Informations par log
| Champ | Description |
|---|---|
| **Date/heure** | Horodatage précis |
| **Utilisateur** | Qui a effectué l'action |
| **Action** | CREATE, UPDATE, DELETE, LOGIN, BAN, RESTRICT... |
| **Entité** | Quelle table/objet a été affecté |
| **Ancien état** | Snapshot avant (JSON) |
| **Nouvel état** | Snapshot après (JSON) |
| **IP** | Adresse IP de la requête |

---

## Règles Métier et Blocages

### Règles de statut de compte

| Statut | Login | API Accès | Durée | Récupérable? |
|---|---|---|---|---|
| `active` | ✅ Oui | ✅ Complet | Permanent | — |
| `restricted` | ✅ Oui | ⚠️ Limité | Configurable | Oui (réactivation admin) |
| `banned` | ❌ Non | ❌ Bloqué | Permanent | Oui (réactivation admin) |
| `deleted_at ≠ null` | ❌ Non | ❌ Caché | 30j puis purge | Non |

### Cron d'inactivité (tâche automatique)
```
Déclencheur : Tous les jours à minuit
Action      : Si last_login_at > 180 jours → status = 'restricted'
Notif       : email/SMS envoyé à l'utilisateur
```

### Format des références (champ IFU)
```
Format attendu : RB/XXXXXXX/YYYY (lettres + chiffres strictement)
Exemple valide : RB/SWASERGDV/65
Validation     : regex côté frontend + backend (class-validator)
```

---

## Paramètres Système (`/admin/settings` — si activé)

| Clé | Type | Description |
|---|---|---|
| `whatsapp_enabled` | boolean | Activer/désactiver les notifications WhatsApp |
| `sms_enabled` | boolean | Activer/désactiver les SMS |
| `email_enabled` | boolean | Activer/désactiver les emails |
| `maintenance_mode` | boolean | Mettre l'app en maintenance |
| `kyc_required_landlord` | boolean | Rendre le KYC obligatoire pour les propriétaires |
| `kyc_required_agent` | boolean | Rendre le KYC obligatoire pour les agents |
