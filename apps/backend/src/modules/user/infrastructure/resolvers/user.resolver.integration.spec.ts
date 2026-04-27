import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { createGraphQLAppHarness, type GraphQLAppHarness } from '../../../../test-utils/graphql-app-harness'
import { startPostgres, stopPostgres } from '../../../../test-utils/setup-postgres'

describe('UserResolver (integration)', () => {
  let harness: GraphQLAppHarness

  beforeAll(async () => {
    await startPostgres()
    harness = await createGraphQLAppHarness()
  })

  afterAll(async () => {
    await harness?.close()
    await stopPostgres()
  })

  it('user query with nested fields (posts, followersCount, isFollowing)', async () => {
    // Create two users
    const posterEmail = `poster-${Date.now()}@x.x`
    const posterReg = await harness.gql(`mutation($i: RegisterInput!) { register(input: $i) { token user { id } } }`, {
      i: { name: 'Poster', email: posterEmail, password: 'pw12345' },
    })
    const posterId = posterReg.data.register.user.id
    const posterToken = posterReg.data.register.token

    const viewerEmail = `viewer-${Date.now()}@x.x`
    const viewerReg = await harness.gql(`mutation($i: RegisterInput!) { register(input: $i) { token user { id } } }`, {
      i: { name: 'Viewer', email: viewerEmail, password: 'pw12345' },
    })
    const viewerToken = viewerReg.data.register.token

    // Poster creates a post
    await harness.gql(
      `mutation($content: String!) { createPost(content: $content) { id } }`,
      { content: 'test post from poster' },
      posterToken,
    )

    // Viewer follows poster
    await harness.gql(`mutation($userId: ID!) { follow(userId: $userId) }`, { userId: posterId }, viewerToken)

    // Query user with nested posts, followersCount, isFollowing
    const userRes = await harness.gql(
      `query($id: ID!) { user(id: $id) { id name posts { content } followersCount isFollowing } }`,
      { id: posterId },
      viewerToken,
    )

    expect(userRes.data.user.name).toBe('Poster')
    expect(userRes.data.user.posts).toHaveLength(1)
    expect(userRes.data.user.posts[0].content).toBe('test post from poster')
    expect(userRes.data.user.followersCount).toBe(1)
    expect(userRes.data.user.isFollowing).toBe(true)
  })

  it('user resolver field posts respects first parameter', async () => {
    const userReg = await harness.gql(`mutation($i: RegisterInput!) { register(input: $i) { token user { id } } }`, {
      i: { name: 'MultiPoster', email: `mp-${Date.now()}@x.x`, password: 'pw12345' },
    })
    const userId = userReg.data.register.user.id
    const token = userReg.data.register.token

    // Create 3 posts
    for (let i = 0; i < 3; i++) {
      await harness.gql(
        `mutation($content: String!) { createPost(content: $content) { id } }`,
        { content: `post ${i + 1}` },
        token,
      )
    }

    // Query with first: 2
    const userRes = await harness.gql(
      `query($id: ID!, $first: Int) { user(id: $id) { posts(first: $first) { content } } }`,
      {
        id: userId,
        first: 2,
      },
    )

    expect(userRes.data.user.posts).toHaveLength(2)
  })

  it('anonymous query exercises dataloader without viewerId', async () => {
    // Create a user
    const userReg = await harness.gql(`mutation($i: RegisterInput!) { register(input: $i) { token user { id } } }`, {
      i: { name: 'PublicUser', email: `pub-${Date.now()}@x.x`, password: 'pw12345' },
    })
    const userId = userReg.data.register.user.id
    const token = userReg.data.register.token

    // Create a post as PublicUser (to verify user has content, though we don't query it anonymously)
    await harness.gql(
      `mutation($content: String!) { createPost(content: $content) { id } }`,
      { content: 'public post' },
      token,
    )

    // Query as anonymous (no token) — should work for public data
    // Note: feed requires auth, so we query user directly
    const userRes = await harness.gql(`query($id: ID!) { user(id: $id) { id name isFollowing } }`, { id: userId })

    expect(userRes.data.user.id).toBe(userId)
    expect(userRes.data.user.name).toBe('PublicUser')
    expect(userRes.data.user.isFollowing).toBe(false)
  })
})
