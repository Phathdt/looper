import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { createGraphQLAppHarness, type GraphQLAppHarness } from '../test-utils/graphql-app-harness'
import { startPostgres, stopPostgres } from '../test-utils/setup-postgres'

describe('PostResolver (integration)', () => {
  let harness: GraphQLAppHarness

  beforeAll(async () => {
    await startPostgres()
    harness = await createGraphQLAppHarness()
  })

  afterAll(async () => {
    await harness?.close()
    await stopPostgres()
  })

  it('createPost mutation succeeds and returns correct fields', async () => {
    const userReg = await harness.gql(`mutation($i: RegisterInput!) { register(input: $i) { token user { id } } }`, {
      i: { name: 'PostUser', email: `pu-${Date.now()}@x.x`, password: 'pw12345' },
    })
    const token = userReg.data.register.token

    const postRes = await harness.gql(
      `mutation($content: String!) { createPost(content: $content) { id likesCount } }`,
      { content: 'test likes' },
      token,
    )

    expect(postRes.data.createPost.id).toBeDefined()
    expect(postRes.data.createPost.likesCount).toBe(0)
  })

  it('feed includes post with nested author field', async () => {
    const user = await harness.prisma.user.create({
      data: { name: 'poster', email: `p-${Date.now()}@x.x`, password: 'x' },
    })
    const token = (
      await harness.gql(
        `mutation { register(input: { name: "other", email: "o-${Date.now()}@x.x", password: "pw12345" }) { token user { id } } }`,
      )
    ).data.register.token

    const viewerId = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).sub
    await harness.prisma.follow.create({ data: { followerId: viewerId, followingId: user.id } })
    await harness.prisma.post.create({ data: { authorId: user.id, content: 'hello integration' } })

    const feed = await harness.gql(
      `{ feed(first: 10) { edges { node { content author { name } } } } }`,
      undefined,
      token,
    )
    const contents = feed.data.feed.edges.map((e: { node: { content: string } }) => e.node.content)
    expect(contents).toContain('hello integration')
  })

  it('createPost rejects empty content', async () => {
    const reg = await harness.gql(`mutation($i: RegisterInput!) { register(input: $i) { token } }`, {
      i: { name: 'EmptyContent', email: `ec-${Date.now()}@x.x`, password: 'pw12345' },
    })
    const res = await harness.gql(
      `mutation($content: String!) { createPost(content: $content) { id } }`,
      { content: '' },
      reg.data.register.token,
    )
    expect(res.errors?.[0]?.message).toMatch(/validation/i)
    expect(res.data?.createPost).toBeFalsy()
  })

  it('createPost rejects whitespace-only content', async () => {
    const reg = await harness.gql(`mutation($i: RegisterInput!) { register(input: $i) { token } }`, {
      i: { name: 'WSContent', email: `ws-${Date.now()}@x.x`, password: 'pw12345' },
    })
    const res = await harness.gql(
      `mutation($content: String!) { createPost(content: $content) { id } }`,
      { content: '    \n  \t' },
      reg.data.register.token,
    )
    expect(res.errors?.[0]?.message).toMatch(/validation/i)
  })

  it('createPost rejects content longer than 5000 chars', async () => {
    const reg = await harness.gql(`mutation($i: RegisterInput!) { register(input: $i) { token } }`, {
      i: { name: 'LongContent', email: `lc-${Date.now()}@x.x`, password: 'pw12345' },
    })
    const res = await harness.gql(
      `mutation($content: String!) { createPost(content: $content) { id } }`,
      { content: 'a'.repeat(5001) },
      reg.data.register.token,
    )
    expect(res.errors?.[0]?.message).toMatch(/validation/i)
  })

  it('post resolver field comments returns empty when no comments', async () => {
    const userReg = await harness.gql(`mutation($i: RegisterInput!) { register(input: $i) { token user { id } } }`, {
      i: { name: 'NoCommentPoster', email: `ncp-${Date.now()}@x.x`, password: 'pw12345' },
    })
    const token = userReg.data.register.token

    const postRes = await harness.gql(
      `mutation($content: String!) { createPost(content: $content) { id comments { content } } }`,
      { content: 'no comments post' },
      token,
    )

    expect(postRes.data.createPost.comments).toEqual([])
  })
})
