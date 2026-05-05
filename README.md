# Looper

Mini social-feed fullstack demo built around a GraphQL API with end-to-end type safety.
Showcases the N+1 problem, DataLoader batching, cursor pagination, clean architecture,
rate limiting, Zod validation, snake_case DB layer (Prisma `@map`), and a 100%-covered
React 19 + NestJS 11 stack inside a Turborepo monorepo.

## Stack

| Layer            | Tech                                                                                                                    |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Monorepo         | Turborepo, pnpm workspaces                                                                                              |
| Frontend         | React 19, Vite 8, Tailwind 4, TanStack Query 5, React Hook Form + Zod, GraphQL Codegen                                  |
| Backend          | NestJS 11, Apollo 5, GraphQL 16, Prisma 7 + PostgreSQL (snake_case via `@map`), DataLoader, nestjs-zod, Throttler, Pino |
| Dev runtime (BE) | swc-node/register --watch (single-process, ESM, decorator metadata)                                                     |
| Bundler (BE)     | rolldown (CJS, externalize deps) → `dist/main.cjs`                                                                      |
| Testing          | Vitest 4 (unit + integration + coverage configs), Testcontainers, Cucumber + Playwright (E2E)                           |
| Tooling          | oxlint v1, prettier (sort-imports), lefthook, lint-staged, knip, barrelsby, TS 5.9                                      |

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

**3-layer clean architecture** per module — transport (resolvers/DataLoader/GraphQL DTOs) hoisted to `src/` root, modules expose ports only:

```
src/
├── resolvers/                              # @Resolver — ALL transport here
├── graphql/                                # @ObjectType DTOs + DataLoader
└── modules/<feature>/
    ├── domain/
    │   ├── entities/<feature>.entity.ts    # pure TS POJO, NO decorators
    │   ├── interfaces/                     # abstract IXxxService + IXxxRepository (DI tokens)
    │   ├── dto/                            # Zod schemas (scalar) + @InputType (objects)
    │   └── errors.ts                       # NestJS HttpException subclasses
    ├── application/services/               # XxxService — NO @Injectable, NO @nestjs/* imports
    ├── infrastructure/
    │   ├── repositories/                   # XxxPrismaRepository implements IXxxRepository
    │   └── token/                          # framework adapters (e.g. JwtTokenSigner)
    ├── <feature>.module.ts                 # useFactory + inject for services, useClass for repos
    └── index.ts                            # barrelsby-generated
```

- **Domain modules**: `auth, user, post, comment, follow, like, feed, prisma`
- **Naming**: abstract `IXxxService`/`IXxxRepository` (interface marker = DI token) vs concrete `XxxService`/`XxxPrismaRepository` (technology marker)
- **Path aliases**: single source in `tsconfig.json` (`@modules/<name>`, `@common/*`, `@graphql/*`, `@resolvers/*`); vitest reads via `vite-tsconfig-paths`, rolldown via `resolve.tsconfigFilename`, swc-node-register inherits from tsconfig
- **Framework-agnostic application** — services have ZERO `@nestjs/*` imports, no `@Injectable()`. Wire via `useFactory` in module. Domain entities are POJO interfaces.
- **Prisma impls** map row → entity via `toUser/toPost/...` functions; password isolated via `UserCredentials` type + `findCredentialsByEmail`
- **Validation**: `nestjs-zod`'s `ZodValidationPipe` per-arg — Zod schemas live in `domain/dto/*.schema.ts` (e.g., `post-content.schema.ts` cap 5000 chars, `comment-content.schema.ts` cap 500 chars)
- **Rate limiting**: `@nestjs/throttler` with custom `GqlThrottlerGuard` — global 100/min, `createPost` 20/min, `addComment` 30/min
- **JWT secret** fail-fast: `auth.module.ts` throws at boot if `NODE_ENV=production` and `JWT_SECRET` missing
- **Prisma 7** driver-adapter pattern: `PrismaPg` from `@prisma/adapter-pg` + `prisma.config.ts` for migrations (no `url` in schema). Tables/columns are **snake_case** via `@map`/`@@map` (Prisma client API stays camelCase)
- **Seed** deterministic for e2e reproducibility — 5 users, 20 posts, 40 comments, 10 follows, 54 likes
- **DataLoader** injects `IXxxRepository` — per-request loaders: `userById`, `commentsByPost`, `followersCountByUser`, `isFollowingByUser`, `likesCountByPost`, `isLikedByPost`, `postsByAuthor`. Toggle batching with header `x-disable-dataloader: 1`; demo plugin returns `extensions.queryCount`.
- **LikeService** validates (post exists + chặn self-like) before delegating; FollowService chặn self-follow; UserService trả `UserNotFoundError`
- **Dev**: `node --import @swc-node/register/esm-register --watch src/main.ts` — single process, SWC handles decorator metadata (esbuild/tsx don't)

## Frontend (`apps/frontend`)

- **Hook-first architecture**: each feature has a `hooks/` folder. Components render-only.
- **Forms**: React Hook Form + Zod resolvers (`use-login`, `use-register`, `use-create-post`, `use-add-comment`)
- **Codegen** (`src/generated/graphql.ts`) emits typed RQ v5 hooks via `@graphql-codegen/typescript-react-query@7` with `documentMode: 'string'`, `TypedDocumentString` injected via `@graphql-codegen/add`
- **Tests** colocated Go-style (`*.test.ts(x)` next to source); shared infra in `test/` accessed via `@test/*` alias
- **Tailwind 4** CSS-first via `@tailwindcss/vite` — theme variables in `src/index.css`

## E2E (`apps/e2e`)

- **Stack**: Cucumber 12 + Playwright + Pino
- **Page Objects** in `page-objects/` — login, register, feed, create-post, profile
- **Features**: auth (login/register/logout/auth-guard/persistence), feed (smoke, pagination), post (create, add-comment, like)
  , user (follow)
- **Run**:
  ```bash
  pnpm --filter e2e exec playwright install chromium    # one-time
  pnpm dev                                              # in another terminal
  pnpm test:e2e                                         # 15 scenarios / 64 steps
  ```

## Test counts (current)

| Suite                                                    | Count                   | Time |
| -------------------------------------------------------- | ----------------------- | ---- |
| BE unit (`*.spec.ts` colocated next to source)           | 106 / 18 files          | <1s  |
| BE integration (`*.integration.spec.ts`, testcontainers) | 91 / 15 files           | ~17s |
| FE (colocated unit + hooks)                              | 95 / 24 files           | ~3s  |
| E2E (Cucumber + Playwright)                              | 15 scenarios / 64 steps | ~10s |
| **Total automated**                                      | **307**                 |      |

### Coverage

|          | Statements | Branches | Functions | Lines |
| -------- | ---------- | -------- | --------- | ----- |
| Backend  | **100%**   | **100%** | **100%**  | 100%  |
| Frontend | 98.3%      | 86.5%    | 95.1%     | 99.4% |

Thresholds: **BE 99/99/99/99** · FE 90/80/85/90. Backend coverage scope (via `vitest.coverage.config.ts`): all application services, domain (cursor + zod schemas), infrastructure (prisma-repos + token adapter), DataLoader, common request-context. Resolvers tested via `*.resolver.integration.spec.ts` + `*.resolver.spec.ts` but excluded from numeric report (NestJS decorator line-attribution interferes with Istanbul/v8).

## N+1 demo

Run the feed query and observe Prisma logs (every SQL is logged with `#seq` + `dl=on/off` prefix in dev):

```graphql
query {
  feed(first: 10) {
    edges {
      node {
        id
        likesCount
        isLiked
        author {
          id
          name
        }
        comments {
          id
          content
          author {
            name
          }
        }
      }
    }
  }
}
```

Toggle batching live with header `x-disable-dataloader: 1`. Server returns `extensions.queryCount` in every response.

| Mode               | SQL count for above query                                   |
| ------------------ | ----------------------------------------------------------- |
| DataLoader **on**  | ~7 queries (1 feed + batched author/comments/likes/isLiked) |
| DataLoader **off** | ~80 queries (classic N+1)                                   |

For deeper nested case (`feed > author > posts > likesCount`): ~10 SQL with DataLoader vs ~133 without.

## Docker

Production-style stack:

```bash
pnpm --filter frontend generate    # ensure src/generated/graphql.ts exists
pnpm docker:build                  # build BE + FE images
pnpm docker:up                     # postgres + backend + nginx-frontend
```

- Backend: bundled via rolldown, runs `prisma migrate deploy && node dist/main.cjs`
- Frontend: `vite build` + nginx (gzip, `/assets/` cache 1y, `/graphql` proxy → backend, SPA fallback)
- Postgres: healthcheck-gated; backend waits for it

Visit <http://localhost:8080> (FE through nginx) — GraphQL proxied at `/graphql`.

## Pre-commit hooks (lefthook)

- `pre-commit`: lint-staged (oxlint --fix + prettier) + typecheck
- `commit-msg`: Conventional Commits validator (`feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert`)

## License

Internal demo project.
