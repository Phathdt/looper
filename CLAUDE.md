# CLAUDE.md

Notes for Claude Code working in this repo.

## Repo at a glance

Turborepo monorepo. Three apps + one shared package:

```
apps/backend     NestJS 11 + Apollo 5 + Prisma 7 + Zod (nestjs-zod) + Throttler
apps/frontend    React 19 + Vite 8 + Tailwind 4
apps/e2e         Cucumber + Playwright
packages/tsconfig @looper/tsconfig — shared TS presets
```

**Domain modules**: `auth, user, post, comment, follow, like, feed, prisma`.

## Conventions

- **Package manager**: pnpm 10. `pnpm.overrides.typescript: ^5.9.3` in root — do not bump TS to 6 (tooling churn, see "Things you must NOT do").
- **File names**: kebab-case for `.ts/.tsx/.js/.py/.sh`.
- **Tests**: colocated Go-style.
  - Unit: `*.spec.ts` **next to source file** (e.g., `application/services/like.service.spec.ts`, `infrastructure/token/jwt-token-signer.spec.ts`, `domain/dto/post-content.schema.spec.ts`). FE: `*.test.ts(x)` next to source.
  - **BE integration**: `*.integration.spec.ts` either colocated next to source (`infrastructure/repositories/*.prisma-repository.integration.spec.ts`, `resolvers/*.resolver.integration.spec.ts`) or at module root for cross-component flows (`auth/auth.integration.spec.ts`, `feed/feed.integration.spec.ts`, `user/user.integration.spec.ts`). Shared `setup-postgres.ts` at `src/test-utils/`.
  - 3 vitest configs: `vitest.config.ts` (unit), `vitest.integration.config.ts` (testcontainers), `vitest.coverage.config.ts` (combined single-pass with thresholds).
  - FE shared test infra in `apps/frontend/test/{setup,test-utils,vitest.d}.ts` accessed via `@test/*` alias.
- **Lint**: oxlint v1. 0 warnings / 0 errors target. `import/no-unassigned-import` disabled (legitimate side-effect imports).
- **Prettier**: 120 col, **single quote, no semi**, trailing commas, `@ianvs/prettier-plugin-sort-imports` (groups: react → @scope → @/ → bare → relative).
- **Path aliases (BE)**: `@modules/*` → `src/modules/*`, `@common/*` → `src/common/*`, `@graphql/*` → `src/graphql/*`, `@resolvers/*` → `src/resolvers/*`. **Single source: `tsconfig.json`**. Vitest reads via `vite-tsconfig-paths` plugin; rolldown via `resolve.tsconfigFilename`; swc-node-register reads tsconfig automatically.

## Backend architecture (3-layer clean architecture)

Top-level layout under `apps/backend/src/`:

```
src/
├── app.module.ts                              # registers all resolvers + imports feature modules + GraphQL/DataLoader wiring
├── resolvers/                                 # GraphQL transport — ALL resolvers live here, NOT inside modules
│   ├── <feature>.resolver.ts                  # @Resolver — injects IXxxService from module
│   ├── <feature>.resolver.integration.spec.ts # full GraphQL harness via testcontainers
│   ├── gql-auth.guard.ts                      # NestJS guard checking req.user
│   └── current-user.decorator.ts              # @CurrentUser param decorator
├── graphql/                                   # GraphQL @ObjectType DTOs — presentation layer
│   ├── <feature>.type.ts                      # @ObjectType('Xxx') class
│   └── dataloader/                            # batched per-request loaders (transport concern)
│       ├── dataloader.service.ts
│       └── dataloader.module.ts
├── common/graphql/gql-context.ts              # shared GqlContext type
└── modules/<feature>/                         # business modules — framework-agnostic ports + Prisma adapters
    ├── domain/
    │   ├── entities/<feature>.entity.ts       # pure TS POJO, NO decorators
    │   ├── interfaces/
    │   │   ├── <feature>.repository.ts        # abstract IXxxRepository (DI token)
    │   │   └── <feature>.service.ts           # abstract IXxxService (DI token)
    │   ├── dto/                               # @InputType + Zod schemas (input only)
    │   └── errors.ts                          # domain errors
    ├── application/services/<feature>.service.ts  # impl XxxService implements IXxxService — NO @Injectable, NO @nestjs/* imports
    ├── infrastructure/
    │   ├── repositories/<feature>.prisma-repository.ts  # impl XxxPrismaRepository implements IXxxRepository
    │   └── token/<adapter>.ts                 # framework adapters (e.g. jwt-token-signer.ts) — only when service needs framework primitives
    ├── <feature>.module.ts                    # NestJS wiring — useFactory + inject for services, useClass for repos/adapters
    ├── <feature>.service.spec.ts              # unit (mocked repo)
    ├── <feature>.integration.spec.ts          # testcontainers (service-level)
    └── index.ts                               # barrelsby-generated public API
```

**Transport lives at app root, NOT inside modules.** Modules expose services + repos as ports; resolvers/guards/types/dataloaders consume those ports. Lets you swap GraphQL → REST → gRPC without touching feature modules.

### Naming convention

| Layer      | Abstract (DI token) | Concrete                                   |
| ---------- | ------------------- | ------------------------------------------ |
| Service    | `IUserService`      | `UserService` (no `@Injectable()`)         |
| Repository | `IUserRepository`   | `UserPrismaRepository` (technology marker) |
| FW adapter | `ITokenSigner`      | `JwtTokenSigner` (technology marker)       |

`IXxx` prefix is intentional — abstract class doubles as both the contract type AND the NestJS DI token, so the prefix prevents name collision with the concrete class in the same module. Java/.NET-ish, but pragmatic given the dual role.

### Framework-agnostic domain + application

- **Domain layer (`domain/`)** — zero `@nestjs/*` imports. Entities are POJOs; abstract classes (`IXxxRepository`, `IXxxService`, `ITokenSigner`) are pure TS. Portable to any DI container or no DI at all.
- **Application services (`application/services/`)** — also zero `@nestjs/*` imports. **No `@Injectable()` decorator.** Constructor takes abstract dependencies; the class is plain TS.
- **All NestJS wiring lives in `<feature>.module.ts`** — services are registered via `useFactory` + explicit `inject:`:

  ```ts
  @Module({
    providers: [
      { provide: IUserRepository, useClass: UserPrismaRepository },
      {
        provide: IUserService,
        useFactory: (repo: IUserRepository) => new UserService(repo),
        inject: [IUserRepository],
      },
    ],
    exports: [IUserService, IUserRepository],
  })
  ```

- **Framework primitives (`JwtService`, `ConfigService`, etc.) never injected into application services.** Wrap behind a domain interface (e.g. `ITokenSigner`) and adapt in `infrastructure/<feature>/<adapter>.ts`.
- **`@Injectable()` is allowed on**: resolvers, Prisma repositories, dataloaders, guards, framework adapters (e.g. `JwtTokenSigner`) — anything in `infrastructure/`.
- **Never use `Symbol`/string DI tokens or `@Inject(TOKEN)` in service constructors** — abstract class as token is the single pattern.

### Strict rules

- **Domain entities are pure TS** — no `@ObjectType`, no `@Field`, no `@nestjs/graphql` import. Just data shape.
- **GraphQL DTOs in `src/graphql/`** (top-level, not inside modules) — `@ObjectType('Xxx')` preserves schema names; resolver-only fields (computed via DataLoader) are optional `?` here only.
- **Application services depend on `IXxxRepository`** — never `PrismaService` directly.
- **Prisma repos map row → entity** via `toUser/toPost/...` functions; password isolated via separate `UserCredentials` type and `findCredentialsByEmail` method.
- **Cross-module imports** use `@modules/<name>` (resolves via barrel `index.ts`); same-module uses relative paths.
- **Resolvers/prisma-repositories excluded from barrel** — internal only.
- **DataLoader** injects `IXxxRepository` of other modules, not Prisma.
- `barrelsby` regenerates `index.ts` files: `pnpm barrels` (after adding/moving public files).

### Other

- **GraphQL context** built via `forRootAsync` in `app.module.ts` — parses Bearer JWT, sets `req.user`, instantiates per-request DataLoaders. Toggle batching with header `x-disable-dataloader: 1`; demo plugin returns `extensions.queryCount` and `extensions.dataLoaderEnabled`.
- **`GqlAuthGuard`** custom guard checking `req.user`; passport intentionally not used.
- **Rate limiting**: `@nestjs/throttler` with custom `GqlThrottlerGuard` (bridges `GqlExecutionContext`); registered as `APP_GUARD` global default 100/min. Stricter `@Throttle` overrides on write mutations: `createPost` 20/min, `addComment` 30/min.
- **JWT secret**: `auth.module.ts` factory **fails fast** when `NODE_ENV === 'production'` and `JWT_SECRET` missing. Dev fallback `'change-me'`.
- **Prisma 7** uses new generator (`prisma-client`, output `prisma/generated/`) + driver adapter (`@prisma/adapter-pg`). Schema has NO `url` field; connection in `prisma.config.ts` + adapter at runtime.
- **DB naming**: tables/columns are **snake_case** (`users`, `posts`, `author_id`, `created_at`); Prisma client API stays camelCase via `@map`/`@@map` directives. Zero TS code changes from camelCase ↔ snake_case toggle.
- **Seed** deterministic (`node --import @swc-node/register/esm-register prisma/seed.ts`). Seeds 5 users, 20 posts, 40 comments, 10 follows, 54 likes. E2E follow scenarios depend on Alice NOT following Bob. If you change the follow graph, update e2e features.
- **Bundle**: `rolldown -c` outputs `apps/backend/dist/main.cjs` (~67 kB). `.cjs` extension because package.json has `"type": "module"`. Externalizes all bare specifiers. `@oxc-project/runtime` required.
- **Dev**: single process — `node --import @swc-node/register/esm-register --watch src/main.ts`. SWC handles decorator metadata (esbuild/tsx don't, so we don't use them). `.swcrc` outputs ESM (`module.type: es6`). `SWCRC=true` env forces .swcrc usage.

## Validation: nestjs-zod

Two patterns depending on argument shape:

### Object input (login/register)

```ts
// dto/register.input.ts
export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  password: z.string().min(6),
})
export type RegisterInputType = z.infer<typeof registerSchema>

@InputType()
export class RegisterInput implements RegisterInputType {
  @Field() name!: string
  @Field() email!: string
  @Field() password!: string
}

// resolver
register(@Args('input', new ZodValidationPipe(registerSchema)) input: RegisterInput) { ... }
```

### Scalar arg (createPost/addComment)

```ts
// modules/post/domain/dto/post-content.schema.ts
export const postContentSchema = z
  .string()
  .trim()
  .min(1, 'Content is required')
  .max(5000, 'Content must be 5000 characters or fewer')

// resolver
createPost(@Args('content', new ZodValidationPipe(postContentSchema)) content: string) { ... }
```

**Output**: plain `@ObjectType` classes in `src/graphql/*.type.ts`. Zod input validates client-supplied data; output trusts BE producers.

## Frontend architecture

- Each feature has a `hooks/` folder. **Components are render-only** — all state, mutations, navigation, validation in hooks.
- Forms use **React Hook Form + Zod**. Schemas exported alongside hook (e.g., `loginSchema` from `use-login.ts`).
- GraphQL hooks generated to `src/generated/graphql.ts`. Re-run `pnpm --filter frontend generate` after `.graphql` changes (BE must be running).
- Codegen plugin emits a `TypedDocumentString` class (injected via `@graphql-codegen/add`); `fetcher` accepts `string | { toString() }`.
- **React Query v5** with infinite query support; codegen flags `reactQueryVersion: 5`, `addInfiniteQuery: true`, `documentMode: 'string'`.
- **Tailwind 4** CSS-first via `@tailwindcss/vite`. No `tailwind.config.ts`, no PostCSS — theme tokens in `src/index.css` via `@theme`.

## Test commands

```bash
# from repo root
pnpm typecheck                          # 3/3 workspaces
pnpm --filter backend test:unit         # 106 unit specs (vitest.config.ts)
pnpm --filter backend test:integration  # 91 tests / 15 files (testcontainers, ~17s)
pnpm --filter backend test:coverage     # combined unit+integration with thresholds (vitest.coverage.config.ts)
pnpm test:e2e                           # 15 scenarios (needs BE+FE dev servers + seeded DB)
pnpm --filter frontend test             # 95 tests
```

## Coverage (current)

| Suite    | Statements | Branches | Functions | Lines | Threshold   |
| -------- | ---------- | -------- | --------- | ----- | ----------- |
| Backend  | **100%**   | **100%** | **100%**  | 100%  | 99/99/99/99 |
| Frontend | 98.3%      | 86.5%    | 95.1%     | 99.4% | 90/80/85/90 |

Backend coverage scope (via `vitest.coverage.config.ts`): all application services, domain (cursor + zod schemas), infrastructure (prisma-repos + token adapter), DataLoader, common request-context. **Excluded** (framework boilerplate or decorator-line attribution issues): resolvers (tested via `*.resolver.integration.spec.ts` + `*.resolver.spec.ts`), `prisma.service.ts`, `logger.config.ts`, `gql-throttler.guard.ts`, modules, entities, interfaces.

If a change would drop coverage below 99%, add tests instead of lowering thresholds.

## Tooling commands

```bash
pnpm format          # prettier write
pnpm lint            # oxlint
pnpm knip            # find unused exports/deps/files
pnpm barrels         # regenerate barrelsby index.ts files
pnpm docker:build    # build BE + FE docker images
pnpm docker:up       # full stack via docker compose
```

## Common pitfalls

1. **Stale dev processes** — `node --watch`, `swc-node` ghosts can hold port 4000/5173. Kill:
   ```bash
   pkill -9 -f 'node.*main.ts|swc-node|vite' ; lsof -ti:4000,5173 | xargs kill -9
   ```
2. **Vite cache mismatch after dep bumps** — `rm -rf apps/frontend/node_modules/.vite` then restart FE.
3. **Prisma generated client out of sync** — `pnpm --filter backend prisma:generate` after schema changes.
4. **Adding new public API to a module** — run `pnpm barrels` to regenerate `index.ts`. The barrelsby config excludes `*.spec.ts`, `*.integration.spec.ts`, `*.module.ts`, prisma-repositories, resolvers.
5. **Decorator metadata** — esbuild/tsx don't emit `design:paramtypes` reliably; NestJS DI breaks. Use SWC for any TS runtime (dev, seed). Don't switch dev to tsx.
6. **`type: module` interop** — rolldown bundle uses `.cjs` extension to bypass package type. If you change `output.file`, update `package.json` `start` script and `Dockerfile` CMD too.
7. **Knip false positives** — `@oxc-project/runtime`, `@prisma/client`, `pg`, `pino-pretty`, `@as-integrations/express5` are runtime/peer/string-ref deps. Already in `knip.json` `ignoreDependencies`.

## Things you must NOT do without asking

- Force-push to main
- Restore camelCase column names in DB without updating `@map`/`@@map` directives — Prisma client API stays camelCase, DB stays snake_case
- Bump `@tanstack/react-query` past 5 unless `@graphql-codegen/typescript-react-query` plugin supports it
- Bump TypeScript to 6 (ts-node 10.x rejects `ignoreDeprecations: "6.0"`)
- Remove `pnpm.overrides.typescript`
- Bring back `@nestjs/cli` or `nest start --watch`
- Re-introduce `tailwind.config.ts` or `postcss.config.js`
- Restore the `url = env("DATABASE_URL")` line in `schema.prisma` (Prisma 7 forbids)
- Re-add global `ValidationPipe` or `class-validator`/`class-transformer` (nestjs-zod per-arg is the pattern)
- Manually edit `prisma/generated/` or barrel `index.ts` files (run `pnpm barrels` instead)
- Switch dev server to `tsx watch` — esbuild lacks decorator metadata; NestJS DI breaks
- Re-add `concurrently + nodemon` dev orchestration — single-process swc-node is the pattern
- Duplicate path aliases across config files — single source in `tsconfig.json`
- Add `@Injectable()` to any class under `application/services/` — application stays framework-agnostic; wire via `useFactory` in module
- Inject NestJS framework classes (`JwtService`, `ConfigService`, etc.) directly into application services — wrap behind a domain interface (`ITokenSigner` pattern)
- Introduce `Symbol`/string DI tokens or `@Inject(TOKEN)` in service constructors — abstract class as token is the single pattern
- Import `@nestjs/*` from anywhere under `domain/` or `application/` — those layers must stay framework-agnostic

## Plans + reports

- `plans/260423-2340-looper/` — initial implementation plan
- `plans/260424-0551-backend-clean-architecture/` — clean-arch refactor (DONE)
- `plans/reports/` — task reports (see `tester-260427-1025-backend-coverage-boost.md` for latest coverage push)

When asked to plan, prefer concise phase files (≤80 lines each) and link from a top-level `plan.md` overview.
