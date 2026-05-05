import { describe, expect, it, vi } from 'vitest'

import type { ICommentRepository } from '../../domain/interfaces/comment.repository'
import { CommentService } from './comment.service'

function makeRepo() {
  return {
    create: vi.fn(async () => ({
      id: 'c1',
      content: 'Test comment',
      createdAt: new Date(),
      authorId: 'u1',
      postId: 'p1',
    })),
  } as unknown as ICommentRepository
}

describe('CommentService', () => {
  it('create: delegates to repo.create and returns the comment', async () => {
    const repo = makeRepo()
    const svc = new CommentService(repo)

    const result = await svc.create('u1', 'p1', 'Test comment')

    expect(result).toEqual({
      id: 'c1',
      content: 'Test comment',
      createdAt: expect.any(Date),
      authorId: 'u1',
      postId: 'p1',
    })
    expect(repo.create).toHaveBeenCalledWith('u1', 'p1', 'Test comment')
  })

  it('create: passes through repo errors', async () => {
    const repo = makeRepo()
    const testError = new Error('DB error')
    vi.mocked(repo.create).mockRejectedValueOnce(testError)
    const svc = new CommentService(repo)

    await expect(svc.create('u1', 'p1', 'Test comment')).rejects.toThrow('DB error')
  })
})
