# Espace Admin / Agent — Immo Bénin

Document de référence pour l’interface d’administration et des agents. Une lecture suffit pour comprendre la structure, les routes, les composants et les usages (notifications, modals).

---

## 1. Public et objectif

- **Qui** : propriétaires (landlord), agents, admins.
- **Usage** : gestion des biens, chambres, inscriptions (futur). Connexion **souvent depuis un ordinateur**.
- **Design** : **desktop-first** (sidebar fixe, tableaux, modals). Pas de priorité mobile ni PWA pour cette zone ; on garde la **charte Immo** (fond #F9FAFB, texte #111827, accent #059669, minimal, Lucide).

---

## 2. Structure de l’interface (inspirée dashboards pro)

| Zone | Rôle |
|------|------|
| **Sidebar** | Navigation verticale à gauche : logo, lien Accueil, Tableau de bord admin, Biens, (futur : Utilisateurs, etc.). Toujours visible. |
| **Nav bar** | Barre du haut : titre de la section courante, éventuellement pills de statut, à droite **profil utilisateur** (nom + menu déroulant). |
| **Content** | Zone principale à droite de la sidebar : listes (tableaux), fiches détail, formulaires. |
| **Content à droite** | Dans les vues détail : colonne ou carte à droite (résumé, infos gérant, actions rapides). |
| **Modals** | Fenêtres overlay pour actions sensibles : rejet, suppression, confirmation (titre, champs optionnels, Annuler / Confirmer). |

---

## 3. Routes admin

Toutes sous le préfixe `/admin`, avec **layout admin** (sidebar + nav + content).

| Route | Description |
|-------|-------------|
| `/admin` | Tableau de bord (stats, liens rapides). |
| `/admin/properties` | Liste des biens (tableau : image, titre, ville, prix, statut, actions). |
| `/admin/properties/new` | Création bien + chambres (formulaire en 2 étapes). |
| `/admin/properties/:id` | Détail d’un bien (bloc principal + colonne droite optionnelle). |

Les routes admin exigent `requiresAuth: true` et `requiresRole: ['admin','agent','landlord']`.

---

## 4. Composants

- **Layout**  
  - `AdminLayout.vue` : sidebar + top bar + `<RouterView />` pour le content.
- **Sidebar**  
  - Liens avec icônes (Lucide), item actif mis en avant (couleur accent).
- **Nav bar**  
  - Titre (dynamique selon la route), profil utilisateur à droite.
- **Listes**  
  - Tableaux avec colonnes claires ; avatar/logo à gauche du nom si disponible.
- **Modals**  
  - Composant `AppModal.vue` (ou `AdminModal`) : fond overlay, carte centrée, titre, slot contenu, boutons Annuler / Confirmer. Réutilisable pour rejet, suppression, etc.

---

## 5. Feedback utilisateur (succès / en cours / erreur / danger)

On utilise le **store notifications** (`useNotificationsStore`) pour les retours d’actions :

| Type | Usage |
|------|--------|
| `success` | Bien créé, mise à jour OK, inscription validée. |
| `info` | Action en cours (optionnel, si pas de bouton loading). |
| `warning` | Données incomplètes, avertissement. |
| `error` | Échec API (400, 500), suppression refusée. |

**API** : `notifications.add({ type, title, body?, actionUrl? })`.  
Les notifications s’affichent dans la cloche (NotificationBell). Pour un effet type **toast** (message éphémère en coin d’écran), on peut soit afficher la dernière notification en toast, soit ajouter plus tard un composant `AppToast` qui écoute le store. Pour l’instant, **notification in-app (cloche)** = référence ; on reste uniforme avec le reste de l’app.

---

## 6. Style

- Rester sur la **charte existante** : #F9FAFB, #111827, #059669, pas de dégradés, Bento/minimal, Lucide.
- L’admin ne copie pas la palette d’une autre app (ex. orange/veep) ; seule la **structure** (sidebar, nav, content, modals) s’en inspire.

---

## 7. Ordre d’implémentation

1. **Layout** : `AdminLayout.vue`, sidebar + nav + content ; routes enfants `/admin`, `/admin/properties`, etc.
2. **Listes** : page tableau des biens (avec pagination si besoin).
3. **Détail** : fiche bien + bloc à droite.
4. **Modals** : composant modal réutilisable + premier usage (ex. confirmation suppression).

---

## 8. Erreur 400 « Créer le bien »

En cas de 400 sur la création de bien (étape 2) :

- Le **frontend** affiche le message renvoyé par l’API (validation NestJS : `response.data.message` ou `response.data`).
- Vérifier que le payload envoie bien `owner_id`, `title`, `city`, `price_monthly` (nombre), et optionnellement `status`, `latitude`, `longitude`. Pour les chambres : `name` obligatoire, `price_monthly`, `surface_m2`, `floor` optionnels en nombre.
- Côté backend : `CreatePropertyCommand` et `CreateRoomCommand` utilisent `@Type(() => Number)` sur les champs numériques pour transformer les chaînes en nombre.

Ce fichier sert de **référence unique** pour l’admin : structure, routes, composants, notifications, style et dépannage 400.
