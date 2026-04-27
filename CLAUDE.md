# CLAUDE.md

Notes for Claude Code working in this repo.

## Repo at a glance

Turborepo monorepo. Three apps + one shared package:

```
apps/backend     NestJS 11 + Apollo 5 + Prisma 7 + Zod (nestjs-zod)
apps/frontend    React 19 + Vite 8 + Tailwind 4
apps/e2e         Cucumber + Playwright
packages/tsconfig @looper/tsconfig — shared TS presets
```

## Conventions

- **Package manager**: pnpm 10. `pnpm.overrides.typescript: ^5.9.3` in root — do not bump TS to 6 (tooling churn, see "Things you must NOT do").
- **File names**: kebab-case for `.ts/.tsx/.js/.py/.sh`.
- **Tests**: colocated Go-style.
  - Unit: `*.spec.ts` next to source (BE) and `*.test.ts(x)` next to source (FE)
  - **BE integration**: `*.integration.spec.ts` colocated next to module (e.g., `auth/auth.integration.spec.ts`, `user/infrastructure/repositories/user.prisma-repository.integration.spec.ts`); shared `setup-postgres.ts` at `src/test-utils/`. Run via separate `vitest.integration.config.ts`.
  - FE shared test infra in `apps/frontend/test/{setup,test-utils,vitest.d}.ts` accessed via `@test/*` alias.
- **Lint**: oxlint v1. 0 warnings / 0 errors target. `import/no-unassigned-import` disabled (legitimate side-effect imports).
- **Prettier**: 120 col, **single quote, no semi**, trailing commas, `@ianvs/prettier-plugin-sort-imports` (groups: react → @scope → @/ → bare → relative).
- **Path aliases (BE)**: `@modules/*` → `src/modules/*`, `@common/*` → `src/common/*`. **Single source: `tsconfig.json`**. Vitest reads via `vite-tsconfig-paths` plugin; rolldown via `resolve.tsconfigFilename`; swc-node-register reads tsconfig automatically.

## Backend architecture (3-layer clean architecture)

Each feature module under `apps/backend/src/modules/<feature>/`:

```
<feature>/
├── domain/
│   ├── entities/<feature>.entity.ts          # pure TS interface (POJO, NO decorators)
│   ├── interfaces/
│   │   ├── <feature>.repository.ts           # abstract IXxxRepository (DI token)
│   │   └── <feature>.service.ts              # abstract IXxxService (DI token)
│   ├── dto/                                  # @InputType + Zod schemas (input only)
│   └── errors.ts                             # domain errors
├── application/services/<feature>.service.ts # impl XxxService implements IXxxService
├── infrastructure/
│   ├── graphql/<feature>.type.ts             # @ObjectType('Xxx') GraphQL DTO
│   ├── repositories/<feature>.prisma-repository.ts  # impl XxxPrismaRepository implements IXxxRepository
│   └── resolvers/<feature>.resolver.ts       # GraphQL transport (uses *Type for schema)
├── <feature>.module.ts                       # NestJS wiring (provide IXxx, useClass Xxx)
├── <feature>.service.spec.ts                 # unit (mocked repo)
├── <feature>.integration.spec.ts             # testcontainers (service-level)
└── index.ts                                  # barrelsby-generated public API
```

### Naming convention

| Layer      | Abstract (DI token) | Concrete                                   |
| ---------- | ------------------- | ------------------------------------------ |
| Service    | `IUserService`      | `UserService`                              |
| Repository | `IUserRepository`   | `UserPrismaRepository` (technology marker) |

### Strict rules

- **Domain entities are pure TS** — no `@ObjectType`, no `@Field`, no `@nestjs/graphql` import. Just data shape.
- **GraphQL DTOs in `infrastructure/graphql/`** — `@ObjectType('Xxx')` preserves schema names; resolver-only fields (computed via DataLoader) are optional `?` here only.
- **Application services depend on `IXxxRepository`** — never `PrismaService` directly.
- **Prisma repos map row → entity** via `toUser/toPost/...` functions; password isolated via separate `UserCredentials` type and `findCredentialsByEmail` method.
- **Cross-module imports** use `@modules/<name>` (resolves via barrel `index.ts`); same-module uses relative paths.
- **Resolvers/prisma-repositories excluded from barrel** — internal only.
- **DataLoader** injects `IXxxRepository` of other modules, not Prisma.
- `barrelsby` regenerates `index.ts` files: `pnpm barrels` (after adding/moving public files).

### Other

- **GraphQL context** built via `forRootAsync` in `app.module.ts` — parses Bearer JWT, sets `req.user`, instantiates per-request DataLoaders.
- **`GqlAuthGuard`** custom guard checking `req.user`; passport intentionally not used.
- **Prisma 7** uses new generator (`prisma-client`, output `prisma/generated/`) + driver adapter (`@prisma/adapter-pg`). Schema has NO `url` field; connection in `prisma.config.ts` + adapter at runtime.
- **Seed** deterministic (`node --import @swc-node/register/esm-register prisma/seed.ts`). E2E follow scenarios depend on Alice NOT following Bob. If you change the follow graph, update e2e features.
- **Bundle**: `rolldown -c` outputs `apps/backend/dist/main.cjs` (~67 kB). `.cjs` extension because package.json has `"type": "module"`. Externalizes all bare specifiers. `@oxc-project/runtime` required.
- **Dev**: single process — `node --import @swc-node/register/esm-register --watch src/main.ts`. SWC handles decorator metadata (esbuild/tsx don't, so we don't use them). `.swcrc` outputs ESM (`module.type: es6`). `SWCRC=true` env forces .swcrc usage.

## Validation: nestjs-zod

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
```

```ts
// resolver
import { ZodValidationPipe } from 'nestjs-zod'

register(@Args('input', new ZodValidationPipe(registerSchema)) input: RegisterInput) { ... }
```

**Output**: plain `@ObjectType` classes in `infrastructure/graphql/*.type.ts`. Zod input validates client-supplied data; output trusts BE producers.

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
pnpm --filter backend test:unit         # 13 unit specs
pnpm --filter backend test:integration  # 8 files / 63 tests (testcontainers, ~9s)
pnpm test:e2e                           # 13 scenarios (needs BE+FE dev servers + seeded DB)
pnpm --filter frontend test             # 91 tests
```

## Coverage (current)

| Suite                  | Statements | Branches | Functions  | Lines  | Threshold   |
| ---------------------- | ---------- | -------- | ---------- | ------ | ----------- |
| BE integration         | 96.61%     | 91.17%   | **95.71%** | 97.82% | 80/75/80/80 |
| Prisma repos (4 files) | 100%       | 100%     | 100%       | 100%   | —           |
| FE coverage            | 98.26%     | 86.48%   | 95.08%     | 99.38% | 90/80/85/90 |

```bash
pnpm vitest run --coverage --coverage.thresholds=false --config vitest.integration.config.ts  # BE int
pnpm --filter frontend test:coverage
```

If a change would drop coverage below threshold, add tests instead of lowering thresholds.

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

## Plans + reports

- `plans/260423-2340-looper/` — initial implementation plan
- `plans/260424-0551-backend-clean-architecture/` — clean-arch refactor (DONE)
- `plans/reports/` — task reports (see `tester-260427-1025-backend-coverage-boost.md` for latest coverage push)

When asked to plan, prefer concise phase files (≤80 lines each) and link from a top-level `plan.md` overview.
