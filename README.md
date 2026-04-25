# Looper

Mini social-feed fullstack demo built around a GraphQL API with end-to-end type safety.
Showcases the N+1 problem, DataLoader batching, cursor pagination, clean architecture,
and a fully tested React 19 + NestJS 11 stack inside a Turborepo monorepo.

## Stack

| Layer        | Tech                                                                                   |
| ------------ | -------------------------------------------------------------------------------------- |
| Monorepo     | Turborepo, pnpm workspaces                                                             |
| Frontend     | React 19, Vite 8, Tailwind 4, TanStack Query 5, React Hook Form + Zod, GraphQL Codegen |
| Backend      | NestJS 11, Apollo 5, GraphQL 16, Prisma 7 + PostgreSQL, DataLoader, Zod DTOs, Pino     |
| Bundler (BE) | rolldown (CJS, externalize deps)                                                       |
| Testing      | Vitest 4, Testcontainers, Cucumber + Playwright (E2E)                                  |
| Tooling      | oxlint v1, prettier (sort-imports), lefthook, lint-staged, knip, barrelsby, TS 5.9     |

## Project layout

```
.
├── apps/
│   ├── backend/        NestJS GraphQL API (clean architecture)
│   ├── frontend/       React app
│   └── e2e/            Cucumber + Playwright suite
├── packages/
│   └── tsconfig/       Shared TS presets (base, nest, react, node)
├── docs/               PRD + spec
├── plans/              Implementation plans + reports
├── docker-compose.yml  Postgres + backend + frontend (nginx)
├── turbo.json          Pipeline
├── knip.json           Dep audit config
├── .barrelsby.json     Auto-generated module barrels
└── .npmrc              public-hoist-pattern for tsc/ts-node/@types
```

## Quick start

```bash
# 1. Install deps
pnpm install

# 2. Spin Postgres
pnpm db:up

# 3. Setup env files
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
cp apps/e2e/.env.example apps/e2e/.env

# 4. Migrate + seed DB
pnpm --filter backend exec prisma migrate deploy
pnpm --filter backend prisma:generate
pnpm --filter backend exec prisma db seed

# 5. Start BE for codegen, then generate FE GraphQL hooks
pnpm dev:be &
pnpm --filter frontend generate

# 6. Run dev (both)
pnpm dev
```

Frontend: <http://localhost:5173> · GraphQL Playground: <http://localhost:4000/graphql>

Seeded credentials: `alice@looper.dev` / `password123`.

## Scripts (root)

| Command                                            | Description                                        |
| -------------------------------------------------- | -------------------------------------------------- |
| `pnpm dev`                                         | Run BE + FE concurrently via Turbo                 |
| `pnpm dev:be` / `pnpm dev:fe`                      | Single-app dev                                     |
| `pnpm build`                                       | Build BE (rolldown) + FE (vite) into `apps/*/dist` |
| `pnpm test`                                        | Run unit + integration across BE + FE              |
| `pnpm test:unit` / `test:integration` / `test:e2e` | Filtered runs                                      |
| `pnpm typecheck`                                   | `tsc --noEmit` across all workspaces               |
| `pnpm lint` / `pnpm lint:fix`                      | oxlint v1                                          |
| `pnpm format` / `format:check`                     | Prettier (single-quote, no-semi, sort-imports)     |
| `pnpm knip` / `pnpm knip:fix`                      | Find unused exports, deps, files                   |
| `pnpm barrels`                                     | Regenerate module `index.ts` (barrelsby)           |
| `pnpm db:up` / `db:down` / `db:logs`               | Docker Postgres                                    |
| `pnpm docker:build` / `docker:up` / `docker:logs`  | Full stack via Docker Compose                      |

## Backend (`apps/backend`)

**Clean architecture** per module:

```
modules/<feature>/
├── application/services/             # use-cases, no Prisma
├── domain/{entities,dto,interfaces,errors}/
├── infrastructure/{repositories,resolvers}/
├── <feature>.module.ts
├── <feature>.{service.spec, integration.spec}.ts
└── index.ts                          # barrelsby-generated
```

- **Modules**: `auth, user, post, comment, follow, feed, dataloader, prisma, graphql`
- **Path aliases**: `@modules/<name>` resolves to module barrel `index.ts`
- **Repositories** are abstract classes (DI tokens). Application services depend on these — never on `PrismaService`. Prisma impls live in `infrastructure/repositories/`.
- **DTOs** use Zod schemas + custom `ZodValidationPipe` (no `class-validator`)
- **Prisma 7** driver-adapter pattern: `PrismaPg` from `@prisma/adapter-pg` + `prisma.config.ts` for migrations (no `url` in schema)
- **Seed** deterministic for e2e reproducibility
- **DataLoader** injects repositories — per-request loaders for `userById`, `commentsByPost`, `followersCountByUser`, `isFollowingByUser`, eliminating N+1 on nested feed queries
- **Dev**: `concurrently('rolldown -c -w', 'nodemon')` — bundle rebuilds, nodemon restarts node on output change (300ms debounce)

## Frontend (`apps/frontend`)

- **Hook-first architecture**: each feature has a `hooks/` folder. Components render-only.
- **Forms**: React Hook Form + Zod resolvers (`use-login`, `use-register`, `use-create-post`, `use-add-comment`)
- **Codegen** (`src/generated/graphql.ts`) emits typed RQ v5 hooks via `@graphql-codegen/typescript-react-query@7` with `documentMode: 'string'`, `TypedDocumentString` injected via `@graphql-codegen/add`
- **Tests** colocated Go-style (`*.test.ts(x)` next to source); shared infra in `test/` accessed via `@test/*` alias
- **Tailwind 4** CSS-first via `@tailwindcss/vite` — theme variables in `src/index.css`

## E2E (`apps/e2e`)

- **Stack**: Cucumber 12 + Playwright + Pino
- **Page Objects** in `page-objects/` — login, register, feed, create-post, profile
- **Features**: auth (login/register/logout/auth-guard/persistence), feed (smoke, pagination), post (create, add-comment), user (follow)
- **Run**:
  ```bash
  pnpm --filter e2e exec playwright install chromium    # one-time
  pnpm dev                                              # in another terminal
  pnpm test:e2e                                         # 13 scenarios / 46 steps
  ```

## Test counts (current)

| Suite                                                    | Count                   | Time |
| -------------------------------------------------------- | ----------------------- | ---- |
| BE unit (`*.spec.ts`)                                    | 13                      | <1s  |
| BE integration (`*.integration.spec.ts`, testcontainers) | 24                      | ~10s |
| FE (colocated unit + hooks)                              | 91 / 24 files           | ~3s  |
| E2E (Cucumber + Playwright)                              | 13 scenarios / 46 steps | ~8s  |
| **Total automated**                                      | **141**                 |      |

### Coverage

|          | Statements | Branches | Functions | Lines |
| -------- | ---------- | -------- | --------- | ----- |
| Backend  | 100%       | 95.8%    | 100%      | 100%  |
| Frontend | 98.3%      | 86.5%    | 95.1%     | 99.4% |

Thresholds: BE 80/75/80/80 · FE 90/80/85/90.

## N+1 demo

Run the feed query and observe Prisma logs:

```graphql
query {
  feed(first: 10) {
    edges {
      node {
        id
        author {
          name
        }
        comments {
          author {
            name
          }
        }
      }
    }
  }
}
```

Without DataLoader: 1 + N + N×M queries.
With DataLoader: ~5 queries regardless of page size.

## Docker

Production-style stack:

```bash
pnpm --filter frontend generate    # ensure src/generated/graphql.ts exists
pnpm docker:build                  # build BE + FE images
pnpm docker:up                     # postgres + backend + nginx-frontend
```

- Backend: bundled via rolldown, runs `prisma migrate deploy && node dist/main.js`
- Frontend: `vite build` + nginx (gzip, `/assets/` cache 1y, `/graphql` proxy → backend, SPA fallback)
- Postgres: healthcheck-gated; backend waits for it

Visit <http://localhost:8080> (FE through nginx) — GraphQL proxied at `/graphql`.

## Pre-commit hooks (lefthook)

- `pre-commit`: lint-staged (oxlint --fix + prettier) + typecheck
- `commit-msg`: Conventional Commits validator (`feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert`)

## License

Internal demo project.
