import { Test, type TestingModule } from '@nestjs/testing'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { startPostgres, stopPostgres } from '../../../../test-utils/setup-postgres'
import { PrismaModule } from '../../../prisma/prisma.module'
import { PrismaService } from '../../../prisma/prisma.service'
import { CommentModule } from '../../comment.module'
import { ICommentRepository } from '../../domain/interfaces/comment.repository'

describe('CommentPrismaRepository (integration)', () => {
  let moduleRef: TestingModule
  let repo: ICommentRepository
  let prisma: PrismaService
  let authorId: string
  let postIdA: string
  let postIdB: string

  beforeAll(async () => {
    await startPostgres()
    moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, CommentModule],
    }).compile()
    prisma = moduleRef.get(PrismaService)
    repo = moduleRef.get(ICommentRepository)

    const author = await prisma.user.create({
      data: { name: 'cmt', email: `cmt-${Date.now()}@t.dev`, password: 'x' },
    })
    authorId = author.id
    const a = await prisma.post.create({ data: { authorId, content: 'post-a' } })
    const b = await prisma.post.create({ data: { authorId, content: 'post-b' } })
    postIdA = a.id
    postIdB = b.id
  })

  afterAll(async () => {
    await moduleRef?.close()
    await stopPostgres()
  })

  describe('create', () => {
    it('persists a comment and returns mapped entity with all fields', async () => {
      const c = await repo.create(authorId, postIdA, 'first comment')
      expect(c).toMatchObject({
        authorId,
        postId: postIdA,
        content: 'first comment',
      })
      expect(c.id).toBeTruthy()
      expect(c.createdAt).toBeInstanceOf(Date)

      const row = await prisma.comment.findUnique({ where: { id: c.id } })
      expect(row?.content).toBe('first comment')
    })
  })

  describe('findByPostIds', () => {
    it('returns comments for given posts ordered by createdAt asc', async () => {
      const now = Date.now()
      await prisma.comment.createMany({
        data: [
          { authorId, postId: postIdA, content: 'a-2', createdAt: new Date(now - 1000) },
          { authorId, postId: postIdA, content: 'a-1', createdAt: new Date(now - 2000) },
          { authorId, postId: postIdB, content: 'b-1', createdAt: new Date(now - 3000) },
        ],
      })
      const rows = await repo.findByPostIds([postIdA, postIdB])
      const aRows = rows.filter((r) => r.postId === postIdA)
      const bRows = rows.filter((r) => r.postId === postIdB)
      expect(aRows.length).toBeGreaterThanOrEqual(2)
      expect(bRows.length).toBeGreaterThanOrEqual(1)
      // asc order check on postIdA subset
      for (let i = 1; i < aRows.length; i++) {
        expect(aRows[i].createdAt.getTime()).toBeGreaterThanOrEqual(aRows[i - 1].createdAt.getTime())
      }
    })

    it('returns empty array for unknown post ids', async () => {
      const rows = await repo.findByPostIds(['00000000-0000-0000-0000-000000000000'])
      expect(rows).toEqual([])
    })

    it('handles empty input', async () => {
      const rows = await repo.findByPostIds([])
      expect(rows).toEqual([])
    })
  })
})
