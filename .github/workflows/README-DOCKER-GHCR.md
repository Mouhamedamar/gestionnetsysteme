# Build Docker sur GitHub Actions et stockage GHCR

Aucun besoin d’installer Docker en local : les images sont construites par GitHub Actions et poussées vers **GitHub Container Registry (GHCR)**.

## Déclencher le build

- **Automatique** : à chaque push sur les branches `main` ou `master`.
- **Manuel** : onglet **Actions** → **Build and Push Docker images to GHCR** → **Run workflow**.

## Images produites

Après le workflow, les images sont disponibles sur :

- `ghcr.io/<VOTRE_USERNAME_GITHUB>/gestion-stage-backend:latest`
- `ghcr.io/<VOTRE_USERNAME_GITHUB>/gestion-stage-frontend:latest`

(Le nom d’utilisateur est en minuscules pour respecter GHCR.)

## Lancer le projet avec les images GHCR

1. Créer un fichier `.env` à la racine du dépôt (voir `.env.docker.example`) avec au minimum :
   ```env
   GHCR_IMAGE_PREFIX=ghcr.io/votre_username_github
   ```

2. Si les images sont **privées**, se connecter à GHCR :
   ```bash
   echo $GITHUB_TOKEN | docker login ghcr.io -u VOTRE_USERNAME --password-stdin
   ```
   (Créer un **Personal Access Token** avec `read:packages`.)

3. Lancer avec le compose GHCR (sans build) :
   ```bash
   docker compose -f docker-compose.ghcr.yml up -d
   ```

L’application est accessible sur **http://localhost** (Nginx, MySQL, backend et frontend).

## Rendre les images GHCR publiques

1. GitHub → **Your profile** → **Packages**.
2. Ouvrir `gestion-stage-backend` (ou `gestion-stage-frontend`).
3. **Package settings** → **Change visibility** → **Public**.
