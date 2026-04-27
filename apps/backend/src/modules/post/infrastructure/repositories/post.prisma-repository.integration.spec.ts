import { Test, type TestingModule } from '@nestjs/testing'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { startPostgres, stopPostgres } from '../../../../test-utils/setup-postgres'
import { encodeCursor } from '../../../feed/domain/feed-cursor'
import { PrismaModule } from '../../../prisma/prisma.module'
import { PrismaService } from '../../../prisma/prisma.service'
import { IPostRepository } from '../../domain/interfaces/post.repository'
import { PostModule } from '../../post.module'

describe('PostPrismaRepository (integration)', () => {
  let moduleRef: TestingModule
  let repo: IPostRepository
  let prisma: PrismaService
  let authorAId: string
  let authorBId: string

  beforeAll(async () => {
    await startPostgres()
    moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, PostModule],
    }).compile()
    prisma = moduleRef.get(PrismaService)
    repo = moduleRef.get(IPostRepository)

    const a = await prisma.user.create({
      data: { name: 'a', email: `a-${Date.now()}@t.dev`, password: 'x' },
    })
    const b = await prisma.user.create({
      data: { name: 'b', email: `b-${Date.now()}@t.dev`, password: 'x' },
    })
    authorAId = a.id
    authorBId = b.id
  })

  afterAll(async () => {
    await moduleRef?.close()
    await stopPostgres()
  })

  describe('create + findById', () => {
    it('creates a post and round-trips via findById', async () => {
      const created = await repo.create(authorAId, 'hello world')
      expect(created).toMatchObject({ authorId: authorAId, content: 'hello world' })

      const found = await repo.findById(created.id)
      expect(found?.id).toBe(created.id)
      expect(found?.content).toBe('hello world')
    })

    it('returns null for missing id', async () => {
      expect(await repo.findById('00000000-0000-0000-0000-000000000000')).toBeNull()
    })
  })

  describe('findByAuthor', () => {
    it('returns posts ordered by createdAt desc and limited', async () => {
      const author = await prisma.user.create({
        data: { name: 'fa', email: `fa-${Date.now()}@t.dev`, password: 'x' },
      })
      const now = Date.now()
      await prisma.post.createMany({
        data: [
          { authorId: author.id, content: 'p1', createdAt: new Date(now - 3000) },
          { authorId: author.id, content: 'p2', createdAt: new Date(now - 2000) },
          { authorId: author.id, content: 'p3', createdAt: new Date(now - 1000) },
        ],
      })
      const posts = await repo.findByAuthor(author.id, 2)
      expect(posts.map((p) => p.content)).toEqual(['p3', 'p2'])
    })
  })

  describe('findFeedPage', () => {
    it('returns posts across multiple authors ordered desc', async () => {
      const now = Date.now()
      await prisma.post.createMany({
        data: [
          { authorId: authorAId, content: 'feed-a-old', createdAt: new Date(now - 5000) },
          { authorId: authorBId, content: 'feed-b-mid', createdAt: new Date(now - 3000) },
          { authorId: authorAId, content: 'feed-a-new', createdAt: new Date(now - 1000) },
        ],
      })
      const rows = await repo.findFeedPage([authorAId, authorBId], 100)
      const recent = rows.filter((r) => r.content.startsWith('feed-'))
      expect(recent[0].content).toBe('feed-a-new')
      expect(recent[1].content).toBe('feed-b-mid')
      expect(recent[2].content).toBe('feed-a-old')
    })

    it('paginates via cursor (after createdAt+id)', async () => {
      const author = await prisma.user.create({
        data: { name: 'cur', email: `cur-${Date.now()}@t.dev`, password: 'x' },
      })
      const base = Date.now()
      for (let i = 0; i < 5; i++) {
        await prisma.post.create({
          data: { authorId: author.id, content: `c${i}`, createdAt: new Date(base - i * 1000) },
        })
      }
      const page1 = await repo.findFeedPage([author.id], 2)
      expect(page1).toHaveLength(2)
      const cursor = { createdAt: page1[1].createdAt.toISOString(), id: page1[1].id }
      const page2 = await repo.findFeedPage([author.id], 2, cursor)
      expect(page2).toHaveLength(2)
      const ids1 = page1.map((p) => p.id)
      const ids2 = page2.map((p) => p.id)
      expect(ids1.some((id) => ids2.includes(id))).toBe(false)

      // ensure consistent decoding from base64 path
      encodeCursor(page1[0])
    })

    it('returns empty when no authors match', async () => {
      const rows = await repo.findFeedPage(['00000000-0000-0000-0000-000000000000'], 10)
      expect(rows).toEqual([])
    })
  })
})
