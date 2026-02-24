# Mettre l'application en ligne

Ce guide décrit comment déployer **Gestion** (frontend React + backend Django) en production.

---

## Déploiement actuel (Render + Vercel)

- **Backend Django** : https://gestionnetsysteme.onrender.com  
- **Frontend React** : https://gestionnetsysteme.vercel.app  

Le frontend utilise **`VITE_API_URL`** (voir `frontend/.env.production` et `frontend/src/config.js`). Sur Vercel : définir `VITE_API_URL` = `https://gestionnetsysteme.onrender.com`, Build = `npm install && npm run build`, Output = `dist`, Root = `frontend`.

**Frontend sur Render** (alternative à Vercel) : dans le service Render (Static Site ou Web Service) :
- **Build Command** : `npm install && npm run build`
- **Start Command** : `npm run start` (obligatoire — le script `start` lance `vite preview`)
- **Publish Directory** : `dist`
- **Environment** : `VITE_API_URL` = `https://gestionnetsysteme.onrender.com`
- Node 20 recommandé (`engines.node` dans `package.json`).

---

## 1. Résumé de l’architecture

| Composant | Techno | En production |
|-----------|--------|----------------|
| Frontend | React (Vite) | Fichiers statiques (build) servis par Nginx ou CDN |
| Backend API | Django | Gunicorn + Nginx (ou service PaaS) |
| Base de données | SQLite (dev) | **PostgreSQL** recommandé en prod |
| Fichiers (images, etc.) | `media/` | Volume ou stockage persistant |

---

## 2. Préparer le projet pour la production

### 2.1 Backend (Django)

Variables d’environnement à définir sur le serveur (ou dans un fichier `.env` non versionné) :

```bash
# Obligatoire en production
DJANGO_SECRET_KEY=votre-clé-secrète-longue-et-aléatoire
DJANGO_DEBUG=false
DJANGO_ALLOWED_HOSTS=api.votredomaine.com,votredomaine.com

# Optionnel
DEFAULT_HOST=api.votredomaine.com

# CORS : origines autorisées (frontend)
CORS_ALLOWED_ORIGINS=https://votredomaine.com,https://www.votredomaine.com

# Base de données PostgreSQL (recommandé en prod)
DATABASE_URL=postgresql://user:password@localhost:5432/gestion_stock
# Ou garder SQLite (déconseillé pour plusieurs utilisateurs) en ne définissant pas DATABASE_URL
```

**Base de données PostgreSQL** (recommandé) : le projet utilise déjà `DATABASE_URL` si elle est définie. Installez les paquets :

```bash
pip install dj-database-url psycopg2-binary
```

Puis définissez la variable d'environnement (voir tableau ci-dessous).

### 2.2 Frontend (React / Vite)

Pour le **build de production**, définir l’URL de l’API :

```bash
# .env.production (à la racine du dossier frontend)
VITE_API_URL=https://api.votredomaine.com
```

Puis construire l’app :

```bash
cd frontend
npm ci
npm run build
```

Les fichiers à déployer sont dans `frontend/dist/`.

---

## 3. Option A : Serveur VPS (Nginx + Gunicorn)

Idéal pour un VPS (OVH, Scaleway, DigitalOcean, etc.).

### 3.1 Sur le serveur

- Python 3.10+, Node.js (pour le build), Nginx, PostgreSQL (si utilisé).
- Cloner le dépôt, créer un virtualenv, installer les dépendances :

```bash
cd /opt/gestion  # ou votre répertoire
python -m venv venv
source venv/bin/activate   # Linux/Mac
# ou  venv\Scripts\activate  sous Windows
pip install -r requirements.txt
pip install gunicorn dj-database-url psycopg2-binary
```

### 3.2 Build du frontend

```bash
cd frontend
npm ci
VITE_API_URL=https://api.votredomaine.com npm run build
```

Servir le contenu de `frontend/dist/` avec Nginx (voir plus bas).

### 3.3 Django : static et media

```bash
cd /opt/gestion/gestion_stock
export DJANGO_SECRET_KEY=xxx
export DJANGO_DEBUG=false
export DJANGO_ALLOWED_HOSTS=api.votredomaine.com
python manage.py collectstatic --noinput
python manage.py migrate
```

### 3.4 Lancer Gunicorn

```bash
cd /opt/gestion/gestion_stock
gunicorn gestion_stock.wsgi:application --bind 127.0.0.1:8000 --workers 2
```

En production, utiliser un **service systemd** ou **supervisor** pour garder Gunicorn démarré.

### 3.5 Exemple Nginx

- Une seule machine : Nginx sert le frontend (build React) et reverse-proxy vers Gunicorn pour `/api` et `/media`.
- Remplacer `votredomaine.com` et `api.votredomaine.com` par vos domaines.

```nginx
# Redirection HTTP -> HTTPS (une fois SSL en place)
# server { listen 80; server_name votredomaine.com api.votredomaine.com; return 301 https://$host$request_uri; }

server {
    listen 80;
    server_name votredomaine.com www.votredomaine.com;
    root /opt/gestion/frontend/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location /media {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }
    location /admin {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# API sur sous-domaine (optionnel)
server {
    listen 80;
    server_name api.votredomaine.com;
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Si tout est sur le même domaine (pas de sous-domaine API), utiliser uniquement le premier `server` et laisser `VITE_API_URL` vide ou égal à `https://votredomaine.com` pour que le frontend appelle la même origine.

### 3.6 HTTPS (Let’s Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d votredomaine.com -d www.votredomaine.com
```

---

## 4. Option B : Hébergement PaaS (Render, Railway, etc.)

### 4.1 Backend (Django)

- Créer un **Web Service** (Django).
- Build : `pip install -r requirements.txt && pip install gunicorn`.
- Start : `cd gestion_stock && gunicorn gestion_stock.wsgi:application --bind 0.0.0.0:$PORT`.
- Ajouter les variables d’environnement (SECRET_KEY, DEBUG, ALLOWED_HOSTS, CORS, DATABASE_URL).
- Sur Render/Railway, l’URL du backend sera du type `https://xxx.onrender.com` ou `https://xxx.railway.app`.

### 4.2 Frontend (React)

- Créer un **Static Site** (ou service Node) qui build Vite.
- Build : `cd frontend && npm ci && npm run build`.
- Définir `VITE_API_URL=https://votre-backend.onrender.com` (ou l’URL réelle de l’API).
- Racine de publication : `frontend/dist`.

### 4.3 CORS

Sur le backend, mettre dans `CORS_ALLOWED_ORIGINS` l’URL exacte du frontend (ex. `https://votre-app.onrender.com`).

---

## 5. Checklist avant mise en ligne

- [ ] `DJANGO_DEBUG=false` et `DJANGO_SECRET_KEY` fort et unique
- [ ] `DJANGO_ALLOWED_HOSTS` contient le(s) domaine(s) du backend
- [ ] `CORS_ALLOWED_ORIGINS` contient l’URL du frontend (sans slash final)
- [ ] `VITE_API_URL` pointe vers l’URL réelle de l’API (HTTPS en prod)
- [ ] Base de données : migrations appliquées, compte admin créé si besoin
- [ ] Fichiers : `MEDIA_ROOT` sur un volume persistant (VPS) ou stockage objet (PaaS)
- [ ] HTTPS activé (certificat SSL)
- [ ] Emails / SMS (optionnel) : variables d’environnement SMTP et API Orange (ORANGE_SMS_*) configurées

---

## 6. Résumé des variables d’environnement

### Backend (Django)

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DJANGO_SECRET_KEY` | Clé secrète Django | Chaîne aléatoire longue |
| `DJANGO_DEBUG` | Mode debug | `false` en prod |
| `DJANGO_ALLOWED_HOSTS` | Domaines autorisés | `api.monsite.com` |
| `CORS_ALLOWED_ORIGINS` | Origines CORS (frontend) | `https://monsite.com` |
| `DATABASE_URL` | Connexion PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `DEFAULT_FROM_EMAIL` | Email expéditeur | `noreply@monsite.com` |
| `EMAIL_HOST`, etc. | SMTP | Pour envoi d’emails |
| `ORANGE_SMS_CLIENT_ID`, `ORANGE_SMS_CLIENT_SECRET` | API Orange | Pour envoi SMS (Sénégal) |

### Frontend (build Vite)

| Variable | Description | Exemple |
|----------|-------------|---------|
| `VITE_API_URL` | URL de l’API | `https://api.monsite.com` |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps (optionnel) | Clé API |

Une fois ces étapes appliquées, l’application peut être mise en ligne selon l’option choisie (VPS ou PaaS).

---

## 7. Tâche planifiée : rapport de pointage quotidien (automatique à 10h)

Chaque jour à **10h00**, un rapport des **pointages d’entrée** (période 00h00–10h00 du jour courant) est envoyé **automatiquement** par email aux **Responsables à notifier** (même liste que les alertes stock : *Notifications Stock* dans l’application, avec une adresse email renseignée).

- **Contenu** : tableau des entrées (utilisateur, heure, zone/lieu, note) + synthèse présents/absents (personnel = utilisateurs non-admin actifs).
- **Format** : email en texte + pièce jointe **PDF** pour archivage.

### Démo en local

Pour tester le rapport **sans envoyer d’email** (le contenu s’affiche dans le terminal) :

```bash
cd gestion_stock
python manage.py send_pointage_daily_report --dry-run
```

Avec une date précise (ex. 21 février 2025) :

```bash
python manage.py send_pointage_daily_report --date=2025-02-21 --dry-run
```

Pour **envoyer le rapport par email** (et non dans le terminal), configurez le SMTP dans le fichier **`gestion_stock/.env`** :

```ini
EMAIL_BACKEND=smtp
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=true
EMAIL_HOST_USER=votre-email@gmail.com
EMAIL_HOST_PASSWORD=votre-mot-de-passe-application
DEFAULT_FROM_EMAIL=noreply@votredomaine.com
```

*(Gmail : Compte Google → Sécurité → Validation en 2 étapes → Mots de passe d’application.)*

Ensuite, lancez la commande **sans** `--dry-run` :

```bash
python manage.py send_pointage_daily_report
# ou pour une date de test :
python manage.py send_pointage_daily_report --date=2025-02-21
```

Les destinataires sont les **Responsables à notifier** (menu *Notifications Stock*) : ajoutez au moins un responsable avec une adresse email pour recevoir le rapport.

### Activer l’envoi automatique à 10h (recommandé)

Le projet utilise **django-crontab** : la tâche est définie dans `settings.py` (`CRONJOBS`). Pour que le rapport parte **par email** (et non dans le terminal), configurez le SMTP dans `.env` (voir « Démo en local » ci-dessus). Après déploiement, exécuter **une fois** :

```bash
cd /opt/gestion/gestion_stock   # ou le répertoire du projet Django
source ../venv/bin/activate     # si virtualenv
pip install django-crontab      # ou pip install -r requirements.txt
python manage.py crontab add
```

Cela enregistre le cron système pour lancer le rapport **tous les jours à 10h** (heure du serveur). Pour que ce soit **10h GMT** : régler la variable d’environnement `TZ=UTC` sur le serveur, ou adapter l’heure dans `CRONJOBS` (ex. `0 11 * * *` pour 10h Paris en hiver).

- **Vérifier les tâches** : `python manage.py crontab show`
- **Retirer les tâches** : `python manage.py crontab remove`

### Lancer le rapport manuellement

```bash
python manage.py send_pointage_daily_report
```

Pour tester une date précise sans envoyer d’email :

```bash
python manage.py send_pointage_daily_report --date=2025-02-21 --dry-run
```

### Alternative : cron système (sans django-crontab)

Si vous préférez ne pas utiliser django-crontab, ajoutez à la crontab (`crontab -e`) :

```cron
0 10 * * * cd /opt/gestion/gestion_stock && /opt/gestion/venv/bin/python manage.py send_pointage_daily_report
```

Adapter les chemins et vérifier que l’heure du serveur est en GMT/UTC si vous voulez 10h GMT.

### Envoi automatique à 10h sous Windows (Planificateur de tâches)

1. Ouvrir le **Planificateur de tâches** Windows (rechercher « Planificateur de tâches »).
2. **Créer une tâche** (ou « Créer une tâche de base »).
3. **Général** : nom ex. « Rapport pointage quotidien », cocher « Exécuter même si l’utilisateur n’est pas connecté » si besoin.
4. **Déclencheurs** : **Nouveau** → Répéter : **Quotidien**, Heure : **10:00**, récurrence 1 jour.
5. **Actions** : **Nouveau** → Action « Démarrer un programme » :
   - **Programme/script** : `"C:\Users\Mouha\Downloads\Gestion stage\gestion_stock\envoi_rapport_pointage_10h.bat"` (guillemets obligatoires à cause des espaces dans le chemin).
   - **Démarrer dans** : `C:\Users\Mouha\Downloads\Gestion stage\gestion_stock` (dossier contenant `manage.py`).
6. **Conditions** (optionnel) : décocher « Démarrer uniquement si l’ordinateur est sur secteur » si vous voulez que ça tourne sur batterie.
7. **OK** puis entrer le mot de passe si vous avez coché « Exécuter même si l'utilisateur n'est pas connecté ».

**Important pour que l’email parte à 10h :**
- **Programme/script** : mettre le chemin **complet** du `.bat` et l’entourer de **guillemets** si le chemin contient des espaces, ex. : `"C:\Users\Mouha\Downloads\Gestion stage\gestion_stock\envoi_rapport_pointage_10h.bat"`
- **Démarrer dans** : indiquer le dossier où se trouve `manage.py`, ex. : `C:\Users\Mouha\Downloads\Gestion stage\gestion_stock`

**Vérifier que la tâche s’exécute :**
- Clic droit sur la tâche → **Exécuter** : vous devez recevoir l’email et voir des lignes dans `gestion_stock\logs\rapport_pointage_log.txt`.
- Si l’email ne part pas à 10h : dans le Planificateur, regarder **Dernière exécution** / **Dernière heure d’exécution**. Si « Jamais » ou une vieille heure → le PC était peut-être éteint ou en veille, ou l’option « Exécuter que l'utilisateur est connecté » est cochée et personne n’était connecté à 10h. L’heure 10:00 est l’heure **locale** Windows.
