import { describe, expect, it, beforeEach, vi } from "vitest";
import { FeedService } from "../../src/modules/feed/feed.service";
import { decodeCursor, encodeCursor } from "../../src/modules/feed/feed.cursor";
import type { PrismaService } from "../../src/modules/prisma/prisma.service";

const makePost = (i: number) => ({
  id: `p${i}`,
  content: `c${i}`,
  authorId: "u1",
  createdAt: new Date(2026, 0, 1, 0, 0, i),
});

function makeService(posts: ReturnType<typeof makePost>[]) {
  const prisma = {
    follow: { findMany: vi.fn(async () => []) },
    post: { findMany: vi.fn(async () => posts) },
  } as unknown as PrismaService;
  return { service: new FeedService(prisma), prisma };
}

describe("FeedService (unit)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns hasNextPage=false when result size <= take", async () => {
    const { service } = makeService([makePost(1), makePost(2)]);
    const result = await service.feed("u1", 10);
    expect(result.pageInfo.hasNextPage).toBe(false);
    expect(result.edges).toHaveLength(2);
  });

  it("returns hasNextPage=true and trims last when result size > take", async () => {
    const { service } = makeService([makePost(3), makePost(2), makePost(1)]);
    const result = await service.feed("u1", 2);
    expect(result.pageInfo.hasNextPage).toBe(true);
    expect(result.edges).toHaveLength(2);
  });

  it("each edge has cursor encoding node's createdAt+id", async () => {
    const { service } = makeService([makePost(1)]);
    const result = await service.feed("u1", 10);
    const decoded = decodeCursor(result.edges[0].cursor);
    expect(decoded.id).toBe("p1");
    expect(decoded.createdAt).toBe(makePost(1).createdAt.toISOString());
  });

  it("clamps first to [1,50]", async () => {
    const { service, prisma } = makeService([]);
    await service.feed("u1", 0);
    expect((prisma.post.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0].take).toBe(2);

    await service.feed("u1", 100);
    expect((prisma.post.findMany as ReturnType<typeof vi.fn>).mock.calls[1][0].take).toBe(51);
  });

  it("passes decoded cursor as WHERE filter", async () => {
    const { service, prisma } = makeService([]);
    const after = encodeCursor({ createdAt: new Date("2026-01-01T00:00:05Z"), id: "p5" });
    await service.feed("u1", 10, after);
    const where = (prisma.post.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0].where;
    expect(where.OR).toBeDefined();
    expect(where.OR[0].createdAt.lt).toBeInstanceOf(Date);
  });
});
