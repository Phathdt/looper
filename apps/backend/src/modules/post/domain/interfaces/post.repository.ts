import type { FeedCursor } from '@modules/feed'

import type { Post as PrismaPost } from '../../../../../prisma/generated/client'

export abstract class PostRepository {
  abstract findById(id: string): Promise<PrismaPost | null>
  abstract create(authorId: string, content: string): Promise<PrismaPost>
  abstract findByAuthor(authorId: string, first: number): Promise<PrismaPost[]>
  abstract findFeedPage(authorIds: string[], take: number, after?: FeedCursor): Promise<PrismaPost[]>
}
