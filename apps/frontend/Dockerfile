# syntax=docker/dockerfile:1.7

# ---- deps stage ----
FROM node:24-alpine AS deps
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./
COPY packages/tsconfig ./packages/tsconfig
COPY apps/frontend/package.json ./apps/frontend/

RUN pnpm install --frozen-lockfile --filter frontend... --ignore-scripts

# ---- build stage ----
FROM deps AS build
COPY apps/frontend ./apps/frontend

# Bake API endpoint into the Vite bundle (relative path → goes through nginx proxy)
ARG VITE_GRAPHQL_ENDPOINT=/graphql
ENV VITE_GRAPHQL_ENDPOINT=$VITE_GRAPHQL_ENDPOINT

RUN pnpm --filter frontend build

# ---- runtime: nginx serves static + proxies /graphql ----
FROM nginx:1.27-alpine AS runtime
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
