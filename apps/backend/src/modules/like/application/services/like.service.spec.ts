import type { IPostRepository } from '@modules/post'

import { describe, expect, it, vi } from 'vitest'

import { PostNotFoundError } from '../../domain/errors'
import type { ILikeRepository } from '../../domain/interfaces/like.repository'
import { LikeService } from './like.service'

function makeRepo() {
  return {
    like: vi.fn(async () => undefined),
    unlike: vi.fn(async () => undefined),
    countByPostIds: vi.fn(),
    likedByViewer: vi.fn(),
  } as unknown as ILikeRepository
}

function makePosts(found: { id: string; authorId: string } | null) {
  return {
    findById: vi.fn(async () => found),
    create: vi.fn(),
    findByAuthor: vi.fn(),
    findFeedPage: vi.fn(),
  } as unknown as IPostRepository
}

describe('LikeService', () => {
  it("like: succeeds when liking another user's post", async () => {
    const repo = makeRepo()
    const posts = makePosts({ id: 'p1', authorId: 'someone-else' })
    const svc = new LikeService(repo, posts)
    const ok = await svc.like('u1', 'p1')
    expect(ok).toBe(true)
    expect(repo.like).toHaveBeenCalledWith('u1', 'p1')
  })

  it('like: succeeds when liking your own post', async () => {
    const repo = makeRepo()
    const posts = makePosts({ id: 'p1', authorId: 'u1' })
    const svc = new LikeService(repo, posts)
    const ok = await svc.like('u1', 'p1')
    expect(ok).toBe(true)
    expect(repo.like).toHaveBeenCalledWith('u1', 'p1')
  })

  it('like: throws PostNotFoundError when post does not exist', async () => {
    const repo = makeRepo()
    const posts = makePosts(null)
    const svc = new LikeService(repo, posts)
    await expect(svc.like('u1', 'missing')).rejects.toBeInstanceOf(PostNotFoundError)
    expect(repo.like).not.toHaveBeenCalled()
  })

  it('unlike: delegates to repo and returns true (no validation)', async () => {
    const repo = makeRepo()
    const posts = makePosts(null)
    const svc = new LikeService(repo, posts)
    const ok = await svc.unlike('u1', 'p1')
    expect(ok).toBe(true)
    expect(repo.unlike).toHaveBeenCalledWith('u1', 'p1')
  })
})
