# Multi-stage Dockerfile rootless pour backend Django
# Stage 1: builder (dépendances + collectstatic)
FROM python:3.12-slim AS builder

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# Dépendances de build éventuelles (pillow, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Variables minimales pour collectstatic (pas de DB requise)
ENV DJANGO_SETTINGS_MODULE=gestion_stock.settings \
    SECRET_KEY=collectstatic-only \
    DEBUG=0

RUN python manage.py collectstatic --noinput --clear 2>/dev/null || true

# Stage 2: image de production rootless
FROM python:3.12-slim AS production

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONUNBUFFERED=1

# Runtime libs (pillow)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libjpeg62-turbo \
    zlib1g \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
COPY --from=builder /app/staticfiles ./staticfiles
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Répertoire de données pour volume (DB + media) et utilisateur non-root
RUN groupadd -r app && useradd -r -g app -u 1000 app \
    && mkdir -p /app/data \
    && chown -R app:app /app

USER app

# Avec DATA_DIR=/app/data (docker-compose), DB et media sont persistés dans le volume
ENV DATA_DIR=/app/data

EXPOSE 8000

# Gunicorn : point d’entrée WSGI du projet
ENTRYPOINT ["/entrypoint.sh"]
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "--threads", "2", "--access-logfile", "-", "--error-logfile", "-", "gestion_stock.wsgi:application"]
