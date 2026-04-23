import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { decodeCursor, encodeCursor } from "./feed.cursor";

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  async feed(viewerId: string, first = 10, after?: string) {
    const take = Math.min(Math.max(first, 1), 50);

    const following = await this.prisma.follow.findMany({
      where: { followerId: viewerId },
      select: { followingId: true },
    });
    const authorIds = [viewerId, ...following.map((f) => f.followingId)];

    const decoded = after ? decodeCursor(after) : undefined;

    const posts = await this.prisma.post.findMany({
      where: {
        authorId: { in: authorIds },
        ...(decoded && {
          OR: [
            { createdAt: { lt: new Date(decoded.createdAt) } },
            { createdAt: new Date(decoded.createdAt), id: { lt: decoded.id } },
          ],
        }),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: take + 1,
    });

    const hasNextPage = posts.length > take;
    const nodes = hasNextPage ? posts.slice(0, take) : posts;
    const endCursor = nodes.length > 0 ? encodeCursor(nodes[nodes.length - 1]) : null;

    return {
      edges: nodes.map((node) => ({ cursor: encodeCursor(node), node })),
      pageInfo: { hasNextPage, endCursor },
    };
  }
}
