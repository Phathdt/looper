import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { createGraphQLAppHarness, type GraphQLAppHarness } from '../test-utils/graphql-app-harness'
import { startPostgres, stopPostgres } from '../test-utils/setup-postgres'

describe('LikeResolver (integration)', () => {
  let harness: GraphQLAppHarness

  beforeAll(async () => {
    await startPostgres()
    harness = await createGraphQLAppHarness()
  })

  afterAll(async () => {
    await harness?.close()
    await stopPostgres()
  })

  async function makeUserAndPost(label: string) {
    const reg = await harness.gql(`mutation($i: RegisterInput!) { register(input: $i) { token user { id } } }`, {
      i: { name: label, email: `${label}-${Date.now()}-${Math.random()}@x.x`, password: 'pw12345' },
    })
    const token = reg.data.register.token
    const userId = reg.data.register.user.id
    const post = await harness.gql(
      `mutation($content: String!) { createPost(content: $content) { id } }`,
      { content: `${label} post` },
      token,
    )
    return { token, userId, postId: post.data.createPost.id }
  }

  it('likePost succeeds when liking another user post', async () => {
    const author = await makeUserAndPost('lk-author')
    const liker = await makeUserAndPost('lk-liker')

    const res = await harness.gql(
      `mutation($postId: ID!) { likePost(postId: $postId) }`,
      { postId: author.postId },
      liker.token,
    )
    expect(res.data?.likePost).toBe(true)
    expect(res.errors).toBeUndefined()
  })

  it('likePost rejects self-like with CannotLikeOwnPostError', async () => {
    const u = await makeUserAndPost('self-liker')
    const res = await harness.gql(`mutation($postId: ID!) { likePost(postId: $postId) }`, { postId: u.postId }, u.token)
    expect(res.errors?.[0]?.message).toMatch(/cannot like your own post/i)
    expect(res.data?.likePost).toBeFalsy()
  })

  it('likePost rejects non-existent post with PostNotFoundError', async () => {
    const u = await makeUserAndPost('missing-poster')
    const res = await harness.gql(
      `mutation($postId: ID!) { likePost(postId: $postId) }`,
      { postId: '00000000-0000-0000-0000-000000000000' },
      u.token,
    )
    expect(res.errors?.[0]?.message).toMatch(/not found/i)
    expect(res.data?.likePost).toBeFalsy()
  })

  it('likePost is idempotent (calling twice does not duplicate)', async () => {
    const author = await makeUserAndPost('idem-author')
    const liker = await makeUserAndPost('idem-liker')

    await harness.gql(`mutation($postId: ID!) { likePost(postId: $postId) }`, { postId: author.postId }, liker.token)
    await harness.gql(`mutation($postId: ID!) { likePost(postId: $postId) }`, { postId: author.postId }, liker.token)

    const count = await harness.prisma.like.count({ where: { userId: liker.userId, postId: author.postId } })
    expect(count).toBe(1)
  })

  it('unlikePost removes like', async () => {
    const author = await makeUserAndPost('un-author')
    const liker = await makeUserAndPost('un-liker')
    await harness.gql(`mutation($postId: ID!) { likePost(postId: $postId) }`, { postId: author.postId }, liker.token)
    const res = await harness.gql(
      `mutation($postId: ID!) { unlikePost(postId: $postId) }`,
      { postId: author.postId },
      liker.token,
    )
    expect(res.data?.unlikePost).toBe(true)
    const count = await harness.prisma.like.count({ where: { userId: liker.userId, postId: author.postId } })
    expect(count).toBe(0)
  })

  it('unlikePost is no-op when not liked (does not throw)', async () => {
    const author = await makeUserAndPost('noop-author')
    const liker = await makeUserAndPost('noop-liker')
    const res = await harness.gql(
      `mutation($postId: ID!) { unlikePost(postId: $postId) }`,
      { postId: author.postId },
      liker.token,
    )
    expect(res.data?.unlikePost).toBe(true)
    expect(res.errors).toBeUndefined()
  })

  it('Post.isLiked returns true after viewer likes the post', async () => {
    const author = await makeUserAndPost('isl-author')
    const liker = await makeUserAndPost('isl-liker')
    await harness.gql(`mutation($postId: ID!) { likePost(postId: $postId) }`, { postId: author.postId }, liker.token)

    const q = await harness.gql(
      `query($id: ID!) { user(id: $id) { posts { id isLiked likesCount } } }`,
      { id: author.userId },
      liker.token,
    )
    const post = q.data.user.posts.find((p: { id: string }) => p.id === author.postId)
    expect(post.isLiked).toBe(true)
    expect(post.likesCount).toBe(1)
  })
})
