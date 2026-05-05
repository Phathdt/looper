import type { GqlContext } from '@common/graphql/gql-context'
import type { IUserService, User } from '@modules/user'

import { describe, expect, it, vi } from 'vitest'

import { UserResolver } from './user.resolver'

const user: User = { id: 'u1', name: 'alice', email: 'a@b', createdAt: new Date() }

describe('UserResolver (unit)', () => {
  it('user query delegates to service.findById', async () => {
    const users = { findById: vi.fn(async () => user) } as unknown as IUserService
    const r = new UserResolver(users)
    const result = await r.user('u1')
    expect(users.findById).toHaveBeenCalledWith('u1')
    expect(result).toBe(user)
  })

  it('posts field calls postsByAuthor loader and returns full list when first >= length', async () => {
    const r = new UserResolver({} as IUserService)
    const posts = [{ id: 'p1' }, { id: 'p2' }]
    const postsByAuthor = { load: vi.fn(async () => posts) }
    const ctx = { req: {}, loaders: { postsByAuthor } } as unknown as GqlContext
    const result = await r.posts(user, 20, ctx)
    expect(postsByAuthor.load).toHaveBeenCalledWith('u1')
    expect(result).toBe(posts)
  })

  it('posts field slices when first < length', async () => {
    const r = new UserResolver({} as IUserService)
    const posts = [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }]
    const postsByAuthor = { load: vi.fn(async () => posts) }
    const ctx = { req: {}, loaders: { postsByAuthor } } as unknown as GqlContext
    const result = await r.posts(user, 2, ctx)
    expect(result).toHaveLength(2)
    expect((result as { id: string }[])[0].id).toBe('p1')
  })

  it('followersCount field calls followersCountByUser loader with user.id', async () => {
    const r = new UserResolver({} as IUserService)
    const followersCountByUser = { load: vi.fn(async () => 7) }
    const ctx = { req: {}, loaders: { followersCountByUser } } as unknown as GqlContext
    const count = await r.followersCount(user, ctx)
    expect(followersCountByUser.load).toHaveBeenCalledWith('u1')
    expect(count).toBe(7)
  })

  it('isFollowing field calls isFollowingByUser loader with user.id', async () => {
    const r = new UserResolver({} as IUserService)
    const isFollowingByUser = { load: vi.fn(async () => true) }
    const ctx = { req: {}, loaders: { isFollowingByUser } } as unknown as GqlContext
    const result = await r.isFollowing(user, ctx)
    expect(isFollowingByUser.load).toHaveBeenCalledWith('u1')
    expect(result).toBe(true)
  })
})
