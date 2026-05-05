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

function makeService(
  overrides: {
    findByIds?: ReturnType<typeof vi.fn>
    postsByAuthors?: ReturnType<typeof vi.fn>
    findById?: ReturnType<typeof vi.fn>
    findByPostIds?: ReturnType<typeof vi.fn>
    countFollowers?: ReturnType<typeof vi.fn>
    isFollowingBatch?: ReturnType<typeof vi.fn>
    countByPostIds?: ReturnType<typeof vi.fn>
    likedByViewer?: ReturnType<typeof vi.fn>
    postsByAuthor?: ReturnType<typeof vi.fn>
  } = {},
) {
  const users = {
    findByIds: overrides.findByIds ?? vi.fn(async (ids: string[]) => ids.map(makeUser)),
    findById: overrides.findById ?? vi.fn(),
    findByEmail: vi.fn(),
    findCredentialsByEmail: vi.fn(),
    create: vi.fn(),
    postsByAuthor: overrides.postsByAuthor ?? vi.fn(),
    postsByAuthors: overrides.postsByAuthors ?? vi.fn(async () => new Map()),
  } as unknown as IUserRepository
  const comments = { findByPostIds: overrides.findByPostIds ?? vi.fn(async () => []) } as unknown as ICommentRepository
  const follows = {
    countFollowers: overrides.countFollowers ?? vi.fn(async () => new Map()),
    isFollowingBatch: overrides.isFollowingBatch ?? vi.fn(async () => new Set()),
  } as unknown as IFollowRepository
  const likes = {
    countByPostIds: overrides.countByPostIds ?? vi.fn(async () => new Map()),
    likedByViewer: overrides.likedByViewer ?? vi.fn(async () => new Set()),
  } as unknown as ILikeRepository

  return { svc: new DataLoaderService(users, comments, follows, likes), users, comments, follows, likes }
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

describe('DataLoaderService.postsByAuthor', () => {
  const makePost = (authorId: string, id: string) => ({
    id,
    content: `c-${id}`,
    authorId,
    createdAt: new Date(0),
  })

  it('batches multiple .load() calls into a single postsByAuthors invocation', async () => {
    const postsByAuthors = vi.fn(async (ids: string[]) => {
      const map = new Map<string, ReturnType<typeof makePost>[]>()
      for (const id of ids) map.set(id, [makePost(id, `${id}-p1`)])
      return map
    })
    const { svc, users } = makeService({ postsByAuthors })
    const loaders = svc.createLoaders()

    const results = await Promise.all([
      loaders.postsByAuthor.load('a1'),
      loaders.postsByAuthor.load('a2'),
      loaders.postsByAuthor.load('a3'),
    ])

    expect((users.postsByAuthors as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1)
    expect((users.postsByAuthors as ReturnType<typeof vi.fn>).mock.calls[0][0]).toEqual(['a1', 'a2', 'a3'])
    expect(results.map((p) => p[0]?.authorId)).toEqual(['a1', 'a2', 'a3'])
  })

  it('returns empty array for authors missing from repo response', async () => {
    const postsByAuthors = vi.fn(async (ids: string[]) => {
      const map = new Map<string, ReturnType<typeof makePost>[]>()
      if (ids.includes('present')) map.set('present', [makePost('present', 'p1')])
      return map
    })
    const { svc } = makeService({ postsByAuthors })
    const loaders = svc.createLoaders()

    const [present, missing] = await Promise.all([
      loaders.postsByAuthor.load('present'),
      loaders.postsByAuthor.load('missing'),
    ])

    expect(present).toHaveLength(1)
    expect(missing).toEqual([])
  })
})

describe('DataLoaderService.commentsByPost', () => {
  const makeComment = (postId: string, id: string) => ({
    id,
    content: `comment-${id}`,
    postId,
    authorId: `user-${id}`,
    createdAt: new Date(0),
  })

  it('batches multiple .load() calls into a single findByPostIds invocation', async () => {
    const findByPostIds = vi.fn(async (postIds: string[]) =>
      postIds.flatMap((pid) => [makeComment(pid, `${pid}-c1`), makeComment(pid, `${pid}-c2`)]),
    )
    const { svc, comments } = makeService({ findByPostIds })
    const loaders = svc.createLoaders()

    const results = await Promise.all([loaders.commentsByPost.load('post1'), loaders.commentsByPost.load('post2')])

    expect((comments.findByPostIds as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1)
    expect((comments.findByPostIds as ReturnType<typeof vi.fn>).mock.calls[0][0]).toEqual(['post1', 'post2'])
    expect(results[0]).toHaveLength(2)
    expect(results[1]).toHaveLength(2)
  })

  it('returns empty array for posts with no comments', async () => {
    const findByPostIds = vi.fn(async (postIds: string[]) =>
      postIds.includes('with-comments') ? [makeComment('with-comments', 'c1')] : [],
    )
    const { svc } = makeService({ findByPostIds })
    const loaders = svc.createLoaders()

    const [withComments, empty] = await Promise.all([
      loaders.commentsByPost.load('with-comments'),
      loaders.commentsByPost.load('no-comments'),
    ])

    expect(withComments).toHaveLength(1)
    expect(empty).toEqual([])
  })

  it('filters comments to only include matching postId', async () => {
    const findByPostIds = vi.fn(async () => [
      makeComment('post1', 'c1'),
      makeComment('post2', 'c2'),
      makeComment('post1', 'c3'),
    ])
    const { svc } = makeService({ findByPostIds })
    const loaders = svc.createLoaders()

    const results = await Promise.all([loaders.commentsByPost.load('post1'), loaders.commentsByPost.load('post2')])

    expect(results[0]).toHaveLength(2)
    expect(results[0].map((c) => c.id)).toEqual(['c1', 'c3'])
    expect(results[1]).toHaveLength(1)
    expect(results[1][0].id).toBe('c2')
  })
})

describe('DataLoaderService.followersCountByUser', () => {
  it('batches multiple .load() calls into a single countFollowers invocation', async () => {
    const countFollowers = vi.fn(async (userIds: string[]) => {
      const map = new Map<string, number>()
      for (const id of userIds) map.set(id, 10 + parseInt(id.slice(-1)))
      return map
    })
    const { svc, follows } = makeService({ countFollowers })
    const loaders = svc.createLoaders()

    const results = await Promise.all([
      loaders.followersCountByUser.load('user1'),
      loaders.followersCountByUser.load('user2'),
    ])

    expect((follows.countFollowers as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1)
    expect((follows.countFollowers as ReturnType<typeof vi.fn>).mock.calls[0][0]).toEqual(['user1', 'user2'])
    expect(results).toEqual([11, 12])
  })

  it('defaults to 0 for users missing from repo response', async () => {
    const countFollowers = vi.fn(async (userIds: string[]) => {
      const map = new Map<string, number>()
      if (userIds.includes('user1')) map.set('user1', 5)
      return map
    })
    const { svc } = makeService({ countFollowers })
    const loaders = svc.createLoaders()

    const [present, missing] = await Promise.all([
      loaders.followersCountByUser.load('user1'),
      loaders.followersCountByUser.load('user-missing'),
    ])

    expect(present).toBe(5)
    expect(missing).toBe(0)
  })
})

describe('DataLoaderService.isFollowingByUser', () => {
  it('batches multiple .load() calls into a single isFollowingBatch invocation when viewerId set', async () => {
    const isFollowingBatch = vi.fn(async (viewerId: string, userIds: string[]) => {
      const set = new Set<string>()
      if (userIds.includes('user1')) set.add('user1')
      return set
    })
    const { svc, follows } = makeService({ isFollowingBatch })
    const loaders = svc.createLoaders('viewer1')

    const results = await Promise.all([
      loaders.isFollowingByUser.load('user1'),
      loaders.isFollowingByUser.load('user2'),
    ])

    expect((follows.isFollowingBatch as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1)
    expect((follows.isFollowingBatch as ReturnType<typeof vi.fn>).mock.calls[0]).toEqual([
      'viewer1',
      ['user1', 'user2'],
    ])
    expect(results).toEqual([true, false])
  })

  it('returns false for all when no viewerId', async () => {
    const { svc, follows } = makeService()
    const loaders = svc.createLoaders()

    const results = await Promise.all([
      loaders.isFollowingByUser.load('user1'),
      loaders.isFollowingByUser.load('user2'),
    ])

    expect((follows.isFollowingBatch as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0)
    expect(results).toEqual([false, false])
  })
})

describe('DataLoaderService.likesCountByPost', () => {
  it('batches multiple .load() calls into a single countByPostIds invocation', async () => {
    const countByPostIds = vi.fn(async (postIds: string[]) => {
      const map = new Map<string, number>()
      for (const id of postIds) map.set(id, 5 + parseInt(id.slice(-1)))
      return map
    })
    const { svc, likes } = makeService({ countByPostIds })
    const loaders = svc.createLoaders()

    const results = await Promise.all([
      loaders.likesCountByPost.load('post1'),
      loaders.likesCountByPost.load('post2'),
      loaders.likesCountByPost.load('post3'),
    ])

    expect((likes.countByPostIds as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1)
    expect((likes.countByPostIds as ReturnType<typeof vi.fn>).mock.calls[0][0]).toEqual(['post1', 'post2', 'post3'])
    expect(results).toEqual([6, 7, 8])
  })

  it('defaults to 0 for posts missing from repo response', async () => {
    const countByPostIds = vi.fn(async (postIds: string[]) => {
      const map = new Map<string, number>()
      if (postIds.includes('post1')) map.set('post1', 10)
      return map
    })
    const { svc } = makeService({ countByPostIds })
    const loaders = svc.createLoaders()

    const [present, missing] = await Promise.all([
      loaders.likesCountByPost.load('post1'),
      loaders.likesCountByPost.load('post-missing'),
    ])

    expect(present).toBe(10)
    expect(missing).toBe(0)
  })
})

describe('DataLoaderService.isLikedByPost', () => {
  it('batches multiple .load() calls into a single likedByViewer invocation when viewerId set', async () => {
    const likedByViewer = vi.fn(async (viewerId: string, postIds: string[]) => {
      const set = new Set<string>()
      if (postIds.includes('post1')) set.add('post1')
      return set
    })
    const { svc, likes } = makeService({ likedByViewer })
    const loaders = svc.createLoaders('viewer1')

    const results = await Promise.all([loaders.isLikedByPost.load('post1'), loaders.isLikedByPost.load('post2')])

    expect((likes.likedByViewer as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1)
    expect((likes.likedByViewer as ReturnType<typeof vi.fn>).mock.calls[0]).toEqual(['viewer1', ['post1', 'post2']])
    expect(results).toEqual([true, false])
  })

  it('returns false for all when no viewerId', async () => {
    const { svc, likes } = makeService()
    const loaders = svc.createLoaders()

    const results = await Promise.all([loaders.isLikedByPost.load('post1'), loaders.isLikedByPost.load('post2')])

    expect((likes.likedByViewer as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0)
    expect(results).toEqual([false, false])
  })
})

describe('DataLoaderService non-batch mode', () => {
  it('userById.load calls findById per invocation when batch=false', async () => {
    const findById = vi.fn(async (id: string) => makeUser(id))
    const { svc, users } = makeService({ findById })
    const loaders = svc.createLoaders('viewer', { batch: false })

    await Promise.all([loaders.userById.load('u1'), loaders.userById.load('u2')])

    expect((users.findById as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(2)
    expect((users.findById as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe('u1')
    expect((users.findById as ReturnType<typeof vi.fn>).mock.calls[1][0]).toBe('u2')
  })

  it('commentsByPost.load calls findByPostIds and filters per invocation when batch=false', async () => {
    const makeComment = (postId: string, id: string) => ({
      id,
      content: `comment-${id}`,
      postId,
      authorId: `user-${id}`,
      createdAt: new Date(0),
    })
    const findByPostIds = vi.fn(async (postIds: string[]) =>
      postIds.flatMap((pid) => [makeComment(pid, `${pid}-c1`), makeComment(pid, `${pid}-c2`)]),
    )
    const { svc, comments } = makeService({ findByPostIds })
    const loaders = svc.createLoaders('viewer', { batch: false })

    const result = await loaders.commentsByPost.load('post1')

    expect((comments.findByPostIds as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1)
    expect((comments.findByPostIds as ReturnType<typeof vi.fn>).mock.calls[0][0]).toEqual(['post1'])
    expect(result).toHaveLength(2)
  })

  it('followersCountByUser.load calls countFollowers and returns count per invocation when batch=false', async () => {
    const countFollowers = vi.fn(async (userIds: string[]) => {
      const map = new Map<string, number>()
      for (const id of userIds) map.set(id, 42)
      return map
    })
    const { svc, follows } = makeService({ countFollowers })
    const loaders = svc.createLoaders('viewer', { batch: false })

    const result = await loaders.followersCountByUser.load('user1')

    expect((follows.countFollowers as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1)
    expect(result).toBe(42)
  })

  it('isFollowingByUser.load calls isFollowingBatch when viewerId set and batch=false', async () => {
    const isFollowingBatch = vi.fn(async (viewerId: string, userIds: string[]) => new Set(userIds))
    const { svc, follows } = makeService({ isFollowingBatch })
    const loaders = svc.createLoaders('viewer1', { batch: false })

    const result = await loaders.isFollowingByUser.load('user1')

    expect((follows.isFollowingBatch as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1)
    expect((follows.isFollowingBatch as ReturnType<typeof vi.fn>).mock.calls[0]).toEqual(['viewer1', ['user1']])
    expect(result).toBe(true)
  })

  it('isFollowingByUser.load returns false without viewerId when batch=false', async () => {
    const { svc, follows } = makeService()
    const loaders = svc.createLoaders('', { batch: false })

    const result = await loaders.isFollowingByUser.load('user1')

    expect((follows.isFollowingBatch as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0)
    expect(result).toBe(false)
  })

  it('likesCountByPost.load calls countByPostIds and returns count per invocation when batch=false', async () => {
    const countByPostIds = vi.fn(async (postIds: string[]) => {
      const map = new Map<string, number>()
      for (const id of postIds) map.set(id, 99)
      return map
    })
    const { svc, likes } = makeService({ countByPostIds })
    const loaders = svc.createLoaders('viewer', { batch: false })

    const result = await loaders.likesCountByPost.load('post1')

    expect((likes.countByPostIds as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1)
    expect(result).toBe(99)
  })

  it('isLikedByPost.load calls likedByViewer when viewerId set and batch=false', async () => {
    const likedByViewer = vi.fn(async (viewerId: string, postIds: string[]) => new Set(postIds))
    const { svc, likes } = makeService({ likedByViewer })
    const loaders = svc.createLoaders('viewer1', { batch: false })

    const result = await loaders.isLikedByPost.load('post1')

    expect((likes.likedByViewer as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1)
    expect((likes.likedByViewer as ReturnType<typeof vi.fn>).mock.calls[0]).toEqual(['viewer1', ['post1']])
    expect(result).toBe(true)
  })

  it('isLikedByPost.load returns false without viewerId when batch=false', async () => {
    const { svc, likes } = makeService()
    const loaders = svc.createLoaders('', { batch: false })

    const result = await loaders.isLikedByPost.load('post1')

    expect((likes.likedByViewer as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0)
    expect(result).toBe(false)
  })

  it('postsByAuthor.load calls postsByAuthor per invocation when batch=false', async () => {
    const makePost = (authorId: string, id: string) => ({
      id,
      content: `c-${id}`,
      authorId,
      createdAt: new Date(0),
    })
    const postsByAuthor = vi.fn(async (authorId: string) => [makePost(authorId, `${authorId}-p1`)])
    const { svc, users } = makeService({ postsByAuthor })
    const loaders = svc.createLoaders('viewer', { batch: false })

    await Promise.all([loaders.postsByAuthor.load('author1'), loaders.postsByAuthor.load('author2')])

    expect((users.postsByAuthor as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(2)
    expect((users.postsByAuthor as ReturnType<typeof vi.fn>).mock.calls[0]).toEqual(['author1', 20])
    expect((users.postsByAuthor as ReturnType<typeof vi.fn>).mock.calls[1]).toEqual(['author2', 20])
  })
})
