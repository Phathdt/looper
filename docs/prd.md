# 📘 PRD — Social Feed GraphQL (Mini) — Fullstack (BE + FE)

---

## 1. Overview

### Objective

Build a mini social network fullstack application to demonstrate:

- GraphQL schema design
- Resolver architecture in NestJS
- N+1 problem & DataLoader optimization
- Prisma ORM usage
- Frontend integration with React + GraphQL + React Query
- End-to-end type safety via code generation

---

## 2. Project Structure

Monorepo quản lý bởi **Turborepo** + **pnpm workspaces**.

```bash
root/
  apps/
    backend/          # NestJS GraphQL API
    frontend/         # React + Vite
  packages/
    tsconfig/         # shared tsconfig presets (optional)
    eslint-config/    # shared lint config (optional)
  turbo.json
  pnpm-workspace.yaml
  package.json
```

### Turborepo Pipeline

`turbo.json` định nghĩa các task chính:

- `dev` — chạy song song backend + frontend
- `build` — build theo dependency graph (backend build trước khi FE codegen nếu cần)
- `lint`, `test`, `type-check`
- `generate` — GraphQL codegen (phụ thuộc output schema của backend)

### Root Scripts

```bash
pnpm dev          # turbo run dev
pnpm build        # turbo run build
pnpm generate     # turbo run generate
pnpm lint         # turbo run lint
pnpm test         # turbo run test
```

### Workspace Filtering

```bash
pnpm --filter backend dev
pnpm --filter frontend dev
```

---

## 3. Tech Stack

### Monorepo Tooling

- Turborepo (task orchestration, remote cache)
- pnpm workspaces (package management)
- TypeScript (shared config via `packages/tsconfig`)

---

### Backend (`apps/backend`)

- NestJS
- GraphQL (Apollo)
- Prisma
- PostgreSQL
- DataLoader (N+1 optimization)
- JWT Auth

---

### Frontend (`apps/frontend`)

- React (Vite)
- React Query
- GraphQL Code Generator
- Fetch-based GraphQL client (custom fetcher)

---

## 4. Goals

### Primary Goals

- Implement GraphQL API with nested relations
- Demonstrate N+1 problem and solve using DataLoader
- Integrate frontend with generated hooks (no manual typing)
- Implement pagination and basic auth

---

### Non-Goals

- Realtime (subscriptions)
- File uploads
- Advanced UI/UX
- Microservices architecture

---

## 5. Core Features

### 5.1 Authentication

- Register
- Login (JWT)
- Inject user into GraphQL context

---

### 5.2 Feed

#### Query: `feed(first, after)`

- Returns posts from followed users
- Cursor-based pagination
- Sorted by `createdAt DESC`

---

### 5.3 User

#### Query: `user(id)`

Fields:

- id
- name
- followersCount
- isFollowing (viewer-based)
- posts

---

### 5.4 Post

Fields:

- id
- content
- author
- comments
- likesCount

Mutation:

- createPost(content)

---

### 5.5 Comment

Fields:

- id
- content
- author

Mutation:

- addComment(postId, content)

---

### 5.6 Follow System

Mutations:

- follow(userId)
- unfollow(userId)

---

## 6. GraphQL Schema (Simplified)

```graphql
type Query {
  feed(first: Int, after: String): PostConnection!
  user(id: ID!): User
}

type User {
  id: ID!
  name: String!
  posts(first: Int): [Post!]!
  followersCount: Int!
  isFollowing: Boolean!
}

type Post {
  id: ID!
  content: String!
  author: User!
  comments(first: Int): [Comment!]!
  likesCount: Int!
}

type Comment {
  id: ID!
  content: String!
  author: User!
}
```

---

## 7. Database Schema (Prisma)

```prisma
model User {
  id        String   @id @default(uuid())
  name      String
  posts     Post[]
  comments  Comment[]
}

model Post {
  id        String   @id @default(uuid())
  content   String
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  comments  Comment[]
}

model Comment {
  id       String @id @default(uuid())
  content  String
  postId   String
  authorId String
  author   User   @relation(fields: [authorId], references: [id])
}
```

---

## 8. N+1 Problem (Critical)

### Problem Scenario

Nested query:

```graphql
query {
  feed {
    edges {
      node {
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

### Issue

- Multiple DB calls per entity
- Exponential query growth

---

### Solution

Use DataLoader:

- `userLoader` → batch user queries
- `commentByPostLoader` → batch comments

---

## 9. Backend Architecture

### Layers

- Resolver
- Service
- Prisma Client
- DataLoader (per-request scope)

---

### Request Flow

1. GraphQL request
2. Resolver execution
3. DataLoader batching
4. Prisma DB query

---

## 10. Frontend Architecture

### Structure

```bash
apps/frontend/src/
  api/
    fetcher.ts
  graphql/
    *.graphql
  generated/
    graphql.ts
  features/
    feed/
    post/
    user/
```

---

### GraphQL Codegen Flow

1. Backend exposes schema
2. Frontend writes `.graphql` queries
3. Run:

```bash
pnpm generate
# hoặc chỉ cho frontend:
pnpm --filter frontend generate
```

4. Auto-generate:

- TypeScript types
- React Query hooks

---

### Example Usage

```ts
const { data, isLoading } = useFeedQuery();
```

---

## 11. Data Fetching Strategy

- Use React Query for:
  - caching
  - loading state
  - retry
  - pagination

- Use GraphQL Codegen for:
  - type-safe hooks
  - API contract sync

---

## 12. Pagination

- Cursor-based (GraphQL)
- Infinite scroll (React Query `useInfiniteQuery`)

---

## 13. Performance Requirements

- Eliminate N+1 queries
- Batch DB calls via DataLoader
- Optimize resolver execution

---

## 14. Deliverables

- Turborepo monorepo (`apps/backend` + `apps/frontend`)
- README including:
  - Monorepo setup (Turborepo + pnpm workspaces)
  - Architecture explanation
  - N+1 problem (before/after)
  - Setup guide
  - API examples

---

## 15. Success Criteria

- GraphQL nested queries working
- DataLoader reduces query count
- Frontend fully typed (no manual types)
- Clean modular structure
- FE consumes BE via generated hooks

---

## 16. Timeline (7 days)

### Day 1–2

- Prisma schema
- DB setup

### Day 3–4

- GraphQL schema + resolvers

### Day 5

- DataLoader (N+1 fix)

### Day 6

- Frontend setup + codegen integration

### Day 7

- Pagination + README + polish

---

## 17. Optional Enhancements

- Infinite scroll UI
- Like system
- Basic caching
- Logging query count (N+1 proof)

---

## 18. Key Selling Points (for CV)

- Solved N+1 problem using DataLoader
- Designed GraphQL schema with nested relations
- Implemented end-to-end type-safe API
- Integrated React Query with generated hooks
- Demonstrated real-world backend patterns

---
