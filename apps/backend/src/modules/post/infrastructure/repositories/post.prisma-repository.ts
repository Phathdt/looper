import type { FeedCursor } from '@modules/feed'
import { PrismaService } from '@modules/prisma'
import { Injectable } from '@nestjs/common'

import type { Post as PrismaPost } from '../../../../../prisma/generated/client'
import type { Post } from '../../domain/entities/post.entity'
import { IPostRepository } from '../../domain/interfaces/post.repository'

function toPost(row: PrismaPost): Post {
  return {
    id: row.id,
    content: row.content,
    createdAt: row.createdAt,
    authorId: row.authorId,
  }
}

@Injectable()
export class PostPrismaRepository implements IPostRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Post | null> {
    const row = await this.prisma.post.findUnique({ where: { id } })
    return row ? toPost(row) : null
  }

  async create(authorId: string, content: string): Promise<Post> {
    const row = await this.prisma.post.create({ data: { authorId, content } })
    return toPost(row)
  }

  async findByAuthor(authorId: string, first: number): Promise<Post[]> {
    const rows = await this.prisma.post.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
      take: first,
    })
    return rows.map(toPost)
  }

  async findFeedPage(authorIds: string[], take: number, after?: FeedCursor): Promise<Post[]> {
    const rows = await this.prisma.post.findMany({
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
    return rows.map(toPost)
  }
}
