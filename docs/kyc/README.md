# KYC — Validation d'Identité

> **Know Your Customer** : Processus de vérification d'identité des utilisateurs avant leur accès complet à la plateforme.

---

## Flux complet du KYC

```
                    UTILISATEUR
                         │
         1. Upload pièce d'identité (PDF/Image)
                         │
                         ▼
              [PUT /user/id-card]
                         │
          2. kyc_submitted_at = now()
             kyc_status = 'pending'
                         │
                         ▼
            ┌────────────────────┐
            │  Dashboard Admin   │
            │  /admin/kyc        │◀─── Admin voit la liste des "pending"
            └────────────────────┘
                         │
         3. Admin consulte la pièce d'identité
                         │
              ┌───────────────────┐
              │                   │
          APPROUVER            REJETER (motif obligatoire)
              │                   │
              ▼                   ▼
   kyc_status = 'verified'   kyc_status = 'rejected'
   kyc_reviewed_at = now()   kyc_rejection_reason = "..."
   is_verified = true        Notification envoyée à l'user
```

---

## États du KYC

| État | Code DB | Signification | Accès utilisateur |
|---|---|---|---|
| En attente | `pending` | Document soumis, non encore examiné | Limité |
| Vérifié | `verified` | Identité confirmée par un admin | Complet |
| Rejeté | `rejected` | Document refusé (motif fourni) | L'utilisateur doit re-soumettre |

---

## Qui doit faire le KYC?

| Rôle | Documents requis | Obligatoire pour? |
|---|---|---|
| **Locataire** | Pièce d'identité | Faire une demande de location |
| **Propriétaire** | Pièce d'identité + IFU (si pro) | Publier des biens |
| **Agent** | Pièce d'identité + IFU + RCCM | Toute activité |
| **Admin** | Non requis | — |

---

## API Backend

### Upload de la pièce d'identité (par l'utilisateur)
```
POST /user/id-card
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
  id_card: File (JPEG, PNG, WebP, PDF — max 5MB)

Réponse:
  { id_card_url: "https://..." }
```

### Validation KYC (Admin uniquement)
```
POST /user/:userId/kyc
Authorization: Bearer {admin-token}

Body (approuver):
  { "action": "approve" }

Body (rejeter):
  { "action": "reject", "rejection_reason": "Document illisible" }

Réponse:
  { "success": true, "status": "verified" }
```

### Liste des KPIs KYC (Dashboard Admin)
```
GET /user/admin-stats
Authorization: Bearer {admin-token}

Réponse (extrait):
  {
    "kyc": {
      "pending": 12,
      "verified": 145,
      "rejected": 8
    },
    "kycPendingList": [
      { "userId": "...", "phone_number": "...", "role": "agent", "submittedAt": "..." }
    ]
  }
```

---

## Données stockées (chiffrées)

```
Table profiles (champs chiffrés avec AES-256) :
  full_name_enc          → Nom complet
  id_card_enc            → Données identité
  ifu_enc + ifu_hash     → Numéro fiscal IFU (hash pour recherche unique)
  rccm_enc + rccm_hash   → RCCM (hash pour recherche unique)
  emergency_contact_enc  → Contact d'urgence

Chiffrement :
  - Clé dérivée du sel unique de l'utilisateur (users.encryption_salt)
  - Algorithme : AES-256-GCM via le service EncryptionService
  - Données déchiffrables uniquement côté serveur avec la clé dérivée

Table users (non chiffrés) :
  id_card_url            → URL publique de la photo de pièce d'identité
```

---

## Interface Admin (`/admin/kyc`)

### Filtres disponibles
- 🟡 **En attente** — Dossiers à traiter (vue par défaut)
- 🟢 **Vérifiés** — Historique des approuvés
- 🔴 **Rejetés** — Historique des refus

### Informations affichées par dossier
- Numéro de téléphone
- Rôle du compte (propriétaire, agent...)
- Statut KYC avec badge coloré
- Date d'inscription et date de soumission
- Motif de rejet (si applicable)
- Lien vers le profil complet

### Actions disponibles
- ✅ **Approuver** : 1 clic (confirmation immédiate)
- ❌ **Rejeter** : Ouvre un modal avec champ motif obligatoire

---

## Bonnes pratiques

> [!IMPORTANT]
> Le motif de rejet est **obligatoire** et est transmis à l'utilisateur.
> Soyez précis et constructif : "Photo floue, merci de retourner une image nette" est mieux que "Document invalide".

> [!NOTE]
> Un utilisateur peut re-soumettre son dossier après un rejet. Le `kyc_status` repassera à `pending`.

> [!WARNING]
> Ne jamais stocker la pièce d'identité en clair dans la base de données.
> L'`id_card_url` pointe vers un fichier statique servi par le backend (dossier `uploads/`).
