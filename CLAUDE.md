# CLAUDE.md

Notes for Claude Code working in this repo.

## Repo at a glance

Turborepo monorepo. Three apps + one shared package:

```
apps/backend     NestJS 11 + Apollo 5 + Prisma 7 + Zod
apps/frontend    React 19 + Vite 8 + Tailwind 4
apps/e2e         Cucumber + Playwright
packages/tsconfig @looper/tsconfig — shared TS presets + bundles typescript/ts-node/@types/node
```

## Conventions

- **Package manager**: pnpm 10. `pnpm.overrides.typescript: ^5.9.3` in root — do not bump TS to 6 (tooling churn, see "Things you must NOT do").
- **File names**: kebab-case for `.ts/.tsx/.js/.py/.sh`.
- **Tests**: colocated Go-style.
  - Unit: `*.spec.ts` next to source (BE) and `*.test.ts(x)` next to source (FE)
  - **BE integration**: `*.integration.spec.ts` colocated next to module (e.g., `auth/auth.integration.spec.ts`); shared `setup-postgres.ts` at `src/test-utils/`. Run via separate `vitest.integration.config.ts`.
  - FE shared test infra in `apps/frontend/test/{setup,test-utils,vitest.d}.ts` accessed via `@test/*` alias.
- **Lint**: oxlint v1. ~13 pre-existing warnings exist; do not introduce new errors.
- **Prettier**: 120 col, **single quote, no semi**, trailing commas, `@ianvs/prettier-plugin-sort-imports` (groups: react → @scope → @/ → bare → relative).
- **Path aliases (BE)**: `@modules/*` → `src/modules/*`, `@common/*` → `src/common/*`. Configured in `tsconfig.json`, `rolldown.config.ts`, `vitest.config.ts`, `vitest.integration.config.ts`.

## Backend architecture (clean architecture)

Each feature module under `apps/backend/src/modules/<feature>/`:

```
<feature>/
├── application/services/<feature>.service.ts        # use-cases, no Prisma
├── domain/
│   ├── entities/                                    # @ObjectType classes (GraphQL)
│   ├── dto/                                         # @InputType + Zod schemas
│   ├── interfaces/<feature>.repository.ts           # abstract class (DI token)
│   └── errors.ts                                    # domain errors
├── infrastructure/
│   ├── repositories/<feature>.prisma-repository.ts  # @Injectable Prisma impl
│   └── resolvers/<feature>.resolver.ts              # GraphQL transport
├── <feature>.module.ts                              # NestJS wiring
├── <feature>.service.spec.ts                        # unit (in-memory repo)
├── <feature>.integration.spec.ts                    # testcontainers
└── index.ts                                         # barrelsby-generated public API
```

**Strict rules:**

- Application layer **never imports `PrismaService`** — depends on `Repository` abstract classes
- Cross-module imports use `@modules/<name>` (resolves via barrel `index.ts`)
- Resolver/repository implementations are **excluded** from barrel — internal only
- DataLoader (`src/modules/dataloader/`) injects repositories of other modules, not Prisma
- `barrelsby` regenerates `index.ts` files: `pnpm barrels` (after adding/moving public files)

**Other:**

- **GraphQL context** built via `forRootAsync` in `app.module.ts` — parses Bearer JWT, sets `req.user`, instantiates per-request DataLoaders.
- **`GqlAuthGuard`** custom guard checking `req.user`; passport intentionally not used.
- **Prisma 7** uses new generator (`prisma-client`, output `prisma/generated/`) + driver adapter (`@prisma/adapter-pg`). Schema has NO `url` field; connection in `prisma.config.ts` + adapter at runtime.
- **Seed** deterministic. E2E follow scenarios depend on Alice NOT following Bob. If you change the follow graph, update e2e features.
- **Bundle**: `rolldown -c` outputs `apps/backend/dist/main.js` (~64 kB). Externalizes all bare specifiers. `@oxc-project/runtime` required (decorator metadata helpers).
- **Dev**: `concurrently('rolldown -c -w', 'nodemon')`. nodemon watches `dist/`, 300ms debounce. Don't use `nest start --watch` — `@nestjs/cli` is intentionally not installed.

## DTOs use Zod

Pattern (input):

```ts
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

Resolver:

```ts
register(@Args('input', new ZodValidationPipe(registerSchema)) input: RegisterInput) { ... }
```

`ZodValidationPipe` at `src/common/zod-validation.pipe.ts`. **No global `ValidationPipe`**, no `class-validator` / `class-transformer` deps.

**Output entities use plain `@ObjectType` classes** — Zod adds no value at output boundaries (BE-produced).

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
pnpm test                               # turbo: BE (37) + FE (91)
pnpm --filter backend test:unit         # 13 unit specs
pnpm --filter backend test:integration  # 24 integration specs (testcontainers, slow)
pnpm test:e2e                           # 13 scenarios (needs servers running)

pnpm --filter backend test:coverage     # 100/96/100/100
pnpm --filter frontend test:coverage    # 98/87/95/99
```

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

1. **Stale dev processes** — `node --watch`, `rolldown -w`, `nodemon` ghosts can hold port 4000/5173. Kill:
   ```bash
   pkill -9 -f 'rolldown|nodemon|concurrently' ; lsof -ti:4000,5173 | xargs kill -9
   ```
2. **Vite cache mismatch after dep bumps** — `rm -rf apps/frontend/node_modules/.vite` then restart FE.
3. **Prisma generated client out of sync** — `pnpm --filter backend prisma:generate` after schema changes.
4. **Adding new public API to a module** — run `pnpm barrels` to regenerate `index.ts`. The barrelsby config excludes `*.spec.ts`, `*.integration.spec.ts`, `*.module.ts`, prisma-repositories, resolvers.
5. **Bulk import refactor** — careful with sed: `'../../../prisma/...'` could match both `src/modules/prisma/` AND `apps/backend/prisma/generated/`. The latter must NOT be replaced with `@modules/prisma`.
6. **Test file renames in colocated layout** — replace relative `../test-utils` with `@test/test-utils` (FE).
7. **Knip false positives** — `@oxc-project/runtime`, `@prisma/client`, `pg`, `pino-pretty`, `ts-node`, `@as-integrations/express5` are runtime/peer/string-ref deps. Already in `knip.json` `ignoreDependencies`.

## Things you must NOT do without asking

- Force-push to main (already done once to rewrite author — don't repeat)
- Bump `@tanstack/react-query` past 5 unless `@graphql-codegen/typescript-react-query` plugin supports it
- Bump TypeScript to 6 (ts-node 10.x rejects `ignoreDeprecations: "6.0"`)
- Remove `pnpm.overrides.typescript`
- Bring back `@nestjs/cli` or `nest start --watch`
- Re-introduce `tailwind.config.ts` or `postcss.config.js`
- Restore the `url = env("DATABASE_URL")` line in `schema.prisma` (Prisma 7 forbids)
- Re-add global `ValidationPipe` (Zod pipe per-arg is the pattern)
- Add `class-validator` / `class-transformer` back
- Manually edit `prisma/generated/` or barrel `index.ts` files (run `pnpm barrels` instead)

## Plans + reports

- `plans/260423-2340-looper/` — initial implementation plan (6 phases, completed)
- `plans/260424-0551-backend-clean-architecture/` — clean-arch refactor plan (DONE)
- `plans/reports/` — task reports

When asked to plan, prefer concise phase files (≤80 lines each) and link from a top-level `plan.md` overview.

## Coverage thresholds (`vitest.config.ts`)

- Backend: 80/75/80/80 (currently 100/96/100/100)
- Frontend: 90/80/85/90 (currently 98/87/95/99)

If a change would lower these, add tests instead of dropping thresholds.
