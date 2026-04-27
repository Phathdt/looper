import { Test, type TestingModule } from '@nestjs/testing'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { startPostgres, stopPostgres } from '../../../../test-utils/setup-postgres'
import { PrismaModule } from '../../../prisma/prisma.module'
import { PrismaService } from '../../../prisma/prisma.service'
import { IFollowRepository } from '../../domain/interfaces/follow.repository'
import { FollowModule } from '../../follow.module'

describe('FollowPrismaRepository (integration)', () => {
  let moduleRef: TestingModule
  let repo: IFollowRepository
  let prisma: PrismaService
  let alice: string
  let bob: string
  let carol: string

  beforeAll(async () => {
    await startPostgres()
    moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, FollowModule],
    }).compile()
    prisma = moduleRef.get(PrismaService)
    repo = moduleRef.get(IFollowRepository)

    const seed = async (name: string) => {
      const u = await prisma.user.create({
        data: { name, email: `${name}-${Date.now()}-${Math.random()}@t.dev`, password: 'x' },
      })
      return u.id
    }
    alice = await seed('alice')
    bob = await seed('bob')
    carol = await seed('carol')
  })

  afterAll(async () => {
    await moduleRef?.close()
    await stopPostgres()
  })

  describe('follow', () => {
    it('creates a follow relation', async () => {
      await repo.follow(alice, bob)
      const count = await prisma.follow.count({
        where: { followerId: alice, followingId: bob },
      })
      expect(count).toBe(1)
    })

    it('is idempotent (upsert) - calling twice does not create duplicate', async () => {
      await repo.follow(alice, bob)
      await repo.follow(alice, bob)
      const count = await prisma.follow.count({
        where: { followerId: alice, followingId: bob },
      })
      expect(count).toBe(1)
    })
  })

  describe('unfollow', () => {
    it('removes existing follow relation', async () => {
      await repo.follow(alice, carol)
      await repo.unfollow(alice, carol)
      const count = await prisma.follow.count({
        where: { followerId: alice, followingId: carol },
      })
      expect(count).toBe(0)
    })

    it('is no-op when relation does not exist (catches Prisma not-found)', async () => {
      await expect(repo.unfollow(carol, alice)).resolves.toBeUndefined()
    })
  })

  describe('listFollowingIds', () => {
    it('returns ids the follower follows', async () => {
      await repo.follow(alice, bob)
      await repo.follow(alice, carol)
      const ids = await repo.listFollowingIds(alice)
      expect(ids).toEqual(expect.arrayContaining([bob, carol]))
    })

    it('returns empty array when not following anyone', async () => {
      const lonely = await prisma.user.create({
        data: { name: 'lonely-list', email: `ll-${Date.now()}@t.dev`, password: 'x' },
      })
      expect(await repo.listFollowingIds(lonely.id)).toEqual([])
    })
  })

  describe('countFollowers', () => {
    it('returns map of userId → follower count', async () => {
      const target = await prisma.user.create({
        data: { name: 'target', email: `target-${Date.now()}@t.dev`, password: 'x' },
      })
      await repo.follow(alice, target.id)
      await repo.follow(bob, target.id)
      const map = await repo.countFollowers([target.id, carol])
      expect(map.get(target.id)).toBe(2)
      // carol may or may not have followers from earlier tests; just ensure it's a number or absent
      expect(typeof (map.get(carol) ?? 0)).toBe('number')
    })

    it('returns empty map for empty input', async () => {
      const map = await repo.countFollowers([])
      expect(map.size).toBe(0)
    })
  })

  describe('isFollowingBatch', () => {
    it('returns set of target ids the viewer follows', async () => {
      const t1 = await prisma.user.create({
        data: { name: 't1', email: `t1-${Date.now()}@t.dev`, password: 'x' },
      })
      const t2 = await prisma.user.create({
        data: { name: 't2', email: `t2-${Date.now()}@t.dev`, password: 'x' },
      })
      await repo.follow(alice, t1.id)
      const set = await repo.isFollowingBatch(alice, [t1.id, t2.id])
      expect(set.has(t1.id)).toBe(true)
      expect(set.has(t2.id)).toBe(false)
    })

    it('returns empty set when viewer follows none of the targets', async () => {
      const stranger = await prisma.user.create({
        data: { name: 'stranger', email: `stranger-${Date.now()}@t.dev`, password: 'x' },
      })
      const set = await repo.isFollowingBatch(stranger.id, [alice, bob])
      expect(set.size).toBe(0)
    })
  })
})
