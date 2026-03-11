# Gradely — Résumé pour rapport de progrès (plan de travail réduit)

**À copier dans Claude Sonnet pour générer le rapport de progrès.**

**Plan de travail établi le 8 février 2026. Date du rapport : 11 mars 2026.**  
*Au 11 mars, les semaines 5–6 sont terminées ; nous sommes en phase 7–8 (tableau de bord, intégration frontend, module IA).*

---

## Contexte

Projet de synthèse (INF4173) — Thème : **Mise en place d'une plateforme de gestion de projet pour étudiants, Gradely**.

À la demande du professeur, le périmètre a été réduit pour rester sobre et adapté à un projet de synthèse. Le plan de travail définit **5 objectifs principaux** et une méthodologie en 10 semaines.

**Équipe :** SORO Jean-Samuel Henoc, DIALLO Alpha Boubacar  
**Coordonnatrice :** BOUHADDI Myria  
**Superviseur :** LIMA SOBREIRA Péricles  

---

## Introduction (plan de travail)

La gestion des projets universitaires représente souvent un défi pour les étudiants, notamment en raison du nombre de tâches, des échéances et de livrables à respecter. Le suivi se fait généralement avec plusieurs outils différents, ce qui nuit à l'organisation et à la visibilité.

Gradely est une plateforme web de suivi des projets universitaires. Elle permet aux étudiants de centraliser la gestion des tâches, des livrables, du planning et des échanges avec le superviseur dans un même outil. L'étudiant peut y créer un projet puis envoyer une demande de supervision à un enseignant ; celui-ci peut accepter ou refuser la demande.

Gradely intègre une composante d'intelligence artificielle visant à assister l'étudiant (avancement global, éventuels retards).

L'objectif est d'offrir un outil simple, adapté au contexte universitaire.

---

## Position dans le calendrier (au 11 mars 2026)

Selon le plan de travail du 8 février, **environ 5 semaines** se sont écoulées. La progression par rapport au calendrier prévu :

- **Semaines 1–2** : Terminé  
- **Semaines 3–4** : Terminé  
- **Semaines 5–6** : Terminé  
- **Semaines 7–8** : **En cours** (phase actuelle)  
- **Semaines 9–10** : À venir  

---

## Calendrier et réalisations par phase

| Période | Activités prévues | Responsables | Statut | Réalisations |
|---------|-------------------|--------------|--------|--------------|
| **Semaine 1–2** | Analyse du contexte et des besoins ; définition de la portée ; identification des fonctionnalités | Soro, Diallo | Terminé | Besoins identifiés ; analyse des outils existants ; définition des 5 objectifs et périmètre sobre |
| **Semaine 3–4** | Conception de l'architecture ; modélisation de la base de données ; maquettes des interfaces | Soro, Diallo | Terminé | Architecture backend Django / frontend React ; modèles BDD (Project, Task, Comment, ActivityLog, SupervisionRequest) ; maquettes |
| **Semaine 5–6** | Développement backend (projets, tâches, commentaires) ; authentification et rôles ; début frontend | Backend : Soro ; Frontend : collaboratif | Terminé | API REST complète ; JWT ; rôles Étudiant/Superviseur ; demande de supervision (étudiant envoie, superviseur accepte/refuse) ; pages Login, Dashboard, détail projet, Demandes de supervision |
| **Semaine 7–8** | Développement du tableau de bord ; intégration frontend ; développement du module IA | IA : Diallo ; Frontend : collaboratif | En cours | Tableau de bord avec liste des projets et cartes ; API dashboard (résumé, nudges) prête ; affichage du résumé à finaliser ; module IA : en cours de développement |
| **Semaine 9** | Intégration IA ; tests fonctionnels ; corrections | Soro, Diallo | À venir | — |
| **Semaine 10** | Finalisation du projet ; documentation ; livraison finale | Soro, Diallo | À venir | — |

---

## Objectifs du projet (5 objectifs — alignés sur le calendrier)

| # | Objectif | Statut | Réalisation (conformément aux phases terminées) |
|---|----------|--------|--------------------------------------------------|
| 1 | **Concevoir une plateforme de suivi** | ✅ Fait | Plateforme : création de projets, liste, page détail. Demande de supervision après création ; superviseur accepte ou refuse. |
| 2 | **Gestion des tâches** | ✅ Fait | CRUD tâches (statuts, échéances, priorité) — livrable des semaines 5–6 |
| 3 | **Vue synthèse / tableau de bord** | ⚠️ Partiel | En cours (semaines 7–8) : dashboard avec cartes ; API résumé/nudges prête ; affichage à finaliser |
| 4 | **Commentaires et historique des actions** | ✅ Fait | Commentaires par projet ; fil d'activité (ActivityLog) — livrable des semaines 5–6 |
| 5 | **Composante IA d'assistance** | ❌ Non fait | Prévu pour semaines 7–8 et 9 ; en cours de développement (API OpenAI) |

---

## Technologies

| Composant | Plan | Réalisé |
|------------|------|---------|
| Frontend | React | React + Vite + Tailwind CSS |
| Backend | Django | Django + Django REST Framework |
| Base de données | MySQL | SQLite (développement) — migration MySQL prévue |
| Analyse et alertes | OpenAI API | En cours de développement |

---

## Développement réalisé (organisé par phases du calendrier)

**Phases 1–2 (Terminé)** : Analyse, définition du périmètre, identification des fonctionnalités.

**Phases 3–4 (Terminé)** : Conception de l'architecture, modélisation BDD, maquettes.

**Phases 5–6 (Terminé)** :  
- Backend : projets, tâches, commentaires, historique (ActivityLog), demandes de supervision  
- Authentification JWT, rôles Étudiant/Superviseur  
- Frontend : Login, Dashboard, page détail projet, page Demandes de supervision  
- L'étudiant peut créer un projet et envoyer une demande de supervision ; le superviseur peut accepter ou refuser.

**Phase 7–8 (En cours)** :  
- Tableau de bord : liste des projets, cartes, badge des demandes en attente  
- API `/api/dashboard/student` (résumé, nudges) opérationnelle  
- Affichage du résumé et des nudges côté frontend : à finaliser  
- Module IA : en cours de développement

---

## Ce qui reste à faire (semaines 7–8 à 10)

1. **Priorité haute :** Finaliser le module IA (OpenAI API) — résumés et suggestions  
2. **Priorité haute :** Afficher le résumé et les nudges du dashboard (API prête)  
3. **Semaine 9 :** Intégration IA, tests fonctionnels, corrections  
4. **Semaine 10 :** Documentation technique et utilisateur, livraison finale  

---

## Références

- Dépôt GitHub : https://github.com/HenocSoro/projet-GRADELY  
- Documentation : docs/RESUME_PROJET.md  

---

## Prompt pour Claude Sonnet

```
À partir des informations ci-dessus, génère un rapport de progrès complet pour le projet Gradely (INF4173). Le rapport doit :

1. **Respecter le calendrier du plan de travail** — Le plan a été établi le 8 février 2026 ; la date du rapport est le 11 mars 2026. Présenter la progression conformément aux phases : semaines 1–2 et 3–4 terminées ; semaines 5–6 terminées ; semaines 7–8 en cours (phase actuelle) ; semaines 9–10 à venir.

2. **Structure du rapport :**
   - Introduction (contexte, problème, solution Gradely, sobriété du périmètre)
   - Objectifs du projet (les 5 objectifs avec statut)
   - Méthodologie et développement (organisé par phases du calendrier : ce qui a été fait en 1–2, 3–4, 5–6 ; ce qui est en cours en 7–8)
   - Calendrier (tableau avec activités, responsables, statut, réalisations par phase)
   - Conclusion (bilan, position dans le calendrier, perspectives pour les semaines 9–10)
   - Références

3. **Inclure** la fonctionnalité de demande de supervision (étudiant envoie après création du projet ; superviseur accepte ou refuse).

4. Le rapport doit être sobre, professionnel, en français, prêt pour conversion en PDF. La progression doit être clairement rattachée au calendrier prévu.
```
