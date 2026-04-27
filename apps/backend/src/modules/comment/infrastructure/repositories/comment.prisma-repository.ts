import { PrismaService } from '@modules/prisma'
import { Injectable } from '@nestjs/common'

import type { Comment as PrismaComment } from '../../../../../prisma/generated/client'
import type { Comment } from '../../domain/entities/comment.entity'
import { ICommentRepository } from '../../domain/interfaces/comment.repository'

function toComment(row: PrismaComment): Comment {
  return {
    id: row.id,
    content: row.content,
    createdAt: row.createdAt,
    authorId: row.authorId,
    postId: row.postId,
  }
}

@Injectable()
export class CommentPrismaRepository implements ICommentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(authorId: string, postId: string, content: string): Promise<Comment> {
    const row = await this.prisma.comment.create({ data: { authorId, postId, content } })
    return toComment(row)
  }

  async findByPostIds(postIds: readonly string[]): Promise<Comment[]> {
    const rows = await this.prisma.comment.findMany({
      where: { postId: { in: [...postIds] } },
      orderBy: { createdAt: 'asc' },
    })
    return rows.map(toComment)
  }
}
