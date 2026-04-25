# 🔧 Frontend UI Stack Update

## 1. UI Stack (Updated)

Frontend sẽ sử dụng:

- React (Vite)
- React Query
- GraphQL Code Generator
- TailwindCSS
- shadcn/ui

---

## 2. UI Architecture

### Folder structure

Frontend nằm trong Turborepo tại `apps/frontend`:

```bash
apps/frontend/
  src/
    components/
      ui/           # shadcn components
    features/
      feed/
        components/
        hooks/
      post/
      user/
    graphql/
      queries/
      mutations/
    generated/
    lib/
      fetcher.ts
      utils.ts
  codegen.ts
  vite.config.ts
  package.json
```

---

## 3. Styling Strategy

### TailwindCSS

- Utility-first
- Không viết CSS thuần
- Tất cả layout + spacing dùng Tailwind

---

### shadcn/ui

Use for:

- Button
- Card
- Input
- Dialog
- Dropdown
- Skeleton (loading state)

👉 Lý do:

- copy-paste component → không phụ thuộc lib runtime
- dễ customize
- phù hợp demo project

---

## 4. UI Scope (không overbuild)

### Screens

#### 1. Feed Page

- List posts
- Infinite scroll
- Show:
  - author name
  - content
  - comments (simple)

---

#### 2. Create Post

- Text input
- Submit button

---

#### 3. User Profile (optional)

- user info
- list posts

---

## 5. Component Design

### Example: PostCard

```tsx
<PostCard>
  <Author />
  <Content />
  <Comments />
</PostCard>
```

---

### Reusable UI

- Button (shadcn)
- Card (shadcn)
- Skeleton (loading)

---

## 6. Data Layer

### Hooks (generated)

```ts
useFeedQuery()
useCreatePostMutation()
```

---

### Pattern

- UI component → call hook
- Không viết fetch logic

---

## 7. Loading Strategy

Use:

- Skeleton (shadcn)
- isLoading từ React Query

---

## 8. Error Handling

- show simple error text
- không cần toast phức tạp

---

## 9. Pagination

- useInfiniteQuery
- cursor-based pagination từ BE

---

## 10. Dev Experience

### Scripts

Chạy từ root (Turborepo sẽ orchestrate):

```bash
pnpm dev                        # chạy cả FE + BE
pnpm --filter frontend dev      # chỉ FE
pnpm --filter frontend generate
pnpm --filter frontend generate:watch
```

Hoặc `cd apps/frontend && pnpm dev`.

### Turborepo notes

- `generate` task của frontend phụ thuộc vào schema output của backend → khai báo `dependsOn: ["backend#build:schema"]` (hoặc export schema file) trong `turbo.json` để Turbo chạy đúng thứ tự và cache hiệu quả.
- Tận dụng `turbo` remote cache cho `build`, `lint`, `type-check` để CI nhanh hơn.

---

## 11. Non-Goals (UI)

- không cần responsive hoàn hảo
- không dark mode
- không animation phức tạp

---

## 12. Key Value

- build nhanh
- code clean
- đủ đẹp để demo
- không mất thời gian vào CSS

---
