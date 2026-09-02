# Mehrstufiger Build: Die Laufzeit enthält weder Quellcode noch Build-Werkzeuge.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Prisma benötigt beim Generieren eine syntaktisch gültige URL, stellt aber
# während des Builds keine Datenbankverbindung her. Die echte URL kommt erst
# beim Containerstart aus Docker Compose.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"
# Prisma Client muss vor dem Next-Build erzeugt werden.
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Nicht als root laufen.
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
# Schema, Migrationen und Seed werden zur Laufzeit für `prisma migrate deploy`
# gebraucht.
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

USER nextjs
EXPOSE 3000

# Migrationen vor dem Start anwenden — sonst läuft die App gegen ein veraltetes
# Schema, wenn jemand das Deploy-Skript vergisst.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
