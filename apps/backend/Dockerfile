# syntax=docker/dockerfile:1.7

# ---- deps stage: install workspace deps ----
FROM node:24-alpine AS deps
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
WORKDIR /app

# Copy workspace metadata
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./
COPY packages/tsconfig ./packages/tsconfig
COPY apps/backend/package.json ./apps/backend/

RUN pnpm install --frozen-lockfile --filter backend... --ignore-scripts

# ---- build stage: prisma generate + rolldown bundle ----
FROM deps AS build
COPY apps/backend ./apps/backend
RUN cd apps/backend && pnpm exec prisma generate
RUN pnpm --filter backend build

# ---- runtime stage: production-only deps + bundle ----
FROM node:24-alpine AS runtime
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
WORKDIR /app
ENV NODE_ENV=production

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./
COPY packages/tsconfig ./packages/tsconfig
COPY apps/backend/package.json ./apps/backend/
COPY apps/backend/prisma ./apps/backend/prisma
COPY apps/backend/prisma.config.ts ./apps/backend/prisma.config.ts

RUN pnpm install --frozen-lockfile --filter backend... --ignore-scripts

# Copy bundle + generated Prisma client from build stage
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/apps/backend/prisma/generated ./apps/backend/prisma/generated

WORKDIR /app/apps/backend
EXPOSE 4000

# Run migrate deploy then start the app
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/main.js"]
