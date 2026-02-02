# Plan Gradely — Plateforme de suivi de projets universitaires

Transformations incrémentales en 3 modules, sans casser l'existant (auth, projects, tasks).

---

## Prérequis

- Django/DRF, JWT (inchangé)
- Permissions : `IsProjectOwnerOrSupervisor` pour projets, `IsProjectMember` pour ressources liées au projet
- Chaque action importante → création d'un `ActivityLog`

---

## Module 1 : Comments + ActivityLog par projet

### Backend

| Fichier                                       | Action                                                                                              |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `core/models.py`                              | Ajouter `ActivityLog`, `Comment`                                                                    |
| `core/migrations/0004_activitylog_comment.py` | Migration                                                                                           |
| `core/serializers.py`                         | `ActivityLogSerializer`, `CommentSerializer`                                                        |
| `core/views.py`                               | `ActivityLogViewSet`, `CommentViewSet` ; intégrer `log_activity()` dans ProjectViewSet, TaskViewSet |
| `core/permissions.py`                         | `IsProjectMemberForNested` (réutilisation `IsProjectMember`)                                        |
| `core/urls.py`                                | Routes imbriquées `/projects/<id>/activity/`, `/projects/<id>/comments/`                            |
| `core/admin.py`                               | Inscription `ActivityLog`, `Comment`                                                                |
| `core/services.py`                            | **NOUVEAU** — `log_activity(project, actor, action_type, description, metadata)`                    |

### Modèles

```python
# ActivityLog
project (FK), actor (FK User), action_type (CharField choices), description (TextField), metadata (JSONField, nullable), created_at

# Comment
project (FK), author (FK User), content (TextField), created_at
```

**Action types** : `project_created`, `project_updated`, `task_created`, `task_updated`, `comment_added`, etc.

### Frontend

| Fichier                            | Action                                                              |
| ---------------------------------- | ------------------------------------------------------------------- |
| `src/pages/ProjectDetailsPage.jsx` | **NOUVEAU** — Page détail projet avec onglets                       |
| `src/components/ProjectTabs.jsx`   | **NOUVEAU** — Tabs : Vue d'ensemble, Tâches, Commentaires, Activité |
| `src/components/ActivityFeed.jsx`  | **NOUVEAU** — Liste des ActivityLog                                 |
| `src/components/CommentList.jsx`   | **NOUVEAU** — Liste + formulaire ajout commentaire                  |
| `src/App.jsx`                      | Route `/projects/:id` → `ProjectDetailsPage`                        |
| `src/pages/DashboardPage.jsx`      | Liens vers `/projects/:id` sur les cards                            |

### Commits suggérés

1. `feat(core): add ActivityLog and Comment models + migration`
2. `feat(core): add ActivityLog and Comment serializers, viewsets, urls`
3. `feat(core): integrate log_activity in Project/Task create/update`
4. `feat(frontend): add ProjectDetailsPage with tabs (overview, tasks, comments, activity)`

---

## Module 2 : Planning (Milestones + Sprints + Timeline)

### Backend

| Fichier                                    | Action                                                                       |
| ------------------------------------------ | ---------------------------------------------------------------------------- |
| `core/models.py`                           | Ajouter `Milestone`, `Sprint`                                                |
| `core/migrations/0005_milestone_sprint.py` | Migration                                                                    |
| `core/serializers.py`                      | `MilestoneSerializer`, `SprintSerializer`                                    |
| `core/views.py`                            | `MilestoneViewSet`, `SprintViewSet` ; `log_activity` pour milestones/sprints |
| `core/urls.py`                             | `/projects/<id>/milestones/`, `/projects/<id>/sprints/`                      |
| `core/admin.py`                            | Inscription `Milestone`, `Sprint`                                            |

### Modèles

```python
# Milestone
project (FK), title, description (TextField, blank), due_date, status (planned/in_progress/done), order (int), created_at

# Sprint
project (FK), title, start_date, end_date, goal (TextField, blank), status (planned/active/completed), created_at
```

### Frontend

| Fichier                            | Action                                                             |
| ---------------------------------- | ------------------------------------------------------------------ |
| `src/components/ProjectTabs.jsx`   | Ajouter onglet "Planning"                                          |
| `src/components/MilestoneList.jsx` | **NOUVEAU** — CRUD milestones                                      |
| `src/components/SprintList.jsx`    | **NOUVEAU** — CRUD sprints                                         |
| `src/components/TimelineView.jsx`  | **NOUVEAU** — Vue timeline (milestones + sprints sur axe temporel) |

### Commits suggérés

1. `feat(core): add Milestone and Sprint models + migration`
2. `feat(core): add Milestone and Sprint serializers, viewsets, urls`
3. `feat(core): log_activity for milestone/sprint actions`
4. `feat(frontend): add Planning tab with Milestones, Sprints, Timeline`

---

## Module 3 : Deliverables + Submissions + Reviews

### Backend

| Fichier                                                 | Action                                                                                           |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `core/models.py`                                        | Ajouter `Deliverable`, `Submission`, `Review`                                                    |
| `core/migrations/0006_deliverable_submission_review.py` | Migration                                                                                        |
| `core/serializers.py`                                   | `DeliverableSerializer`, `SubmissionSerializer`, `ReviewSerializer`                              |
| `core/views.py`                                         | `DeliverableViewSet`, `SubmissionViewSet`, `ReviewViewSet` ; permissions superviseur pour Review |
| `core/permissions.py`                                   | `IsSupervisorForReview` (uniquement superviseur peut valider)                                    |
| `core/urls.py`                                          | `/projects/<id>/deliverables/`, `.../submissions/`, `.../reviews/`                               |
| `core/admin.py`                                         | Inscription `Deliverable`, `Submission`, `Review`                                                |

### Modèles

```python
# Deliverable
project (FK), title, description, due_date, created_at

# Submission
deliverable (FK), submitted_by (FK User), content/description (TextField), file_url (optional), submitted_at, status (draft/submitted)

# Review
submission (FK), reviewer (FK User, superviseur), status (pending/approved/rejected), feedback (TextField), reviewed_at
```

### Frontend

| Fichier                              | Action                                                           |
| ------------------------------------ | ---------------------------------------------------------------- |
| `src/components/ProjectTabs.jsx`     | Ajouter onglet "Livrables"                                       |
| `src/components/DeliverableList.jsx` | **NOUVEAU** — Liste livrables + création                         |
| `src/components/SubmissionForm.jsx`  | **NOUVEAU** — Soumettre un livrable (owner)                      |
| `src/components/ReviewPanel.jsx`     | **NOUVEAU** — Validation superviseur (approve/reject + feedback) |

### Commits suggérés

1. `feat(core): add Deliverable, Submission, Review models + migration`
2. `feat(core): add serializers, viewsets, urls + IsSupervisorForReview`
3. `feat(core): log_activity for deliverable/submission/review actions`
4. `feat(frontend): add Deliverables tab with submissions and supervisor review`

---

## Structure URL finale (exemple)

```
/api/projects/                          # CRUD projets (existant)
/api/projects/<id>/activity/            # GET liste ActivityLog
/api/projects/<id>/comments/            # GET, POST comments
/api/projects/<id>/milestones/          # CRUD milestones
/api/projects/<id>/sprints/             # CRUD sprints
/api/projects/<id>/deliverables/        # CRUD deliverables
/api/deliverables/<id>/submissions/     # CRUD submissions (imbriqué)
/api/submissions/<id>/review/           # GET, POST review (superviseur)
/api/tasks/                             # existant
/api/dashboard/student                  # existant
```

---

## Ordre d’implémentation

1. **Module 1** — Comments + ActivityLog
2. **Module 2** — Planning (Milestones + Sprints + Timeline)
3. **Module 3** — Deliverables + Submissions + Reviews

Chaque module : modèles → migrations → serializers → viewsets → routes → UI.
