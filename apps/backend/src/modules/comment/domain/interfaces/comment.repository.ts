import type { Comment as PrismaComment } from '../../../../../prisma/generated/client'

export abstract class CommentRepository {
  abstract create(authorId: string, postId: string, content: string): Promise<PrismaComment>
  abstract findByPostIds(postIds: readonly string[]): Promise<PrismaComment[]>
}
