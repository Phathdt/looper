import { PrismaService } from '@modules/prisma'
import { Injectable } from '@nestjs/common'

import { IFollowRepository } from '../../domain/interfaces/follow.repository'

@Injectable()
export class FollowPrismaRepository implements IFollowRepository {
  constructor(private readonly prisma: PrismaService) {}

  async follow(followerId: string, followingId: string): Promise<void> {
    await this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {},
    })
  }

  async unfollow(followerId: string, followingId: string): Promise<void> {
    await this.prisma.follow
      .delete({ where: { followerId_followingId: { followerId, followingId } } })
      .catch(() => null)
  }

  async listFollowingIds(followerId: string): Promise<string[]> {
    const rows = await this.prisma.follow.findMany({
      where: { followerId },
      select: { followingId: true },
    })
    return rows.map((r) => r.followingId)
  }

  async countFollowers(userIds: readonly string[]): Promise<Map<string, number>> {
    const groups = await this.prisma.follow.groupBy({
      by: ['followingId'],
      where: { followingId: { in: [...userIds] } },
      _count: { followerId: true },
    })
    return new Map(groups.map((g) => [g.followingId, g._count.followerId]))
  }

  async isFollowingBatch(viewerId: string, targetIds: readonly string[]): Promise<Set<string>> {
    const follows = await this.prisma.follow.findMany({
      where: { followerId: viewerId, followingId: { in: [...targetIds] } },
      select: { followingId: true },
    })
    return new Set(follows.map((f) => f.followingId))
  }
}
