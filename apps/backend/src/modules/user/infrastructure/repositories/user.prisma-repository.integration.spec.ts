import { Test, type TestingModule } from '@nestjs/testing'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { startPostgres, stopPostgres } from '../../../../test-utils/setup-postgres'
import { PrismaModule } from '../../../prisma/prisma.module'
import { PrismaService } from '../../../prisma/prisma.service'
import { IUserRepository } from '../../domain/interfaces/user.repository'
import { UserModule } from '../../user.module'

describe('UserPrismaRepository (integration)', () => {
  let moduleRef: TestingModule
  let repo: IUserRepository
  let prisma: PrismaService

  beforeAll(async () => {
    await startPostgres()
    moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, UserModule],
    }).compile()
    prisma = moduleRef.get(PrismaService)
    repo = moduleRef.get(IUserRepository)
  })

  afterAll(async () => {
    await moduleRef?.close()
    await stopPostgres()
  })

  describe('findById', () => {
    it('returns mapped user without password', async () => {
      const row = await prisma.user.create({
        data: { name: 'find-me', email: `find-${Date.now()}@t.dev`, password: 'secret-hash' },
      })
      const user = await repo.findById(row.id)
      expect(user).toMatchObject({ id: row.id, name: 'find-me' })
      expect((user as unknown as Record<string, unknown>).password).toBeUndefined()
    })

    it('returns null on missing id', async () => {
      const result = await repo.findById('00000000-0000-0000-0000-000000000000')
      expect(result).toBeNull()
    })
  })

  describe('findByIds', () => {
    it('returns users matching the given ids without password', async () => {
      const stamp = Date.now()
      const a = await prisma.user.create({ data: { name: 'a', email: `bulk-a-${stamp}@t.dev`, password: 'h' } })
      const b = await prisma.user.create({ data: { name: 'b', email: `bulk-b-${stamp}@t.dev`, password: 'h' } })
      const users = await repo.findByIds([a.id, b.id])
      const ids = users.map((u) => u.id).sort()
      expect(ids).toEqual([a.id, b.id].sort())
      expect((users[0] as unknown as Record<string, unknown>).password).toBeUndefined()
    })

    it('skips ids that do not exist', async () => {
      const a = await prisma.user.create({
        data: { name: 'partial', email: `partial-${Date.now()}@t.dev`, password: 'h' },
      })
      const users = await repo.findByIds([a.id, '00000000-0000-0000-0000-000000000000'])
      expect(users).toHaveLength(1)
      expect(users[0].id).toBe(a.id)
    })

    it('returns empty array for empty input without hitting db', async () => {
      expect(await repo.findByIds([])).toEqual([])
    })
  })

  describe('findByEmail', () => {
    it('returns user without password', async () => {
      const email = `email-${Date.now()}@t.dev`
      await prisma.user.create({ data: { name: 'a', email, password: 'h' } })
      const user = await repo.findByEmail(email)
      expect(user?.email).toBe(email)
      expect((user as unknown as Record<string, unknown>).password).toBeUndefined()
    })

    it('returns null when email not registered', async () => {
      expect(await repo.findByEmail('nope@nope.test')).toBeNull()
    })
  })

  describe('findCredentialsByEmail', () => {
    it('returns credentials including password hash', async () => {
      const email = `cred-${Date.now()}@t.dev`
      await prisma.user.create({ data: { name: 'b', email, password: 'hashed-xyz' } })
      const creds = await repo.findCredentialsByEmail(email)
      expect(creds?.password).toBe('hashed-xyz')
      expect(creds?.email).toBe(email)
    })

    it('returns null on missing email', async () => {
      expect(await repo.findCredentialsByEmail('missing@nope.test')).toBeNull()
    })
  })

  describe('create', () => {
    it('persists row and returns mapped user without password', async () => {
      const email = `create-${Date.now()}@t.dev`
      const user = await repo.create({ name: 'new', email, password: 'pw-hash' })
      expect(user).toMatchObject({ name: 'new', email })
      expect((user as unknown as Record<string, unknown>).password).toBeUndefined()

      const row = await prisma.user.findUnique({ where: { id: user.id } })
      expect(row?.password).toBe('pw-hash')
    })
  })

  describe('postsByAuthor', () => {
    it('returns mapped posts ordered by createdAt desc, limited to first', async () => {
      const author = await prisma.user.create({
        data: { name: 'author', email: `author-${Date.now()}@t.dev`, password: 'x' },
      })
      const now = Date.now()
      await prisma.post.createMany({
        data: [
          { authorId: author.id, content: 'old', createdAt: new Date(now - 3000) },
          { authorId: author.id, content: 'mid', createdAt: new Date(now - 2000) },
          { authorId: author.id, content: 'new', createdAt: new Date(now - 1000) },
        ],
      })
      const posts = await repo.postsByAuthor(author.id, 2)
      expect(posts).toHaveLength(2)
      expect(posts[0].content).toBe('new')
      expect(posts[1].content).toBe('mid')
      expect(posts[0].authorId).toBe(author.id)
    })

    it('returns empty array when author has no posts', async () => {
      const lonely = await prisma.user.create({
        data: { name: 'lonely', email: `lonely-${Date.now()}@t.dev`, password: 'x' },
      })
      expect(await repo.postsByAuthor(lonely.id, 10)).toEqual([])
    })
  })
})
