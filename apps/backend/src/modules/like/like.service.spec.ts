import { describe, expect, it, vi } from 'vitest'

import { LikeService } from './application/services/like.service'
import type { ILikeRepository } from './domain/interfaces/like.repository'

function makeRepo() {
  return {
    like: vi.fn(async () => undefined),
    unlike: vi.fn(async () => undefined),
    countByPostIds: vi.fn(),
    likedByViewer: vi.fn(),
  } as unknown as ILikeRepository
}

describe('LikeService', () => {
  it('like: delegates to repo and returns true', async () => {
    const repo = makeRepo()
    const svc = new LikeService(repo)
    const ok = await svc.like('u1', 'p1')
    expect(ok).toBe(true)
    expect(repo.like).toHaveBeenCalledWith('u1', 'p1')
  })

  it('unlike: delegates to repo and returns true', async () => {
    const repo = makeRepo()
    const svc = new LikeService(repo)
    const ok = await svc.unlike('u1', 'p1')
    expect(ok).toBe(true)
    expect(repo.unlike).toHaveBeenCalledWith('u1', 'p1')
  })
})
