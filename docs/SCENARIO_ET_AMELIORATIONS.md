# Gradely — Scénario complet et pistes d’amélioration

## 1. Scénario complet de l’app (état actuel)

### 1.1 Connexion

- **Page** : `/login`
- **Actions** : saisie email + mot de passe → POST `/api/token/` → tokens (access + refresh) stockés en localStorage → redirection vers `/dashboard`
- **Comportement** : si déjà connecté et qu’on va sur `/login`, redirection vers dashboard. Erreurs affichées (identifiants incorrects, serveur injoignable). Refresh token automatique sur 401 (sauf login/refresh).

### 1.2 Dashboard (étudiant)

- **Page** : `/dashboard`
- **Données** : GET `/api/projects/` → liste des projets dont l’utilisateur est **owner** ou **supervisor**
- **Affichage** : cartes (titre, description, présence ou non d’un superviseur). Clic sur une carte → détail du projet. Lien « Nouveau projet » → `/projects/new`. Bouton Déconnexion.
- **Limite actuelle** : le backend expose GET `/api/dashboard/student` (résumé + nudges : tâches en retard, bloquées, trop en cours, risque de retard) mais le **frontend ne l’utilise pas** ; il affiche uniquement la liste des projets.

### 1.3 Création de projet

- **Page** : `/projects/new`
- **Formulaire** : titre (obligatoire), description
- **Actions** : POST `/api/projects/` → redirection vers `/dashboard`
- **Non disponible dans l’UI** : dates (start_date, end_date), statut, **assignation du superviseur**. Tout cela existe en API (PATCH projet) mais pas dans l’interface.

### 1.4 Détail d’un projet

- **Page** : `/projects/:id`
- **Données chargées** : projet (GET `/api/projects/:id/`), tâches (GET `/api/tasks/` puis filtre côté client), jalons, sprints, livrables, commentaires, activité, utilisateur courant (GET `/api/me/`).
- **Onglets** : Vue d’ensemble, Planning, Livrables, Tâches, Commentaires, Activité.

#### Vue d’ensemble

- Description du projet.
- **Statut** : valeur du champ `project.status` (active / completed / archived). **Non modifiable dans l’UI** (uniquement via API).
- **Progression** : `project.progress_percent` = (tâches « done » / total tâches) × 100. Recalculé à chaque chargement ; **sans tâches** = 0 %.
- Période : start_date → end_date si renseignées (création/modif projet hors UI pour l’instant).

#### Planning

- **Timeline** : affichage des jalons et sprints.
- **Jalons** : liste + formulaire d’ajout (titre, description, date, statut). Modification du statut (planned / in_progress / done) possible. Erreurs API affichées.
- **Sprints** : liste + formulaire d’ajout (titre, dates début/fin, objectif, statut). Erreurs API affichées.

#### Livrables

- **Liste** : livrables du projet (titre, échéance, description).
- **Ajout** : formulaire « Nouveau livrable » (titre obligatoire, description, date d’échéance). Erreurs API affichées.
- **Dépôt** : sur un livrable, « + Soumettre ce livrable » → formulaire avec commentaire optionnel + **upload de fichier** (PDF, etc.). Fichier stocké côté backend (MEDIA), lien « Télécharger le fichier » affiché. Erreurs affichées.
- **Revue** : le superviseur peut approuver/refuser un dépôt avec feedback (ReviewPanel).

#### Tâches

- **Affichage** : liste des tâches du projet (titre, statut, date d’échéance). **Aucun formulaire** d’ajout ni de modification dans l’UI ; message « Les tâches peuvent être gérées depuis l’API ». La progression du projet dépend de ces tâches.

#### Commentaires

- Liste des commentaires (auteur, contenu). Formulaire d’ajout de commentaire.

#### Activité

- Journal d’activité du projet (création/modification projet, tâches, commentaires, jalons, sprints, livrables, dépôts, revues).

### 1.5 Rôles et permissions (résumé)

- **Owner (étudiant)** : CRUD sur son projet, peut assigner un superviseur (via API), seul à pouvoir soumettre un dépôt pour un livrable.
- **Supervisor (enseignant, is_staff)** : lecture sur les projets qui lui sont assignés ; peut approuver/refuser les dépôts (review).
- Le dashboard liste les projets où l’utilisateur est owner **ou** supervisor ; la création de projet et l’assignation du superviseur ne sont pas exposées complètement dans l’UI.

---

## 2. Ce qu’il faut améliorer

### 2.1 Fonctionnalités manquantes ou partielles

| Priorité | Amélioration                         | Détail                                                                                                                                                                                               |
| -------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Haute    | **Dashboard étudiant riche**         | Appeler GET `/api/dashboard/student` et afficher le résumé (nombre de projets, tâches, etc.) et les **nudges** (tâches en retard, bloquées, trop en cours, risque de retard).                        |
| Haute    | **Gestion des tâches dans l’UI**     | Formulaire d’ajout de tâche et modification du statut (todo → in_progress → done, etc.) depuis l’onglet Tâches, pour que la **progression** et les nudges aient du sens sans passer par l’API.       |
| Haute    | **Modifier le projet (dont statut)** | Page ou modal « Modifier le projet » : titre, description, **statut** (active/completed/archived), **dates** (start_date, end_date), **assignation du superviseur** (liste d’utilisateurs is_staff). |
| Moyenne  | **Création de projet enrichie**      | Optionnel : proposer dates et statut dès la création (ou au moins un lien « Modifier le projet » après création).                                                                                    |
| Moyenne  | **Vue superviseur**                  | Dashboard ou filtre « Projets que je supervise » et accès en lecture + revue des dépôts (déjà partiellement là ; clarifier la liste des projets côté superviseur).                                   |

### 2.2 UX / Cohérence

| Priorité | Amélioration                        | Détail                                                                                                                                                                 |
| -------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Moyenne  | **Libellés et statuts en français** | Afficher « Actif », « Terminé », « Archivé » au lieu de « active », « completed », « archived » ; idem pour les statuts des tâches (To Do, En cours, Bloqué, Terminé). |
| Moyenne  | **Feedback après actions**          | Toasts ou messages courts après création (projet, jalon, sprint, livrable, dépôt, commentaire) et après revue (approuvé/refusé).                                       |
| Basse    | **Indication de chargement**        | Boutons désactivés + « Envoi... » déjà présents ; s’assurer que partout où il y a un appel API long, un indicateur ou un état de chargement est visible.               |

### 2.3 Technique / Robustesse

| Priorité | Amélioration                       | Détail                                                                                                                                                                                                                              |
| -------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Moyenne  | **Gestion des tâches côté API**    | Les tâches sont récupérées via GET `/api/tasks/` puis filtrées par `project === id` côté client. Prévoir si besoin un endpoint du type GET `/api/projects/:id/tasks/` pour alléger le client et sécuriser le filtrage côté serveur. |
| Basse    | **Validation formulaire livrable** | Exiger au moins un fichier **ou** un commentaire pour le dépôt (déjà le cas côté bouton désactivé) ; optionnel : rappeler les types de fichiers acceptés.                                                                           |
| Basse    | **Taille max des fichiers**        | Limiter la taille des uploads (backend + message d’erreur clair côté frontend).                                                                                                                                                     |

### 2.4 Résumé des actions recommandées (ordre suggéré)

1. **Utiliser le dashboard étudiant** : appeler `/api/dashboard/student` sur la page Dashboard et afficher résumé + nudges.
2. **Ajouter la gestion des tâches** : formulaire d’ajout + changement de statut dans l’onglet Tâches.
3. **Ajouter l’édition du projet** : modal ou page « Modifier le projet » avec statut, dates, superviseur.
4. **Traduire les statuts** : mapping id → libellé français pour projet et tâches (et autres si besoin).
5. **Améliorer le feedback** : petits messages de succès après les créations et les revues.

---

_Document généré pour le projet Gradely — à mettre à jour au fil des évolutions._
