import { describe, expect, it, vi } from 'vitest'

import type { IPostRepository } from '../../domain/interfaces/post.repository'
import { PostService } from './post.service'

function makeRepo() {
  return {
    findById: vi.fn(),
    create: vi.fn(async () => ({
      id: 'p1',
      content: 'Test post',
      createdAt: new Date(),
      authorId: 'u1',
    })),
    findByAuthor: vi.fn(),
    findFeedPage: vi.fn(),
    postsByAuthors: vi.fn(),
  } as unknown as IPostRepository
}

describe('PostService', () => {
  it('create: delegates to repo.create and returns the post', async () => {
    const repo = makeRepo()
    const svc = new PostService(repo)

    const result = await svc.create('u1', 'Test post')

    expect(result).toEqual({
      id: 'p1',
      content: 'Test post',
      createdAt: expect.any(Date),
      authorId: 'u1',
    })
    expect(repo.create).toHaveBeenCalledWith('u1', 'Test post')
  })

  it('create: passes through repo errors', async () => {
    const repo = makeRepo()
    const testError = new Error('DB error')
    vi.mocked(repo.create).mockRejectedValueOnce(testError)
    const svc = new PostService(repo)

    await expect(svc.create('u1', 'Test post')).rejects.toThrow('DB error')
  })
})
