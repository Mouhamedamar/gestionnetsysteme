# Multi-stage Dockerfile rootless pour frontend React (Vite)
# Stage 1: build
FROM node:20-alpine AS builder

WORKDIR /app

# Dépendances
COPY package.json package-lock.json* ./
RUN npm ci --silent

# Source et build (VITE_API_URL en arg pour l’URL de l’API au build)
ARG VITE_API_URL=http://localhost:8000
ARG VITE_USE_API=true
ENV VITE_API_URL=${VITE_API_URL} VITE_USE_API=${VITE_USE_API}

COPY . .
RUN npm run build

# Stage 2: image de production rootless (nginx non-root)
FROM nginxinc/nginx-unprivileged:stable-alpine AS production

LABEL org.opencontainers.image.source="https://github.com/${GITHUB_REPOSITORY}"

# Contenu statique depuis le builder
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html

# Config nginx rootless (port 8080)
COPY nginx.rootless.conf /etc/nginx/conf.d/default.conf

# L’image tourne déjà en tant qu’utilisateur non-root (nginx)
EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD ["/bin/sh", "-c", "wget -qO- --timeout=2 http://localhost:8080/ || exit 1"]

CMD ["nginx", "-g", "daemon off;"]
