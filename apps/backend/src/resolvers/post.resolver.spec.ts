import type { GqlContext } from '@common/graphql/gql-context'
import type { IPostService, Post } from '@modules/post'

import { describe, expect, it, vi } from 'vitest'

import { PostResolver } from './post.resolver'

function makeCtx(overrides: Partial<GqlContext['loaders']> = {}): GqlContext {
  const loaders = {
    userById: { load: vi.fn(async (id: string) => ({ id, name: `u-${id}` })) },
    commentsByPost: { load: vi.fn(async () => [{ id: 'c1' }]) },
    likesCountByPost: { load: vi.fn(async () => 5) },
    isLikedByPost: { load: vi.fn(async () => true) },
    ...overrides,
  } as unknown as GqlContext['loaders']
  return { req: {}, loaders, stats: { queryCount: 0, dataLoaderEnabled: true } } as unknown as GqlContext
}

const post: Post = { id: 'p1', content: 'hi', authorId: 'u1', createdAt: new Date() }

describe('PostResolver (unit)', () => {
  it('createPost delegates to service.create', async () => {
    const posts = { create: vi.fn(async () => post) } as unknown as IPostService
    const r = new PostResolver(posts)
    const result = await r.createPost({ id: 'u1', email: 'a@b', name: 'alice' }, 'hello')
    expect(posts.create).toHaveBeenCalledWith('u1', 'hello')
    expect(result).toBe(post)
  })

  it('author field calls userById loader with post.authorId', async () => {
    const r = new PostResolver({} as IPostService)
    const ctx = makeCtx()
    await r.author(post, ctx)
    expect(ctx.loaders.userById.load).toHaveBeenCalledWith('u1')
  })

  it('comments field calls commentsByPost loader with post.id', async () => {
    const r = new PostResolver({} as IPostService)
    const ctx = makeCtx()
    await r.comments(post, ctx)
    expect(ctx.loaders.commentsByPost.load).toHaveBeenCalledWith('p1')
  })

  it('likesCount field calls likesCountByPost loader with post.id', async () => {
    const r = new PostResolver({} as IPostService)
    const ctx = makeCtx()
    const count = await r.likesCount(post, ctx)
    expect(ctx.loaders.likesCountByPost.load).toHaveBeenCalledWith('p1')
    expect(count).toBe(5)
  })

  it('isLiked field calls isLikedByPost loader with post.id', async () => {
    const r = new PostResolver({} as IPostService)
    const ctx = makeCtx()
    const liked = await r.isLiked(post, ctx)
    expect(ctx.loaders.isLikedByPost.load).toHaveBeenCalledWith('p1')
    expect(liked).toBe(true)
  })
})
