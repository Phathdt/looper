# CLAUDE.md

Notes for Claude Code working in this repo.

## Repo at a glance

Turborepo monorepo. Three apps + one shared package:

```
apps/backend     NestJS 11 + Apollo 5 + Prisma 7
apps/frontend    React 19 + Vite 8 + Tailwind 4
apps/e2e         Cucumber + Playwright
packages/tsconfig @looper/tsconfig — shared TS presets + bundles typescript/ts-node/@types/node
```

## Conventions

- **Package manager**: pnpm 10. `pnpm.overrides.typescript: ^5.9.3` is in root package.json — do not bump TS to 6 unless you also drop `@nestjs/cli` (which bundles its own TS) and pin matching `ignoreDeprecations`.
- **File names**: kebab-case for `.ts/.tsx/.js/.py/.sh`.
- **Tests**: colocated Go-style (`*.test.ts` / `*.spec.ts` next to source). BE integration tests live separately under `apps/backend/test/integration/` with shared `setup-postgres.ts` (testcontainers). FE shared infra in `apps/frontend/test/{setup,test-utils,vitest.d}.ts` accessed via `@test/*` alias.
- **Lint**: oxlint v1. 13 pre-existing warnings exist; do not introduce new errors. Don't add a permissive rule without asking.
- **Prettier**: 100 col, double quotes, semi.

## Frontend architecture

- Each feature has a `hooks/` folder. **Components are render-only** — all state, mutations, navigation, validation live in hooks.
- Forms use **React Hook Form + Zod**. Schemas live next to the hook (e.g., `loginSchema` exported from `use-login.ts`).
- GraphQL hooks are generated to `src/generated/graphql.ts`. Re-run `pnpm --filter frontend generate` whenever a `.graphql` document or BE schema changes (BE must be running).
- The codegen plugin emits a `TypedDocumentString` class wrapping query strings; `fetcher` accepts `string | { toString() }`. Don't change this without updating the codegen `add` plugin preamble.

## Backend architecture

- Modules under `apps/backend/src/modules/{auth,user,post,comment,follow,feed,dataloader,prisma,graphql}`.
- **GraphQL context** is built in `app.module.ts` via `forRootAsync` — it parses Bearer JWT, sets `req.user`, and instantiates per-request DataLoaders.
- **`GqlAuthGuard`** is a custom guard checking `req.user`; passport is intentionally not used.
- **Prisma 7** uses the new generator (`prisma-client`, output `prisma/generated/`) + driver adapter (`@prisma/adapter-pg`). Schema has no `url` field; connection comes from `prisma.config.ts` + adapter at runtime. Don't restore the `url` line.
- **Seed** is deterministic. Tests (especially e2e follow scenarios) depend on Alice NOT following Bob. If you change the follow graph, update the e2e features.
- **Bundle**: `rolldown -c` outputs `apps/backend/dist/main.js`. Externalizes all bare specifiers. `@oxc-project/runtime` is required (decorator metadata helpers).
- **Dev**: `concurrently('rolldown -c -w', 'nodemon')`. nodemon watches `dist/`, 300ms debounce. Don't use `nest start --watch` — `@nestjs/cli` is intentionally not installed.

## Test commands

```bash
# from repo root
pnpm typecheck                       # 3/3 workspaces
pnpm test                            # BE (37) + FE (91)
pnpm --filter backend test:unit      # 13 colocated unit specs
pnpm --filter backend test:integration  # 24 testcontainer specs (slow)
pnpm test:e2e                        # 13 scenarios (needs `pnpm dev` running)

pnpm --filter backend test:coverage  # 100/96/100/100
pnpm --filter frontend test:coverage # 98/87/95/99
```

## Common pitfalls

1. **Stale dev processes** — `node --watch`, `rolldown -w`, `nodemon` ghosts can hold port 4000/5173. Kill with:
   ```bash
   pkill -9 -f 'rolldown|nodemon|concurrently' ; lsof -ti:4000,5173 | xargs kill -9
   ```
2. **Vite cache mismatch after dep bumps** — clear with `rm -rf apps/frontend/node_modules/.vite` then restart FE.
3. **Prisma generated client out of sync** — rerun `pnpm --filter backend prisma:generate` after schema changes.
4. **Test file renames break imports** — when moving tests in colocated layout, replace relative `../test-utils` with `@test/test-utils`.
5. **Port forwarding & MCP servers** — Atlassian/Datadog MCPs are configured at user level, not project. They are non-essential.

## Things you must NOT do without asking

- Force-push to main (already done once to rewrite author — don't repeat)
- Bump `@tanstack/react-query` past 5 unless `@graphql-codegen/typescript-react-query` plugin supports it (currently emits v5 with `reactQueryVersion: 5` flag).
- Bump TypeScript to 6 (see Conventions above)
- Remove `pnpm.overrides.typescript`
- Bring back `@nestjs/cli` or `nest start --watch`
- Re-introduce `tailwind.config.ts` or `postcss.config.js` (Tailwind 4 is CSS-first)

## Plans + reports

- `plans/260423-2340-looper/` — initial implementation plan (6 phases)
- `plans/260424-0551-backend-clean-architecture/` — clean-arch refactor plan (NOT yet implemented)
- `plans/reports/` — task reports

When asked to plan, prefer concise phase files (≤80 lines each) and link from a top-level `plan.md` overview.

## Coverage thresholds (`vitest.config.ts`)

- Backend: 90/85/85/90 (currently 100/96/100/100)
- Frontend: 90/80/85/90 (currently 98/87/95/99)

If a change would lower these, add tests instead of dropping thresholds.
