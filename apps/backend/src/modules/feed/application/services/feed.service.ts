import { Injectable } from "@nestjs/common";
import { PostRepository } from "../../../post/domain/interfaces/post.repository";
import { FollowRepository } from "../../../follow/domain/interfaces/follow.repository";
import { decodeCursor, encodeCursor } from "../../domain/feed-cursor";

@Injectable()
export class FeedService {
  constructor(
    private readonly posts: PostRepository,
    private readonly follows: FollowRepository,
  ) {}

  async feed(viewerId: string, first = 10, after?: string) {
    const take = Math.min(Math.max(first, 1), 50);

    const followingIds = await this.follows.listFollowingIds(viewerId);
    const authorIds = [viewerId, ...followingIds];

    const decoded = after ? decodeCursor(after) : undefined;

    const rows = await this.posts.findFeedPage(authorIds, take + 1, decoded);

    const hasNextPage = rows.length > take;
    const nodes = hasNextPage ? rows.slice(0, take) : rows;
    const endCursor = nodes.length > 0 ? encodeCursor(nodes[nodes.length - 1]) : null;

    return {
      edges: nodes.map((node) => ({ cursor: encodeCursor(node), node })),
      pageInfo: { hasNextPage, endCursor },
    };
  }
}
