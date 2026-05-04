import { describe, expect, it, vi } from 'vitest'

import type { ICommentRepository } from '../../modules/comment/domain/interfaces/comment.repository'
import type { IFollowRepository } from '../../modules/follow/domain/interfaces/follow.repository'
import type { ILikeRepository } from '../../modules/like/domain/interfaces/like.repository'
import type { IUserRepository } from '../../modules/user/domain/interfaces/user.repository'
import { DataLoaderService } from './dataloader.service'

const makeUser = (id: string) => ({
  id,
  name: `name-${id}`,
  email: `${id}@t.dev`,
  createdAt: new Date(0),
})

function makeService(overrides: { findByIds?: ReturnType<typeof vi.fn> } = {}) {
  const users = {
    findByIds: overrides.findByIds ?? vi.fn(async (ids: string[]) => ids.map(makeUser)),
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findCredentialsByEmail: vi.fn(),
    create: vi.fn(),
    postsByAuthor: vi.fn(),
  } as unknown as IUserRepository
  const comments = { findByPostIds: vi.fn(async () => []) } as unknown as ICommentRepository
  const follows = {
    countFollowers: vi.fn(async () => new Map()),
    isFollowingBatch: vi.fn(async () => new Set()),
  } as unknown as IFollowRepository
  const likes = {
    countByPostIds: vi.fn(async () => new Map()),
    likedByViewer: vi.fn(async () => new Set()),
  } as unknown as ILikeRepository

  return { svc: new DataLoaderService(users, comments, follows, likes), users }
}

describe('DataLoaderService.userById', () => {
  it('batches multiple .load() calls into a single findByIds call', async () => {
    const { svc, users } = makeService()
    const loaders = svc.createLoaders('viewer')

    const results = await Promise.all([
      loaders.userById.load('u1'),
      loaders.userById.load('u2'),
      loaders.userById.load('u3'),
    ])

    expect((users.findByIds as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1)
    expect((users.findByIds as ReturnType<typeof vi.fn>).mock.calls[0][0]).toEqual(['u1', 'u2', 'u3'])
    expect(results.map((u) => u?.id)).toEqual(['u1', 'u2', 'u3'])
  })

  it('returns null for ids missing from repo response', async () => {
    const findByIds = vi.fn(async (ids: string[]) => ids.filter((id) => id !== 'missing').map(makeUser))
    const { svc } = makeService({ findByIds })
    const loaders = svc.createLoaders()

    const [a, missing, b] = await Promise.all([
      loaders.userById.load('u1'),
      loaders.userById.load('missing'),
      loaders.userById.load('u2'),
    ])

    expect(a?.id).toBe('u1')
    expect(missing).toBeNull()
    expect(b?.id).toBe('u2')
  })

  it('preserves input order even when repo returns rows in different order', async () => {
    const findByIds = vi.fn(async (ids: string[]) => [...ids].reverse().map(makeUser))
    const { svc } = makeService({ findByIds })
    const loaders = svc.createLoaders()

    const results = await Promise.all([
      loaders.userById.load('a'),
      loaders.userById.load('b'),
      loaders.userById.load('c'),
    ])

    expect(results.map((u) => u?.id)).toEqual(['a', 'b', 'c'])
  })

  it('dedupes duplicate ids inside the same tick', async () => {
    const { svc, users } = makeService()
    const loaders = svc.createLoaders()

    await Promise.all([loaders.userById.load('u1'), loaders.userById.load('u1'), loaders.userById.load('u2')])

    expect((users.findByIds as ReturnType<typeof vi.fn>).mock.calls[0][0]).toEqual(['u1', 'u2'])
  })
})
