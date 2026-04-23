import { Test, type TestingModule } from "@nestjs/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaModule } from "../../src/modules/prisma/prisma.module";
import { PrismaService } from "../../src/modules/prisma/prisma.service";
import { FeedModule } from "../../src/modules/feed/feed.module";
import { FeedService } from "../../src/modules/feed/feed.service";
import { startPostgres, stopPostgres } from "../setup-postgres";

describe("FeedService (integration)", () => {
  let moduleRef: TestingModule;
  let feed: FeedService;
  let prisma: PrismaService;
  let viewerId: string;

  beforeAll(async () => {
    await startPostgres();
    moduleRef = await Test.createTestingModule({ imports: [PrismaModule, FeedModule] }).compile();
    feed = moduleRef.get(FeedService);
    prisma = moduleRef.get(PrismaService);

    const viewer = await prisma.user.create({
      data: { name: "viewer", email: "viewer@t.dev", password: "x" },
    });
    viewerId = viewer.id;

    const followed = await prisma.user.create({
      data: { name: "other", email: "other@t.dev", password: "x" },
    });
    await prisma.follow.create({
      data: { followerId: viewerId, followingId: followed.id },
    });

    for (let i = 0; i < 15; i++) {
      await prisma.post.create({
        data: {
          content: `post ${i}`,
          authorId: followed.id,
          createdAt: new Date(Date.now() - i * 1000),
        },
      });
    }
  });

  afterAll(async () => {
    await moduleRef?.close();
    await stopPostgres();
  });

  it("returns first page with hasNextPage=true", async () => {
    const result = await feed.feed(viewerId, 10);
    expect(result.edges).toHaveLength(10);
    expect(result.pageInfo.hasNextPage).toBe(true);
    expect(result.pageInfo.endCursor).toBeTruthy();
  });

  it("paginates via cursor to second page", async () => {
    const page1 = await feed.feed(viewerId, 10);
    const page2 = await feed.feed(viewerId, 10, page1.pageInfo.endCursor!);
    expect(page2.edges.length).toBe(5);
    expect(page2.pageInfo.hasNextPage).toBe(false);

    const page1Ids = page1.edges.map((e) => e.node.id);
    const page2Ids = page2.edges.map((e) => e.node.id);
    expect(page1Ids.some((id) => page2Ids.includes(id))).toBe(false);
  });
});
