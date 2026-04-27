import { IFollowRepository } from '@modules/follow'
import { IPostRepository } from '@modules/post'
import { Injectable } from '@nestjs/common'

import { decodeCursor, encodeCursor } from '../../domain/feed-cursor'
import { FeedPage, IFeedService } from '../../domain/interfaces/feed.service'

@Injectable()
export class FeedService implements IFeedService {
  constructor(
    private readonly posts: IPostRepository,
    private readonly follows: IFollowRepository,
  ) {}

  async feed(viewerId: string, first = 10, after?: string): Promise<FeedPage> {
    const take = Math.min(Math.max(first, 1), 50)

    const followingIds = await this.follows.listFollowingIds(viewerId)
    const authorIds = [viewerId, ...followingIds]

    const decoded = after ? decodeCursor(after) : undefined

    const rows = await this.posts.findFeedPage(authorIds, take + 1, decoded)

    const hasNextPage = rows.length > take
    const nodes = hasNextPage ? rows.slice(0, take) : rows
    const endCursor = nodes.length > 0 ? encodeCursor(nodes[nodes.length - 1]) : null

    return {
      edges: nodes.map((node) => ({ cursor: encodeCursor(node), node })),
      pageInfo: { hasNextPage, endCursor },
    }
  }
}
