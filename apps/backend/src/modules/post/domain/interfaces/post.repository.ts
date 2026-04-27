import type { FeedCursor } from '@modules/feed'

import type { Post } from '../entities/post.entity'

export abstract class IPostRepository {
  abstract findById(id: string): Promise<Post | null>
  abstract create(authorId: string, content: string): Promise<Post>
  abstract findByAuthor(authorId: string, first: number): Promise<Post[]>
  abstract findFeedPage(authorIds: string[], take: number, after?: FeedCursor): Promise<Post[]>
}
