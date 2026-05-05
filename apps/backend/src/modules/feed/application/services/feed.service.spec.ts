import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IFollowRepository } from '../../../follow/domain/interfaces/follow.repository'
import type { IPostRepository } from '../../../post/domain/interfaces/post.repository'
import { decodeCursor, encodeCursor } from '../../domain/feed-cursor'
import { FeedService } from './feed.service'

const makePost = (i: number) => ({
  id: `p${i}`,
  content: `c${i}`,
  authorId: 'u1',
  createdAt: new Date(2026, 0, 1, 0, 0, i),
})

function makeService(posts: ReturnType<typeof makePost>[]) {
  const postRepo = {
    findFeedPage: vi.fn(async () => posts),
    findById: vi.fn(),
    create: vi.fn(),
    findByAuthor: vi.fn(),
  } as unknown as IPostRepository

  const followRepo = {
    listFollowingIds: vi.fn(async () => []),
    follow: vi.fn(),
    unfollow: vi.fn(),
    countFollowers: vi.fn(),
    isFollowingBatch: vi.fn(),
  } as unknown as IFollowRepository

  return { service: new FeedService(postRepo, followRepo), postRepo, followRepo }
}

describe('FeedService (unit)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns hasNextPage=false when result size <= take', async () => {
    const { service } = makeService([makePost(1), makePost(2)])
    const result = await service.feed('u1', 10)
    expect(result.pageInfo.hasNextPage).toBe(false)
    expect(result.edges).toHaveLength(2)
  })

  it('returns hasNextPage=true and trims last when result size > take', async () => {
    const { service } = makeService([makePost(3), makePost(2), makePost(1)])
    const result = await service.feed('u1', 2)
    expect(result.pageInfo.hasNextPage).toBe(true)
    expect(result.edges).toHaveLength(2)
  })

  it("each edge has cursor encoding node's createdAt+id", async () => {
    const { service } = makeService([makePost(1)])
    const result = await service.feed('u1', 10)
    const decoded = decodeCursor(result.edges[0].cursor)
    expect(decoded.id).toBe('p1')
    expect(decoded.createdAt).toBe(makePost(1).createdAt.toISOString())
  })

  it('clamps first to [1,50]', async () => {
    const { service, postRepo } = makeService([])
    await service.feed('u1', 0)
    expect((postRepo.findFeedPage as ReturnType<typeof vi.fn>).mock.calls[0][1]).toBe(2)

    await service.feed('u1', 100)
    expect((postRepo.findFeedPage as ReturnType<typeof vi.fn>).mock.calls[1][1]).toBe(51)
  })

  it('uses default first=10 when arg omitted', async () => {
    const { service, postRepo } = makeService([])
    await service.feed('u1')
    expect((postRepo.findFeedPage as ReturnType<typeof vi.fn>).mock.calls[0][1]).toBe(11)
  })

  it('passes decoded cursor to findFeedPage', async () => {
    const { service, postRepo } = makeService([])
    const after = encodeCursor({ createdAt: new Date('2026-01-01T00:00:05Z'), id: 'p5' })
    await service.feed('u1', 10, after)
    const cursorArg = (postRepo.findFeedPage as ReturnType<typeof vi.fn>).mock.calls[0][2]
    expect(cursorArg).toBeDefined()
    expect(cursorArg.id).toBe('p5')
  })
})
