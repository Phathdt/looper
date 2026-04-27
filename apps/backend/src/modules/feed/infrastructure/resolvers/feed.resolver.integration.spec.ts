import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { createGraphQLAppHarness, type GraphQLAppHarness } from '../../../../test-utils/graphql-app-harness'
import { startPostgres, stopPostgres } from '../../../../test-utils/setup-postgres'

describe('FeedResolver (integration)', () => {
  let harness: GraphQLAppHarness

  beforeAll(async () => {
    await startPostgres()
    harness = await createGraphQLAppHarness()
  })

  afterAll(async () => {
    await harness?.close()
    await stopPostgres()
  })

  it('feed query requires authentication', async () => {
    const res = await harness.gql('{ feed(first: 5) { edges { node { id } } } }')
    expect(res.errors).toBeDefined()
    expect(res.errors[0].extensions.code).toMatch(/UNAUTHENTICATED|UNAUTHORIZED/i)
  })

  it('feed returns empty array for new user', async () => {
    const email = `int-${Date.now()}@x.x`
    const reg = await harness.gql(`mutation($i: RegisterInput!) { register(input: $i) { token user { id name } } }`, {
      i: { name: 'IntUser', email, password: 'pw12345' },
    })
    expect(reg.data.register.token).toMatch(/^eyJ/)
    const token = reg.data.register.token

    const feed = await harness.gql(
      `{ feed(first: 5) { edges { node { id } } pageInfo { hasNextPage } } }`,
      undefined,
      token,
    )
    expect(feed.data.feed.pageInfo.hasNextPage).toBe(false)
    expect(feed.data.feed.edges).toEqual([])
  })

  it('feed with nested post fields (author, comments, likesCount)', async () => {
    // Create poster and commenter
    const posterReg = await harness.gql(`mutation($i: RegisterInput!) { register(input: $i) { token user { id } } }`, {
      i: { name: 'Poster2', email: `poster2-${Date.now()}@x.x`, password: 'pw12345' },
    })
    const posterId = posterReg.data.register.user.id
    const posterToken = posterReg.data.register.token

    const viewerReg = await harness.gql(`mutation($i: RegisterInput!) { register(input: $i) { token user { id } } }`, {
      i: { name: 'Viewer2', email: `viewer2-${Date.now()}@x.x`, password: 'pw12345' },
    })
    const viewerToken = viewerReg.data.register.token

    // Viewer follows poster
    await harness.gql(`mutation($userId: ID!) { follow(userId: $userId) }`, { userId: posterId }, viewerToken)

    // Poster creates a post
    const postRes = await harness.gql(
      `mutation($content: String!) { createPost(content: $content) { id } }`,
      { content: 'post for comments' },
      posterToken,
    )
    const postId = postRes.data.createPost.id

    // Viewer adds comment
    await harness.gql(
      `mutation($postId: ID!, $content: String!) { addComment(postId: $postId, content: $content) { id } }`,
      { postId, content: 'nice post' },
      viewerToken,
    )

    // Query feed with nested author, comments.author, likesCount
    const feedRes = await harness.gql(
      `{
        feed(first: 10) {
          edges {
            node {
              id
              content
              author { id name }
              comments { content author { name } }
              likesCount
            }
          }
        }
      }`,
      undefined,
      viewerToken,
    )

    const edge = feedRes.data.feed.edges[0]
    expect(edge.node.content).toBe('post for comments')
    expect(edge.node.author.name).toBe('Poster2')
    expect(edge.node.comments).toHaveLength(1)
    expect(edge.node.comments[0].content).toBe('nice post')
    expect(edge.node.comments[0].author.name).toBe('Viewer2')
    expect(edge.node.likesCount).toBe(0)
  })
})
