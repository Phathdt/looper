import { Test, type TestingModule } from '@nestjs/testing'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { startPostgres, stopPostgres } from '../../../../test-utils/setup-postgres'
import { PrismaModule } from '../../../prisma/prisma.module'
import { PrismaService } from '../../../prisma/prisma.service'
import { ILikeRepository } from '../../domain/interfaces/like.repository'
import { LikeModule } from '../../like.module'

describe('LikePrismaRepository (integration)', () => {
  let moduleRef: TestingModule
  let repo: ILikeRepository
  let prisma: PrismaService
  let alice: string
  let bob: string
  let post1: string
  let post2: string

  beforeAll(async () => {
    await startPostgres()
    moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, LikeModule],
    }).compile()
    prisma = moduleRef.get(PrismaService)
    repo = moduleRef.get(ILikeRepository)

    const seedUser = async (name: string) => {
      const u = await prisma.user.create({
        data: { name, email: `${name}-${Date.now()}-${Math.random()}@t.dev`, password: 'x' },
      })
      return u.id
    }
    alice = await seedUser('alice')
    bob = await seedUser('bob')

    const seedPost = async (authorId: string, content: string) => {
      const p = await prisma.post.create({ data: { authorId, content } })
      return p.id
    }
    post1 = await seedPost(alice, 'p1')
    post2 = await seedPost(alice, 'p2')
  })

  afterAll(async () => {
    await moduleRef?.close()
    await stopPostgres()
  })

  describe('like', () => {
    it('creates a like row', async () => {
      await repo.like(alice, post1)
      const count = await prisma.like.count({ where: { userId: alice, postId: post1 } })
      expect(count).toBe(1)
    })

    it('is idempotent (upsert) — calling twice does not duplicate', async () => {
      await repo.like(alice, post1)
      await repo.like(alice, post1)
      const count = await prisma.like.count({ where: { userId: alice, postId: post1 } })
      expect(count).toBe(1)
    })
  })

  describe('unlike', () => {
    it('removes existing like', async () => {
      await repo.like(bob, post1)
      await repo.unlike(bob, post1)
      const count = await prisma.like.count({ where: { userId: bob, postId: post1 } })
      expect(count).toBe(0)
    })

    it('is no-op when like does not exist', async () => {
      await expect(repo.unlike(bob, post2)).resolves.toBeUndefined()
    })
  })

  describe('countByPostIds', () => {
    it('returns map of postId → like count', async () => {
      await repo.like(alice, post1)
      await repo.like(bob, post1)
      await repo.like(alice, post2)
      const map = await repo.countByPostIds([post1, post2])
      expect(map.get(post1)).toBe(2)
      expect(map.get(post2)).toBe(1)
    })

    it('returns empty map for empty input', async () => {
      const map = await repo.countByPostIds([])
      expect(map.size).toBe(0)
    })

    it('omits posts that have no likes', async () => {
      const lonelyPost = await prisma.post.create({ data: { authorId: alice, content: 'lonely' } })
      const map = await repo.countByPostIds([lonelyPost.id])
      expect(map.has(lonelyPost.id)).toBe(false)
    })
  })

  describe('likedByViewer', () => {
    it('returns set of postIds liked by viewer', async () => {
      const freshPost = await prisma.post.create({ data: { authorId: alice, content: 'fresh' } })
      await repo.like(alice, post1)
      const set = await repo.likedByViewer(alice, [post1, freshPost.id])
      expect(set.has(post1)).toBe(true)
      expect(set.has(freshPost.id)).toBe(false)
    })

    it('returns empty set when viewer liked none', async () => {
      const stranger = await prisma.user.create({
        data: { name: 'stranger', email: `stranger-${Date.now()}@t.dev`, password: 'x' },
      })
      const set = await repo.likedByViewer(stranger.id, [post1, post2])
      expect(set.size).toBe(0)
    })

    it('returns empty set for empty input', async () => {
      const set = await repo.likedByViewer(alice, [])
      expect(set.size).toBe(0)
    })
  })
})
