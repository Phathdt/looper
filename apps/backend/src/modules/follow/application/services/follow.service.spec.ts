import { describe, expect, it, vi } from 'vitest'

import { CannotFollowSelfError } from '../../domain/errors'
import type { IFollowRepository } from '../../domain/interfaces/follow.repository'
import { FollowService } from './follow.service'

function makeRepo() {
  return {
    follow: vi.fn(async () => undefined),
    unfollow: vi.fn(async () => undefined),
  } as unknown as IFollowRepository
}

describe('FollowService', () => {
  it('follow: delegates to repo and returns true when users are different', async () => {
    const repo = makeRepo()
    const svc = new FollowService(repo)

    const result = await svc.follow('u1', 'u2')

    expect(result).toBe(true)
    expect(repo.follow).toHaveBeenCalledWith('u1', 'u2')
  })

  it('follow: throws CannotFollowSelfError when followerId equals followingId', async () => {
    const repo = makeRepo()
    const svc = new FollowService(repo)

    await expect(svc.follow('u1', 'u1')).rejects.toBeInstanceOf(CannotFollowSelfError)
    expect(repo.follow).not.toHaveBeenCalled()
  })

  it('unfollow: delegates to repo and returns true', async () => {
    const repo = makeRepo()
    const svc = new FollowService(repo)

    const result = await svc.unfollow('u1', 'u2')

    expect(result).toBe(true)
    expect(repo.unfollow).toHaveBeenCalledWith('u1', 'u2')
  })

  it('unfollow: does not validate self-follow', async () => {
    const repo = makeRepo()
    const svc = new FollowService(repo)

    const result = await svc.unfollow('u1', 'u1')

    expect(result).toBe(true)
    expect(repo.unfollow).toHaveBeenCalledWith('u1', 'u1')
  })
})
