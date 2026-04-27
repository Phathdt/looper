import { Test, type TestingModule } from '@nestjs/testing'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { startPostgres, stopPostgres } from '../../test-utils/setup-postgres'
import { CommentModule } from '../comment/comment.module'
import { ICommentService } from '../comment/domain/interfaces/comment.service'
import { DataLoaderModule } from '../dataloader/dataloader.module'
import { DataLoaderService } from '../dataloader/dataloader.service'
import { IFollowService } from '../follow/domain/interfaces/follow.service'
import { FollowModule } from '../follow/follow.module'
import { IPostService } from '../post/domain/interfaces/post.service'
import { PostModule } from '../post/post.module'
import { PrismaModule } from '../prisma/prisma.module'
import { PrismaService } from '../prisma/prisma.service'
import { IUserService } from './domain/interfaces/user.service'
import { UserModule } from './user.module'

describe('Domain services (integration)', () => {
  let moduleRef: TestingModule
  let prisma: PrismaService
  let users: IUserService
  let posts: IPostService
  let comments: ICommentService
  let follows: IFollowService
  let loaderSvc: DataLoaderService

  let alice: { id: string }
  let bob: { id: string }

  beforeAll(async () => {
    await startPostgres()
    moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, UserModule, PostModule, CommentModule, FollowModule, DataLoaderModule],
    }).compile()
    prisma = moduleRef.get(PrismaService)
    users = moduleRef.get(IUserService)
    posts = moduleRef.get(IPostService)
    comments = moduleRef.get(ICommentService)
    follows = moduleRef.get(IFollowService)
    loaderSvc = moduleRef.get(DataLoaderService)

    alice = await prisma.user.create({
      data: { name: 'alice', email: 'alice@d.test', password: 'x' },
    })
    bob = await prisma.user.create({
      data: { name: 'bob', email: 'bob@d.test', password: 'x' },
    })
  })

  afterAll(async () => {
    await moduleRef?.close()
    await stopPostgres()
  })

  describe('UserService', () => {
    it('findById returns user', async () => {
      const u = await users.findById(alice.id)
      expect(u.name).toBe('alice')
    })

    it('findById throws NotFoundException on missing', async () => {
      await expect(users.findById('00000000-0000-0000-0000-000000000000')).rejects.toThrow(/not found/i)
    })

    it("postsByAuthor returns author's posts ordered desc", async () => {
      await posts.create(alice.id, 'p1')
      await posts.create(alice.id, 'p2')
      const list = await users.postsByAuthor(alice.id)
      expect(list.length).toBeGreaterThanOrEqual(2)
      expect(list[0].createdAt.getTime()).toBeGreaterThanOrEqual(list[1].createdAt.getTime())
    })
  })

  describe('PostService + CommentService', () => {
    it('creates post and comment', async () => {
      const post = await posts.create(alice.id, 'hello')
      expect(post.content).toBe('hello')
      const c = await comments.create(bob.id, post.id, 'nice')
      expect(c.content).toBe('nice')
      expect(c.postId).toBe(post.id)
    })
  })

  describe('FollowService', () => {
    it('follow creates a relation (idempotent)', async () => {
      await follows.follow(alice.id, bob.id)
      await follows.follow(alice.id, bob.id)
      const count = await prisma.follow.count({
        where: { followerId: alice.id, followingId: bob.id },
      })
      expect(count).toBe(1)
    })

    it('unfollow removes relation', async () => {
      await follows.unfollow(alice.id, bob.id)
      const count = await prisma.follow.count({
        where: { followerId: alice.id, followingId: bob.id },
      })
      expect(count).toBe(0)
    })

    it('unfollow on non-existent relation is no-op', async () => {
      await expect(follows.unfollow(alice.id, bob.id)).resolves.toBe(true)
    })

    it('cannot follow self', async () => {
      await expect(follows.follow(alice.id, alice.id)).rejects.toThrow(/yourself/i)
    })
  })

  describe('DataLoaderService', () => {
    it('userById batches and returns users', async () => {
      const loaders = loaderSvc.createLoaders()
      const [a, b] = await Promise.all([loaders.userById.load(alice.id), loaders.userById.load(bob.id)])
      expect(a?.name).toBe('alice')
      expect(b?.name).toBe('bob')
    })

    it('userById returns null for missing', async () => {
      const loaders = loaderSvc.createLoaders()
      const res = await loaders.userById.load('00000000-0000-0000-0000-000000000000')
      expect(res).toBeNull()
    })

    it('commentsByPost groups comments per post', async () => {
      const p = await posts.create(alice.id, 'c-test')
      await comments.create(bob.id, p.id, 'a')
      await comments.create(bob.id, p.id, 'b')
      const loaders = loaderSvc.createLoaders()
      const list = await loaders.commentsByPost.load(p.id)
      expect(list).toHaveLength(2)
    })

    it('followersCountByUser returns counts', async () => {
      await follows.follow(alice.id, bob.id)
      const loaders = loaderSvc.createLoaders()
      const count = await loaders.followersCountByUser.load(bob.id)
      expect(count).toBeGreaterThanOrEqual(1)
    })

    it('isFollowingByUser returns false without viewer', async () => {
      const loaders = loaderSvc.createLoaders()
      const result = await loaders.isFollowingByUser.load(bob.id)
      expect(result).toBe(false)
    })

    it("isFollowingByUser reflects viewer's follow state", async () => {
      const loaders = loaderSvc.createLoaders(alice.id)
      const result = await loaders.isFollowingByUser.load(bob.id)
      expect(result).toBe(true)
    })
  })
})
