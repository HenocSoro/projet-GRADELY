# Gradely — Résumé complet (pour nouvelle discussion)

## Contexte

Plateforme de suivi de projets universitaires (projet de synthèse fin de bac).

- **Backend** : Django + Django REST Framework + JWT (SimpleJWT)
- **Frontend** : React + Vite + Tailwind CSS
- **Auth** : JWT via `/api/token/` (email + password), tokens dans localStorage ; refresh automatique sur 401

---

## État actuel / Dernières évolutions

Fonctionnalités déjà en place :

- **Supervision** : badge « Demandes de supervision » avec compteur (GET `/api/supervision-requests/pending-count/`) ; dashboard inclut projets owner OU supervisor (comptage correct pour superviseurs).
- **Tâches–Sprint** : lien optionnel tâche ↔ sprint ; validation due_date ≤ sprint.end_date (backend + frontend).
- **CRUD complet** : Modifier / Supprimer (avec confirmation) pour tâches, jalons, sprints, livrables, dépôts ; suppression projet (owner, zone dangereuse).
- **Livrables** : formulaire de dépôt visible à l’ouverture de la carte ; bouton « Choisir un fichier » ; nom + taille du fichier ; message « Dépôt soumis » ; statuts en français ; suppression d’un dépôt avec confirmation ; date d’échéance visible par tous, éditée par le superviseur uniquement ; liste en deux blocs (Ajouter un livrable / Liste des livrables).
- **Rôles** : affichage « Étudiant » / « Superviseur » dans le fil d’activité et les commentaires (comparaison actor/author avec owner/supervisor du projet).
- **Fichiers** : proxy Vite `/media` → `http://127.0.0.1:8000` en dev ; DELETE sur submissions autorisé côté API.

**Pour reprendre le projet** : lancer `backend` (Django) et `frontend` (Vite) ; détail dans « Commandes utiles » en bas. Backend : `core/models.py`, `core/views.py`, `core/serializers.py`, `core/urls.py`. Frontend : `src/pages/ProjectDetailsPage.jsx`, `src/components/` (DeliverableList, TaskListSection, MilestoneList, SprintList, ActivityFeed, CommentList), `src/pages/DashboardPage.jsx`.

---

## Architecture backend (Django)

### Apps

- **accounts** : modèle User (email = USERNAME_FIELD, role STUDENT/SUPERVISOR, is_staff). Role synchronisé avec is_staff dans `save()` : staff → Supervisor, sinon → Student. Admin : champ Role modifiable (Student/Supervisor), save_model synchronise is_staff.
- **core** : projets, tâches, commentaires, activity log, milestones, sprints, deliverables, submissions, reviews, **supervision_requests**

### Modèles principaux (`core/models.py`)

- **Project** : owner, supervisor (nullable), title, description, status, start_date, end_date ; progress_percent = (tâches done / total tâches)
- **Task** : project, **sprint** (FK Sprint, nullable), title, description, status (todo/in_progress/blocked/done), priority, due_date. Validation : si sprint et due_date renseignés, due_date ≤ sprint.end_date.
- **ActivityLog** : project, actor, action_type, description, metadata
- **Comment** : project, author, content
- **Milestone** : project, title, description, due_date, status (planned/in_progress/done), order
- **Sprint** : project, title, start_date, end_date, goal, status (planned/active/completed)
- **Deliverable** : project, title, description, due_date (optionnel)
- **Submission** : deliverable, submitted_by, content, file_url, **document** (FileField, upload), status (draft/submitted). API expose **document_name** (nom du fichier) en read_only.
- **Review** : submission (OneToOne), reviewer, status (pending/approved/rejected), feedback
- **SupervisionRequest** : project, requested_supervisor, status (pending/accepted/declined), message, response_message, created_at, responded_at. Contrainte : une seule demande pending par (project, requested_supervisor). Si accepted → project.supervisor = requested_supervisor.

### Permissions

- **IsProjectOwnerOrSupervisor** : GET si owner ou supervisor ; PUT/PATCH/DELETE owner only
- **IsProjectMember** : owner ou supervisor pour tâches, comments, etc.
- **IsSupervisorForReview** : seul superviseur peut approve/reject un dépôt

### Endpoints API principaux

```
POST   /api/token/                    # Login JWT
POST   /api/token/refresh/            # Refresh token
GET    /api/me/                       # { id, email, is_staff }
GET    /api/users/staff/              # Liste des enseignants (id, email) pour demande de supervision
GET    /api/projects/                 # Liste projets (owner OU supervisor)
POST   /api/projects/                 # Créer projet
GET    /api/projects/<id>/
PATCH  /api/projects/<id>/            # Modifier (owner only)
DELETE /api/projects/<id>/            # Supprimer projet (owner only)
GET    /api/projects/<id>/activity/
GET/POST /api/projects/<id>/comments/
GET/POST /api/projects/<id>/milestones/
PATCH  /api/projects/<id>/milestones/<pk>/
DELETE /api/projects/<id>/milestones/<pk>/
GET/POST /api/projects/<id>/sprints/
PATCH  /api/projects/<id>/sprints/<pk>/
DELETE /api/projects/<id>/sprints/<pk>/
GET/POST /api/projects/<id>/deliverables/
PATCH  /api/projects/<id>/deliverables/<pk>/
DELETE /api/projects/<id>/deliverables/<pk>/
GET/POST /api/projects/<id>/deliverables/<d_id>/submissions/   # multipart si fichier (document)
DELETE /api/projects/<id>/deliverables/<d_id>/submissions/<pk>/
GET/POST /api/projects/<id>/supervision-requests/   # Liste + créer demande (owner only)
GET     /api/supervision-requests/                  # Mes demandes (envoyées + reçues)
GET     /api/supervision-requests/pending-count/   # Nombre de demandes en attente (pour badge superviseur)
PATCH   /api/supervision-requests/<id>/            # Accepter/refuser (requested_supervisor only)
GET/POST /api/submissions/<id>/review/             # Validation superviseur
GET    /api/dashboard/student                       # Résumé + nudges (projets owner OU supervisor)
GET    /api/tasks/                                  # Toutes les tâches (filtrées par projet côté front)
POST   /api/tasks/                                  # Créer tâche (project, optionnellement sprint)
PATCH  /api/tasks/<id>/                             # Modifier tâche (statut, titre, sprint, etc.)
DELETE /api/tasks/<id>/                             # Supprimer tâche
```

### Fichiers clés backend

- `core/models.py` : Task.sprint (FK nullable), SupervisionRequest, Submission.document
- `core/serializers.py` : TaskSerializer (sprint, sprint_title, validation due_date ≤ sprint.end_date) ; SubmissionSerializer (document, document_url, **document_name**) ; Deliverable avec due_date
- `core/views.py` : ViewSets avec destroy où pertinent ; student_dashboard inclut projets owner OU supervisor ; SupervisionRequestViewSet.pending_count
- `core/urls.py` : routes dont supervision-requests, pending-count, DELETE sur submissions
- `gradely/settings.py` : SIMPLE_JWT (ACCESS_TOKEN_LIFETIME 1h), MEDIA_ROOT/MEDIA_URL
- `gradely/urls.py` : static(settings.MEDIA_URL) en DEBUG pour servir les fichiers uploadés
- `accounts/models.py` : User.save() synchronise role avec is_staff
- `accounts/admin.py` : Role modifiable ; save_model sync is_staff depuis role ; get_form initial is_active=True, role=STUDENT à la création

---

## Architecture frontend (React)

### Structure

```
src/
  api/
    axios.js     # baseURL, intercepteur Bearer, 401 → refresh puis retry ; FormData → pas de Content-Type
    auth.js      # login, logout, getAccessToken
  components/
    Card.jsx, ProtectedRoute.jsx
    ui/          # Design system : Card, Badge, Button, SectionTitle
    layout/      # AppShell (sidebar + topbar)
    ActivityFeed.jsx   # Affiche rôle (Étudiant / Superviseur) par entrée
    CommentList.jsx   # Affiche rôle (Étudiant / Superviseur) par commentaire
    MilestoneList.jsx # Ajout + Modifier (inline) + Supprimer (confirmation)
    SprintList.jsx    # Ajout + Modifier (inline) + Supprimer (confirmation) + changement statut
    TimelineView.jsx
    DeliverableList.jsx  # Grille de cartes avec statuts (À soumettre / Soumis / Validé / Refusé) ; formulaire repliable ; glisser-déposer
    ReviewPanel.jsx
  pages/
    LoginPage.jsx
    DashboardPage.jsx   # Grille de projets ; résumé (Projets, Tâches, En retard) ; nudges
    CreateProjectPage.jsx
    ProjectDetailsPage.jsx  # Header premium (titre, badges, progression) ; onglets stylisés ; Vue d'ensemble, Planning, Livrables, Tâches, Commentaires, Activité
    SupervisionRequestsPage.jsx
    App.jsx      # App Shell wrappe les routes protégées
```

- **Config** : `vite.config.js` — proxy `/api` et `/media` vers `http://127.0.0.1:8000` (dev).

### Routes

- `/login` (public), `/dashboard`, `/projects/new`, `/projects/:id`, `/supervision-requests` (lien header si is_staff)

### Page Détail projet (ProjectDetailsPage)

- **Vue d'ensemble** : description, statut, progression (%), période. Modifier le projet (owner only). Supervision (owner only) : demande de supervision si pas de superviseur. **Supprimer le projet** (owner only, zone dangereuse en bas) avec confirmation.
- **Planning** : Timeline ; Jalons et Sprints : ajout, **Modifier** (inline), **Supprimer** (confirmation), changement de statut (dropdown).
- **Livrables** : section **Ajouter un livrable** (titre, description ; date d’échéance **uniquement si superviseur**). Section **Liste des livrables** (à part en bas). Sur chaque carte : titre, échéance si définie (visible par tous), **nom du fichier déposé** + lien Télécharger, bouton « Déposer un fichier », Modifier, Supprimer. Ouverture de la carte : formulaire de dépôt (bouton « Choisir un fichier sur mon ordinateur »), liste des dépôts (nom fichier, Télécharger, statut « soumis », Supprimer avec confirmation). Message « Dépôt soumis » après envoi. Date d’échéance : **visible par l’étudiant**, **définie/modifiée uniquement par le superviseur**.
- **Tâches** : ajout (titre, description, date, **sprint** optionnel) ; liste avec statut, sprint, **Modifier** (inline), **Supprimer** (confirmation). Validation : date d’échéance ≤ fin du sprint si sprint choisi.
- **Commentaires** : liste + ajout ; affichage du **rôle** (Étudiant / Superviseur) par commentaire.
- **Activité** : journal ; affichage du **rôle** (Étudiant / Superviseur) par action.
- **isOwner / isSupervisor** : calcul robuste (ownerId/supervisorId, id ou objet).
- **Toutes les suppressions** (projet, jalon, sprint, livrable, tâche, dépôt) : **confirmation explicite** (« Êtes-vous sûr de vouloir supprimer … ? ») avant exécution.

### Dashboard

- Résumé (projets, tâches) et nudges basés sur les projets **owner OU supervisor** (donc nombre de projets correct pour le superviseur).
- Si is_staff : lien **Demandes de supervision** avec **badge** affichant le nombre de demandes en attente (GET /api/supervision-requests/pending-count/).
- Cartes projets avec badge Propriétaire / Superviseur. Message vide adapté (étudiant vs superviseur).

### Supervision (flux)

1. **Étudiant** : Vue d’ensemble → section Supervision → choisir enseignant → message optionnel → Envoyer. Liste des demandes envoyées (En attente / Acceptée / Refusée).
2. **Superviseur** : Dashboard → « Demandes de supervision » (badge si en attente) → Accepter / Refuser. Si Accepter → project.supervisor assigné.

---

## Utilisateurs (Django admin)

- **Admin** : http://127.0.0.1:8000/admin/ — superuser (createsuperuser).
- **Role** : modifiable (Student / Supervisor). Save_model synchronise Staff status.
- **Création user** : Active = coché, Role = Student par défaut.

### Commandes utiles

```bash
cd backend && python manage.py runserver
cd frontend && npm run dev
```

- **Créer superviseur** : `python manage.py shell -c "from accounts.models import User; User.objects.create_user(email='prof@exemple.com', username='prof', password='MotDePasse123', is_staff=True, is_superuser=False)"`
- **Créer étudiant** : `python manage.py shell -c "from accounts.models import User; User.objects.create_user(email='etudiant@exemple.com', username='etudiant', password='MotDePasse123', is_staff=False)"`

Connexion app : **http://localhost:5173/login** (email + mot de passe, compte actif).

---

## Problèmes résolus (référence)

- JWT "Given token not valid" : SIMPLE_JWT 1h + intercepteur axios 401 → refresh puis retry.
- Livrable : DeliverableSerializer project en read_only ; erreurs API affichées.
- Dépôt fichier : deliverable en read_only ; FormData sans Content-Type (multipart) ; parsers multipart explicites (MultiPartParser, FormParser, JSONParser) sur DeliverableSubmissionViewSet ; limite upload 10 Mo.
- Demande de supervision invisible : isOwner/isSupervisor avec ownerId/supervisorId (id ou objet).
- Admin : Role modifiable, save_model sync is_staff, nouveaux users Active + Student par défaut.
- Progression superviseur à 0 : student_dashboard inclut projets owner OU supervisor.
- Tâche dans un sprint : validation due_date ≤ sprint.end_date (backend + message frontend).
- **Page blanche au clic « Déposer un fichier »** : remplacement des `<span role="button">` et `<div role="button">` par `<button type="button">` avec `e.preventDefault()` et `e.stopPropagation()` ; garde-fous sur `items` (Array.isArray + filter null/undefined) et `projectId`/`deliverable.id` (affichage d'erreur au lieu de crash).

---

## Docs associés

- `docs/PLAN_MODULES.md` : détail des 3 modules (Comments+Activity, Planning, Deliverables+Reviews).
- `docs/SCENARIO_ET_AMELIORATIONS.md` : scénario complet + pistes d’amélioration.
