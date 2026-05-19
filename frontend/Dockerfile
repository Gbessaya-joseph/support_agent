# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Installer pnpm
RUN npm install -g pnpm

# Fixer un store pnpm unique (accessible à tous les utilisateurs)
RUN pnpm config set store-dir /app/.pnpm-store --global

# Autoriser les builds natifs (sharp, unrs-resolver)
ENV PNPM_ONLY_BUILT_DEPENDENCIES='["sharp","unrs-resolver"]'

# Copier les fichiers de dépendances
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Installer toutes les dépendances (dev inclus pour build)
RUN pnpm install --frozen-lockfile

# Copier le code source
COPY . .

# Build Next.js
RUN pnpm run build

# Production stage
FROM node:22-alpine

# Créer un utilisateur non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Installer pnpm
RUN npm install -g pnpm

# Fixer le même store pnpm
RUN pnpm config set store-dir /app/.pnpm-store --global

# Autoriser les builds natifs
ENV PNPM_ONLY_BUILT_DEPENDENCIES='["sharp","unrs-resolver"]'

# Copier les fichiers de dépendances
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Installer uniquement les dépendances de prod
RUN pnpm install --prod --frozen-lockfile

# Copier l’application buildée
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./

# Donner les droits à appuser
RUN chown -R appuser:appgroup /app

# Passer en utilisateur non-root
USER appuser

# Exposer le port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Démarrer l’application
CMD ["pnpm", "start"]
