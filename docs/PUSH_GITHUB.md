# Procédure : pousser le projet Gradely sur GitHub

## Prérequis

- Compte [GitHub](https://github.com)
- Git installé (`git --version`)
- Un dépôt **vide** créé sur GitHub (sans README, sans .gitignore)  
  → [New repository](https://github.com/new), nom ex. `gradely`, puis **Create repository**

---

## Cas 1 : Premier push (dépôt vide)

Voir les étapes détaillées plus bas (init, remote, add, commit, push).

---

## Cas 2 : Le dossier actuel n’a jamais été un dépôt Git ("not a git repository")

Si tu vois `fatal: not a git repository`, il n’y a pas de `.git` à la racine. Il faut **initialiser** puis **relier** ton dépôt GitHub :

```bash
# À la racine du projet (gradely/)
git init
git remote add origin https://github.com/TON_COMPTE/gradely.git
git add .
git commit -m "Projet complet: backend Django, frontend React/Vite, docs"
git branch -M main
git push -u origin main
```

Si GitHub refuse le push car il y a déjà des commits (ex. première partie du backend) :

```bash
git pull origin main --allow-unrelated-histories
# Résoudre les conflits éventuels dans les fichiers indiqués, puis :
git add .
git commit -m "Fusion historique: projet complet"
git push
```

---

## Cas 3 : Dépôt déjà initialisé, tu as déjà poussé une première partie

Tu es à la racine et `git status` fonctionne. Pour **ajouter tout le reste** et pousser :

```bash
git status
git add .
git commit -m "Ajout frontend React/Vite, docs, suite backend"
git push
```

---

## Détails : premier push (dépôt vide)

### 1. À la racine du projet

```bash
cd /Users/henocsoro/gradely
```

### 2. Initialiser Git (si pas déjà fait)

```bash
git init
```

### 3. Vérifier / ajouter le remote GitHub

Remplace `TON_COMPTE` et `gradely` par ton GitHub et le nom du dépôt.

**Vérifier le remote :**

```bash
git remote -v
```

**Ajouter le remote si besoin :**

```bash
git remote add origin https://github.com/TON_COMPTE/gradely.git
```

### 4. Ajouter les fichiers et committer

```bash
git add .
git commit -m "Initial commit: backend Django, frontend React/Vite, docs"
git branch -M main
git push -u origin main
```

---

## Pushes suivants (après des modifications)

```bash
git add .
git commit -m "Description des changements"
git push
```

---

## Fichiers / dossiers ignorés

- **Racine :** `.venv/`, `.DS_Store`
- **backend :** `__pycache__/`, `.env`, `db.sqlite3`, `media/`, `staticfiles/`, `.venv/`
- **frontend :** `node_modules/`, `dist/`, `.env`, `*.local`

Ne pas commiter les `.env` (secrets).
