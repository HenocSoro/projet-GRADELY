# Résumé Gradely — À envoyer à ChatGPT pour générer le plan de travail (livrable)

Copie-colle le bloc ci-dessous dans ChatGPT et demande : « À partir de ce résumé, génère un plan de travail détaillé à fournir comme livrable (phases, tâches, livrables, ordre, éventuellement planning). »

---

## Texte à copier-coller

**Contexte**

- Projet : **Gradely** — plateforme web de suivi de projets universitaires (projet de synthèse fin de bac).
- Objectif : permettre aux étudiants de gérer leurs projets (tâches, planning, livrables) et aux superviseurs de suivre et valider les dépôts.

**Stack technique**

- **Backend** : Django + Django REST Framework, auth JWT (SimpleJWT).
- **Frontend** : React + Vite + Tailwind CSS, SPA avec routes protégées.
- **Auth** : login email/mot de passe, tokens JWT (access + refresh), rôles Étudiant / Superviseur (lié à is_staff).

**Fonctionnalités déjà réalisées (état actuel)**

- Authentification (login, JWT, refresh) et profil utilisateur (GET /api/me/).
- CRUD projets : création, modification, suppression (owner), liste (owner ou superviseur).
- CRUD tâches par projet (titre, description, statut, priorité, date, lien optionnel à un sprint ; validation : date ≤ fin du sprint).
- Commentaires par projet et fil d’activité (ActivityLog) avec affichage du rôle (Étudiant / Superviseur).
- Planning : jalons (Milestone) et sprints (Sprint), CRUD + vue timeline.
- Livrables : CRUD livrables par projet ; dépôt de fichiers (Submission) avec upload ; date d’échéance (visible par tous, éditée par le superviseur uniquement).
- Reviews : le superviseur peut approuver ou refuser un dépôt avec feedback.
- Demandes de supervision : l’étudiant demande un superviseur ; le superviseur accepte/refuse ; badge « Demandes » avec compteur pour les superviseurs.
- Dashboard : résumé (projets, tâches, en retard), nudges, cartes projets avec badge Propriétaire / Superviseur.
- Permissions : owner vs superviseur (lecture/écriture selon les cas), confirmation avant suppressions sensibles.

**Structure du projet (monorepo)**

- `backend/` : Django (apps `accounts`, `core`), `manage.py`, settings dans `gradely/`.
- `frontend/` : React (src/pages, src/components, src/api), Vite, Tailwind.
- `docs/` : documentation (résumé projet, plan modules, procédure GitHub).

**Modules fonctionnels (pour le plan de travail)**

1. **Module Auth & Projets** : utilisateurs, rôles, JWT, CRUD projets, permissions.
2. **Module Comments & Activité** : commentaires, journal d’activité (ActivityLog), affichage des rôles.
3. **Module Planning** : jalons (Milestones), sprints, vue timeline, lien tâche–sprint.
4. **Module Livrables & Reviews** : livrables, dépôts (fichiers), validation superviseur (approve/reject + feedback).
5. **Module Supervision** : demandes de supervision (étudiant → superviseur), acceptation/refus, badge compteur.
6. **Dashboard & UX** : résumé, nudges, navigation, confirmations, design (Tailwind, composants réutilisables).

**Ce qu’il me faut**

- Un **plan de travail** à fournir comme livrable : découpage en phases, tâches concrètes par phase, livrables associés (code, docs, démos), ordre d’exécution et, si possible, une proposition de planning (semaines ou jalons). Le plan doit refléter l’état actuel (fonctionnalités déjà en place) et pouvoir servir de document de livraison pour un projet de fin d’études.

---

Fin du texte à copier-coller.
