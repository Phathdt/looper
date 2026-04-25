import { PrismaService } from '@modules/prisma'
import { Injectable } from '@nestjs/common'

import type { Comment as PrismaComment } from '../../../../../prisma/generated/client'
import { CommentRepository } from '../../domain/interfaces/comment.repository'

@Injectable()
export class CommentPrismaRepository implements CommentRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(authorId: string, postId: string, content: string): Promise<PrismaComment> {
    return this.prisma.comment.create({ data: { authorId, postId, content } })
  }

  findByPostIds(postIds: readonly string[]): Promise<PrismaComment[]> {
    return this.prisma.comment.findMany({
      where: { postId: { in: [...postIds] } },
      orderBy: { createdAt: 'asc' },
    })
  }
}
