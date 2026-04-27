import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { createGraphQLAppHarness, type GraphQLAppHarness } from '../../../../test-utils/graphql-app-harness'
import { startPostgres, stopPostgres } from '../../../../test-utils/setup-postgres'

describe('CommentResolver (integration)', () => {
  let harness: GraphQLAppHarness

  beforeAll(async () => {
    await startPostgres()
    harness = await createGraphQLAppHarness()
  })

  afterAll(async () => {
    await harness?.close()
    await stopPostgres()
  })

  it('comment mutation with nested author field', async () => {
    const commenterReg = await harness.gql(
      `mutation($i: RegisterInput!) { register(input: $i) { token user { id } } }`,
      {
        i: { name: 'Commenter', email: `commenter-${Date.now()}@x.x`, password: 'pw12345' },
      },
    )
    const commenterToken = commenterReg.data.register.token

    const posterReg = await harness.gql(`mutation($i: RegisterInput!) { register(input: $i) { token user { id } } }`, {
      i: { name: 'Poster3', email: `poster3-${Date.now()}@x.x`, password: 'pw12345' },
    })
    const posterToken = posterReg.data.register.token

    // Create a post
    const postRes = await harness.gql(
      `mutation($content: String!) { createPost(content: $content) { id } }`,
      { content: 'post for reply' },
      posterToken,
    )
    const postId = postRes.data.createPost.id

    // Add comment with nested author
    const commentRes = await harness.gql(
      `mutation($postId: ID!, $content: String!) { addComment(postId: $postId, content: $content) { id author { id name } } }`,
      { postId, content: 'my comment' },
      commenterToken,
    )

    expect(commentRes.data.addComment.author.name).toBe('Commenter')
  })

  it('comment resolver field author returns correct user', async () => {
    const authorReg = await harness.gql(`mutation($i: RegisterInput!) { register(input: $i) { token user { id } } }`, {
      i: { name: 'AuthorForComment', email: `afc-${Date.now()}@x.x`, password: 'pw12345' },
    })
    const authorToken = authorReg.data.register.token

    const posterReg = await harness.gql(`mutation($i: RegisterInput!) { register(input: $i) { token user { id } } }`, {
      i: { name: 'PostAuthor2', email: `pa2-${Date.now()}@x.x`, password: 'pw12345' },
    })
    const posterToken = posterReg.data.register.token

    const postRes = await harness.gql(
      `mutation($content: String!) { createPost(content: $content) { id } }`,
      { content: 'comment target' },
      posterToken,
    )

    const commentRes = await harness.gql(
      `mutation($postId: ID!, $content: String!) { addComment(postId: $postId, content: $content) { id author { id name } } }`,
      { postId: postRes.data.createPost.id, content: 'test comment' },
      authorToken,
    )

    expect(commentRes.data.addComment.author.name).toBe('AuthorForComment')
  })
})
