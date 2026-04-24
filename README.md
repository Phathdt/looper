# Looper

Mini social-feed fullstack demo built around a GraphQL API with end-to-end type safety.
Showcases the N+1 problem, DataLoader batching, cursor pagination, and a fully tested
React 19 + NestJS 11 stack inside a Turborepo monorepo.

## Stack

| Layer        | Tech                                                                                   |
| ------------ | -------------------------------------------------------------------------------------- |
| Monorepo     | Turborepo, pnpm workspaces                                                             |
| Frontend     | React 19, Vite 8, Tailwind 4, TanStack Query 5, React Hook Form + Zod, GraphQL Codegen |
| Backend      | NestJS 11, Apollo 5, GraphQL 16, Prisma 7 + PostgreSQL, DataLoader, Pino               |
| Bundler (BE) | rolldown (CJS, externalize deps)                                                       |
| Testing      | Vitest 4, Testcontainers, Cucumber + Playwright (E2E)                                  |
| Tooling      | oxlint, prettier, lefthook, lint-staged, TS 5.9, shared `@looper/tsconfig`             |

## Project layout

```
.
├── apps/
│   ├── backend/        NestJS GraphQL API
│   ├── frontend/       React app
│   └── e2e/            Cucumber + Playwright suite
├── packages/
│   └── tsconfig/       Shared TS presets (base, nest, react, node)
├── docs/               PRD + spec
├── plans/              Implementation plans + reports
├── docker-compose.yml  Postgres
├── turbo.json          Pipeline
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
pnpm --filter backend exec prisma db seed
pnpm --filter backend prisma:generate

# 5. Generate FE GraphQL hooks (BE must be running)
pnpm dev:be &           # in another terminal
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
| `pnpm format` / `format:check`                     | Prettier                                           |
| `pnpm db:up` / `db:down` / `db:logs`               | Docker Postgres                                    |

## Backend (`apps/backend`)

- **Dev**: `concurrently('rolldown -c -w', 'nodemon')`
  - rolldown rebuilds `dist/main.js` on change
  - nodemon (300ms debounce) restarts the bundle
- **Modules** (`src/modules`): `auth, user, post, comment, follow, feed, dataloader, prisma, graphql`
- **Prisma 7** uses driver-adapter pattern: `PrismaPg` from `@prisma/adapter-pg` + `prisma.config.ts` for migrations
- **Seed** is deterministic — `apps/backend/prisma/seed.ts` produces a stable follow graph so e2e is reproducible
- **DataLoader** lives at `modules/dataloader/dataloader.service.ts` — per-request loaders for `userById`, `commentsByPost`, `followersCountByUser`, `isFollowingByUser`, eliminating N+1 on nested feed queries

## Frontend (`apps/frontend`)

- **Hook-first architecture**: each feature has a `hooks/` folder with the logic, components only render
- **Forms**: React Hook Form + Zod resolvers (`use-login`, `use-register`, `use-create-post`, `use-add-comment`)
- **Codegen** (`src/generated/graphql.ts`) emits typed React Query v5 hooks with infinite query support; uses `addInfiniteQuery: true`, `documentMode: "string"`, `TypedDocumentString` helper class injected via `@graphql-codegen/add`
- **Tests** colocated Go-style (`*.test.ts` next to source); shared infra in `test/`
- **Tailwind 4** CSS-first via `@tailwindcss/vite` — no `tailwind.config.ts`, theme variables in `src/index.css`

## E2E (`apps/e2e`)

- **Stack**: Cucumber 12 + Playwright + Pino
- **Page Objects** in `page-objects/` — login, register, feed, create-post, profile
- **Features**: auth (login/register/logout/auth-guard), feed (smoke, pagination), post (create, add-comment), user (follow), session-persistence
- **Run**:
  ```bash
  pnpm --filter e2e exec playwright install chromium    # one-time
  pnpm dev                                              # in another terminal
  pnpm test:e2e                                         # 13 scenarios / 46 steps
  ```

## Test counts (current)

| Suite                                  | Count                   | Time |
| -------------------------------------- | ----------------------- | ---- |
| BE unit (colocated `src/**/*.spec.ts`) | 13                      | <1s  |
| BE integration (testcontainers)        | 24                      | ~10s |
| FE (colocated + hooks)                 | 91 / 24 files           | ~3s  |
| E2E (Cucumber + Playwright)            | 13 scenarios / 46 steps | ~8s  |
| **Total automated**                    | **141**                 |      |

### Coverage thresholds

|          | Statements | Branches | Functions | Lines |
| -------- | ---------- | -------- | --------- | ----- |
| Backend  | 100%       | 95.8%    | 100%      | 100%  |
| Frontend | 98.3%      | 86.5%    | 95.1%     | 99.4% |

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

Without DataLoader: 1 + N + N×M queries (one per author + comments per post + author per comment).
With DataLoader: bounded ~5 queries regardless of page size.

## Pre-commit hooks (lefthook)

- `pre-commit`: lint-staged (oxlint --fix + prettier) → typecheck
- `commit-msg`: Conventional Commits validator

## License

Internal demo project.
