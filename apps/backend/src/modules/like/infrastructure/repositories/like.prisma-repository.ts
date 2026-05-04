import { PrismaService } from '@modules/prisma'
import { Injectable } from '@nestjs/common'

import { ILikeRepository } from '../../domain/interfaces/like.repository'

@Injectable()
export class LikePrismaRepository implements ILikeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async like(userId: string, postId: string): Promise<void> {
    await this.prisma.like.upsert({
      where: { userId_postId: { userId, postId } },
      create: { userId, postId },
      update: {},
    })
  }

  async unlike(userId: string, postId: string): Promise<void> {
    await this.prisma.like.delete({ where: { userId_postId: { userId, postId } } }).catch(() => null)
  }

  async countByPostIds(postIds: readonly string[]): Promise<Map<string, number>> {
    if (postIds.length === 0) return new Map()
    const groups = await this.prisma.like.groupBy({
      by: ['postId'],
      where: { postId: { in: [...postIds] } },
      _count: { userId: true },
    })
    return new Map(groups.map((g) => [g.postId, g._count.userId]))
  }

  async likedByViewer(viewerId: string, postIds: readonly string[]): Promise<Set<string>> {
    if (postIds.length === 0) return new Set()
    const rows = await this.prisma.like.findMany({
      where: { userId: viewerId, postId: { in: [...postIds] } },
      select: { postId: true },
    })
    return new Set(rows.map((r) => r.postId))
  }
}
