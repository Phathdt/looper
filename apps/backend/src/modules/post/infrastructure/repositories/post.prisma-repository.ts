import { Injectable } from '@nestjs/common'

import type { Post as PrismaPost } from '../../../../../prisma/generated/client'
import type { FeedCursor } from '../../../feed/domain/feed-cursor'
import { PrismaService } from '../../../prisma/prisma.service'
import { PostRepository } from '../../domain/interfaces/post.repository'

@Injectable()
export class PostPrismaRepository implements PostRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<PrismaPost | null> {
    return this.prisma.post.findUnique({ where: { id } })
  }

  create(authorId: string, content: string): Promise<PrismaPost> {
    return this.prisma.post.create({ data: { authorId, content } })
  }

  findByAuthor(authorId: string, first: number): Promise<PrismaPost[]> {
    return this.prisma.post.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
      take: first,
    })
  }

  findFeedPage(authorIds: string[], take: number, after?: FeedCursor): Promise<PrismaPost[]> {
    return this.prisma.post.findMany({
      where: {
        authorId: { in: authorIds },
        ...(after && {
          OR: [
            { createdAt: { lt: new Date(after.createdAt) } },
            { createdAt: new Date(after.createdAt), id: { lt: after.id } },
          ],
        }),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
    })
  }
}
