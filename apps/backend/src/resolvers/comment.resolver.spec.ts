import type { GqlContext } from '@common/graphql/gql-context'
import type { Comment, ICommentService } from '@modules/comment'

import { describe, expect, it, vi } from 'vitest'

import { CommentResolver } from './comment.resolver'

const comment: Comment = { id: 'c1', content: 'hi', postId: 'p1', authorId: 'u1', createdAt: new Date() }

describe('CommentResolver (unit)', () => {
  it('addComment delegates to service.create', async () => {
    const comments = { create: vi.fn(async () => comment) } as unknown as ICommentService
    const r = new CommentResolver(comments)
    const result = await r.addComment({ id: 'u1', email: 'a@b', name: 'alice' }, 'p1', 'hi')
    expect(comments.create).toHaveBeenCalledWith('u1', 'p1', 'hi')
    expect(result).toBe(comment)
  })

  it('author field calls userById loader with comment.authorId', async () => {
    const r = new CommentResolver({} as ICommentService)
    const userById = { load: vi.fn(async (id: string) => ({ id, name: `u-${id}` })) }
    const ctx = { req: {}, loaders: { userById } } as unknown as GqlContext
    await r.author(comment, ctx)
    expect(userById.load).toHaveBeenCalledWith('u1')
  })
})
