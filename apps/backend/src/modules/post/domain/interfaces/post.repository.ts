import type { Post as PrismaPost } from '../../../../../prisma/generated/client'
import type { FeedCursor } from '../../../feed/domain/feed-cursor'

export abstract class PostRepository {
  abstract findById(id: string): Promise<PrismaPost | null>
  abstract create(authorId: string, content: string): Promise<PrismaPost>
  abstract findByAuthor(authorId: string, first: number): Promise<PrismaPost[]>
  abstract findFeedPage(authorIds: string[], take: number, after?: FeedCursor): Promise<PrismaPost[]>
}
