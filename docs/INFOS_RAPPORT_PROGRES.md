# Informations pour générer un rapport de progrès — Gradely (INF4173)

**Instructions :** Copie tout le bloc ci-dessous (depuis "--- DÉBUT ---" jusqu'à "--- FIN ---") et colle-le dans ChatGPT. Puis ajoute : « Génère un rapport de progrès au format PDF (structure : Introduction, Objectifs, Méthodologies, Développement, Calendrier, Conclusion, Références) en t'inspirant du modèle fourni. »

---

## DÉBUT — À copier pour ChatGPT

### Contexte du projet

**Nom :** Gradely  
**Type :** Projet de synthèse (INF4173)  
**Thème :** Plateforme de suivi de projets universitaires  

**Description :** Les étudiants en fin de baccalauréat gèrent leurs projets de synthèse de manière souvent dispersée (emails, documents éparpillés, suivi manuel). Gradely vise à centraliser le suivi des projets : création de projets, tâches, jalons, sprints, livrables, dépôts de fichiers, validation par le superviseur, commentaires et fil d'activité. L'objectif est d'offrir une plateforme simple pour les étudiants et les superviseurs (enseignants) afin de suivre l'avancement des projets de fin d'études.

**Équipe :** [À compléter : noms des membres, rôles]  
**Coordonnateur :** [À compléter]  
**Superviseur :** [À compléter]

---

### Objectifs du projet

1. **Centraliser le suivi** : Une seule plateforme pour gérer projets, tâches, livrables et échanges.
2. **Rôles distincts** : Étudiants (propriétaires de projets) et Superviseurs (enseignants) avec permissions adaptées.
3. **Livrables et validation** : Dépôt de fichiers par les étudiants, validation (approuvé/refusé) par le superviseur avec feedback.
4. **Planning** : Jalons et sprints pour structurer le projet dans le temps.
5. **Supervision** : Demande de supervision par l'étudiant, acceptation/refus par l'enseignant.
6. **Transparence** : Fil d'activité et commentaires pour tracer les échanges.
7. **Sécurité** : Authentification JWT, permissions par rôle, protection des données.

**Comparaison avec des solutions existantes :**  
- Trello, Asana, Notion : génériques, pas adaptés au contexte universitaire (rôles étudiant/superviseur, validation des livrables).  
- Moodle : orienté cours, pas optimisé pour le suivi de projets de synthèse.  
- Une solution sur mesure (Gradely) permet une personnalisation adaptée au processus académique.

---

### Cahier des charges (cas d'utilisation)

| Cas d'utilisation | Description | Acteurs |
|-------------------|-------------|---------|
| UC1 : Connexion | L'utilisateur se connecte avec email et mot de passe. JWT pour l'authentification. | Étudiant, Superviseur |
| UC2 : Création de projet | L'étudiant crée un projet (titre, description). | Étudiant |
| UC3 : Gestion des tâches | L'étudiant ou le superviseur ajoute, modifie, supprime des tâches (titre, statut, date, sprint optionnel). | Étudiant, Superviseur |
| UC4 : Planning (jalons et sprints) | Création et gestion des jalons et sprints pour structurer le projet. | Étudiant, Superviseur |
| UC5 : Livrables | Création de livrables (titre, description, échéance). L'étudiant dépose des fichiers. Le superviseur définit l'échéance. | Étudiant, Superviseur |
| UC6 : Validation des dépôts | Le superviseur approuve ou refuse les dépôts avec un feedback. | Superviseur |
| UC7 : Demandes de supervision | L'étudiant envoie une demande à un enseignant. L'enseignant accepte ou refuse. | Étudiant, Superviseur |
| UC8 : Commentaires | Ajout de commentaires sur le projet. Affichage du rôle (Étudiant/Superviseur). | Étudiant, Superviseur |
| UC9 : Fil d'activité | Journal des actions (création, modification, dépôts, revues, etc.). | Étudiant, Superviseur |
| UC10 : Dashboard | Vue d'ensemble des projets (owner ou superviseur), résumé, nudges (tâches en retard, etc.). | Étudiant, Superviseur |

---

### Architecture technique

**Backend :**
- **Framework :** Django + Django REST Framework
- **Base de données :** SQLite (développement) ; PostgreSQL possible en production
- **Authentification :** JWT (SimpleJWT) — access + refresh tokens
- **Structure :** 2 apps Django — `accounts` (utilisateurs, rôles) et `core` (projets, tâches, livrables, etc.)
- **API :** RESTful, endpoints pour projets, tâches, jalons, sprints, livrables, submissions, reviews, supervision-requests, comments, activity

**Frontend :**
- **Framework :** React + Vite
- **Styling :** Tailwind CSS
- **HTTP :** Axios avec intercepteur (Bearer token, refresh sur 401)
- **Structure :** Pages (Login, Dashboard, ProjectDetails, CreateProject, SupervisionRequests), composants réutilisables (DeliverableList, TaskListSection, MilestoneList, SprintList, ActivityFeed, CommentList, ReviewPanel), layout (AppShell avec sidebar et topbar)

**Déploiement :**
- Développement local : `python manage.py runserver` (backend), `npm run dev` (frontend)
- Proxy Vite : `/api` et `/media` vers le backend Django

---

### État du développement (ce qui est fait)

**Backend :**
- Modèles : User (accounts), Project, Task, Milestone, Sprint, Deliverable, Submission, Review, Comment, ActivityLog, SupervisionRequest
- Permissions : IsProjectOwnerOrSupervisor, IsProjectMember, IsSupervisorForReview
- API complète : CRUD pour tous les modèles, endpoints spécialisés (dashboard, pending-count, review)
- Upload de fichiers : MEDIA_ROOT, limite 10 Mo, document_name exposé
- Admin Django : gestion des utilisateurs, rôle modifiable (Student/Supervisor)

**Frontend :**
- Login avec JWT, refresh automatique
- Dashboard : liste des projets (owner ou supervisor), cartes, lien vers détail
- Page détail projet : onglets Vue d'ensemble, Planning, Livrables, Tâches, Commentaires, Activité
- CRUD tâches, jalons, sprints, livrables avec confirmation avant suppression
- Dépôt de fichiers sur les livrables, statuts (À soumettre, Soumis, Validé, Refusé)
- ReviewPanel : superviseur peut approuver/refuser avec feedback
- Demandes de supervision : création, liste, acceptation/refus, badge compteur
- Affichage des rôles (Étudiant/Superviseur) dans commentaires et activité
- Recherche de projets par titre
- Logo, palette de couleurs brand, images (hero, empty states)
- Structure monorepo : backend/, frontend/, docs/

**À améliorer (priorité haute) :**
- Utiliser GET /api/dashboard/student pour afficher résumé et nudges
- Formulaire d'ajout de tâche dans l'UI (actuellement via API)
- Modifier le projet (statut, dates, superviseur) dans l'interface
- Libellés en français (Actif, Terminé, En cours, etc.)
- Feedback après actions (toasts, messages de succès)

---

### Calendrier (à adapter selon ton planning réel)

| Semaine | Tâches | Participation | Statut |
|---------|--------|---------------|--------|
| Semaine 1-2 | Étude du contexte, cahier des charges, modélisation | [Noms] | Terminé |
| Semaine 3-4 | Backend : modèles, migrations, API de base (auth, projets, tâches) | [Noms] | Terminé |
| Semaine 5-6 | Backend : livrables, submissions, reviews, supervision | [Noms] | Terminé |
| Semaine 7-8 | Frontend : login, dashboard, page détail, onglets | [Noms] | Terminé |
| Semaine 9-10 | Frontend : CRUD complet, dépôt fichiers, demandes supervision | [Noms] | Terminé |
| Semaine 11-12 | Tests, corrections, améliorations UX, déploiement | [Noms] | En cours / À venir |

---

### Références

- **Dépôt GitHub :** https://github.com/HenocSoro/projet-GRADELY
- **Documentation projet :** docs/RESUME_PROJET.md, docs/PLAN_MODULES.md, docs/SCENARIO_ET_AMELIORATIONS.md
- **Technologies :** Django REST Framework, React, Vite, Tailwind CSS, JWT (SimpleJWT)

---

## FIN — Fin du bloc à copier

---

## Prompt suggéré pour ChatGPT

Après avoir collé le bloc ci-dessus, tu peux utiliser ce prompt :

```
Génère un rapport de progrès complet pour ce projet (Gradely) en suivant la structure du rapport de référence fourni :

1. Introduction — Contexte, motivation, vision du projet
2. Objectifs du projet — Objectifs principaux, comparaison avec solutions existantes, avantages d'une solution sur mesure
3. Méthodologies de développement
   a. Cahier des charges (tableau des cas d'utilisation + descriptions détaillées pour 2-3 cas)
   b. Diagramme de cas d'utilisation (description textuelle de ce qu'il contiendrait)
   c. Diagramme de classe (description des entités et relations)
   d. Diagramme d'architecture (description backend/frontend)
4. Développement de l'application — Ce qui a été fait (DB, API, frontend, outils), état actuel
5. Calendrier — Tableau des semaines, tâches, participation, statut
6. Conclusion — Bilan, avantages, perspectives
7. Références

Le rapport doit être en français, professionnel, et prêt à être converti en PDF. Adapte les sections "Équipe", "Coordonnateur", "Superviseur" et "Calendrier" si des informations manquent (indique [À compléter] ou propose des placeholders).
```
