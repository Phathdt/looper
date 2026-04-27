import type { INestApplication } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { AppModule } from './app.module'
import { PrismaService } from './modules/prisma/prisma.service'
import { startPostgres, stopPostgres } from './test-utils/setup-postgres'

describe('GraphQL e2e (integration)', () => {
  let app: INestApplication
  let moduleRef: TestingModule
  let prisma: PrismaService

  async function gql(query: string, variables?: unknown, token?: string): Promise<any> {
    const res = await fetch(`http://localhost:${port}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query, variables }),
    })
    return res.json()
  }

  let port = 0

  beforeAll(async () => {
    await startPostgres()
    process.env.JWT_SECRET = 'test-secret'
    moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = moduleRef.createNestApplication({ bufferLogs: true })
    await app.listen(0)
    const addr = app.getHttpServer().address() as { port: number }
    port = addr.port
    prisma = moduleRef.get(PrismaService)
  })

  afterAll(async () => {
    await app?.close()
    await moduleRef?.close()
    await stopPostgres()
  })

  it('health query works without auth', async () => {
    const res = await gql('{ health }')
    expect(res.data.health).toBe('ok')
  })

  it('register + login + feed flow', async () => {
    const email = `int-${Date.now()}@x.x`
    const reg = await gql(`mutation($i: RegisterInput!) { register(input: $i) { token user { id name } } }`, {
      i: { name: 'IntUser', email, password: 'pw12345' },
    })
    expect(reg.data.register.token).toMatch(/^eyJ/)
    const token = reg.data.register.token

    const feed = await gql(`{ feed(first: 5) { edges { node { id } } pageInfo { hasNextPage } } }`, undefined, token)
    expect(feed.data.feed.pageInfo.hasNextPage).toBe(false)
    expect(feed.data.feed.edges).toEqual([])
  })

  it('feed without auth returns error', async () => {
    const res = await gql('{ feed(first: 5) { edges { node { id } } } }')
    expect(res.errors).toBeDefined()
    expect(res.errors[0].extensions.code).toMatch(/UNAUTHENTICATED|UNAUTHORIZED/i)
  })

  it('createPost + feed includes new post', async () => {
    const user = await prisma.user.create({
      data: { name: 'poster', email: `p-${Date.now()}@x.x`, password: 'x' },
    })
    const token = (
      await gql(
        `mutation { register(input: { name: "other", email: "o-${Date.now()}@x.x", password: "pw12345" }) { token user { id } } }`,
      )
    ).data.register.token

    const viewerId = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).sub
    await prisma.follow.create({ data: { followerId: viewerId, followingId: user.id } })
    await prisma.post.create({ data: { authorId: user.id, content: 'hello integration' } })

    const feed = await gql(`{ feed(first: 10) { edges { node { content author { name } } } } }`, undefined, token)
    const contents = feed.data.feed.edges.map((e: { node: { content: string } }) => e.node.content)
    expect(contents).toContain('hello integration')
  })

  it('login mutation works correctly', async () => {
    const email = `login-${Date.now()}@x.x`
    const password = 'pw12345'
    // First register
    const reg = await gql(`mutation($i: RegisterInput!) { register(input: $i) { token user { id name } } }`, {
      i: { name: 'LoginUser', email, password },
    })
    expect(reg.data.register.token).toBeDefined()

    // Then login with same credentials
    const login = await gql(`mutation($i: LoginInput!) { login(input: $i) { token user { id name } } }`, {
      i: { email, password },
    })
    expect(login.data.login.token).toBeDefined()
    expect(login.data.login.user.name).toBe('LoginUser')
    expect(login.data.login.user.id).toBe(reg.data.register.user.id)
  })

  it('user query with nested fields (posts, followersCount, isFollowing)', async () => {
    // Create two users
    const posterEmail = `poster-${Date.now()}@x.x`
    const posterReg = await gql(`mutation($i: RegisterInput!) { register(input: $i) { token user { id } } }`, {
      i: { name: 'Poster', email: posterEmail, password: 'pw12345' },
    })
    const posterId = posterReg.data.register.user.id
    const posterToken = posterReg.data.register.token

    const viewerEmail = `viewer-${Date.now()}@x.x`
    const viewerReg = await gql(`mutation($i: RegisterInput!) { register(input: $i) { token user { id } } }`, {
      i: { name: 'Viewer', email: viewerEmail, password: 'pw12345' },
    })
    const viewerToken = viewerReg.data.register.token

    // Poster creates a post
    await gql(
      `mutation($content: String!) { createPost(content: $content) { id } }`,
      { content: 'test post from poster' },
      posterToken,
    )

    // Viewer follows poster
    await gql(`mutation($userId: ID!) { follow(userId: $userId) }`, { userId: posterId }, viewerToken)

    // Query user with nested posts, followersCount, isFollowing
    const userRes = await gql(
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

  it('feed with nested post fields (author, comments, likesCount)', async () => {
    // Create poster and commenter
    const posterReg = await gql(`mutation($i: RegisterInput!) { register(input: $i) { token user { id } } }`, {
      i: { name: 'Poster2', email: `poster2-${Date.now()}@x.x`, password: 'pw12345' },
    })
    const posterId = posterReg.data.register.user.id
    const posterToken = posterReg.data.register.token

    const viewerReg = await gql(`mutation($i: RegisterInput!) { register(input: $i) { token user { id } } }`, {
      i: { name: 'Viewer2', email: `viewer2-${Date.now()}@x.x`, password: 'pw12345' },
    })
    const viewerToken = viewerReg.data.register.token

    // Viewer follows poster
    await gql(`mutation($userId: ID!) { follow(userId: $userId) }`, { userId: posterId }, viewerToken)

    // Poster creates a post
    const postRes = await gql(
      `mutation($content: String!) { createPost(content: $content) { id } }`,
      { content: 'post for comments' },
      posterToken,
    )
    const postId = postRes.data.createPost.id

    // Viewer adds comment
    await gql(
      `mutation($postId: ID!, $content: String!) { addComment(postId: $postId, content: $content) { id } }`,
      { postId, content: 'nice post' },
      viewerToken,
    )

    // Query feed with nested author, comments.author, likesCount
    const feedRes = await gql(
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

  it('comment mutation with nested author field', async () => {
    const commenterReg = await gql(`mutation($i: RegisterInput!) { register(input: $i) { token user { id } } }`, {
      i: { name: 'Commenter', email: `commenter-${Date.now()}@x.x`, password: 'pw12345' },
    })
    const commenterToken = commenterReg.data.register.token

    const posterReg = await gql(`mutation($i: RegisterInput!) { register(input: $i) { token user { id } } }`, {
      i: { name: 'Poster3', email: `poster3-${Date.now()}@x.x`, password: 'pw12345' },
    })
    const posterToken = posterReg.data.register.token

    // Create a post
    const postRes = await gql(
      `mutation($content: String!) { createPost(content: $content) { id } }`,
      { content: 'post for reply' },
      posterToken,
    )
    const postId = postRes.data.createPost.id

    // Add comment with nested author
    const commentRes = await gql(
      `mutation($postId: ID!, $content: String!) { addComment(postId: $postId, content: $content) { id author { id name } } }`,
      { postId, content: 'my comment' },
      commenterToken,
    )

    expect(commentRes.data.addComment.author.name).toBe('Commenter')
  })

  it('unfollow mutation', async () => {
    const aliceReg = await gql(`mutation($i: RegisterInput!) { register(input: $i) { token user { id } } }`, {
      i: { name: 'Alice', email: `alice-${Date.now()}@x.x`, password: 'pw12345' },
    })
    const aliceId = aliceReg.data.register.user.id

    const bobReg = await gql(`mutation($i: RegisterInput!) { register(input: $i) { token user { id } } }`, {
      i: { name: 'Bob', email: `bob-${Date.now()}@x.x`, password: 'pw12345' },
    })
    const bobToken = bobReg.data.register.token

    // Bob follows Alice
    const followRes = await gql(`mutation($userId: ID!) { follow(userId: $userId) }`, { userId: aliceId }, bobToken)
    expect(followRes.data.follow).toBe(true)

    // Bob queries Alice's followers before unfollow
    let aliceQuery = await gql(
      `query($id: ID!) { user(id: $id) { followersCount isFollowing } }`,
      { id: aliceId },
      bobToken,
    )
    expect(aliceQuery.data.user.followersCount).toBe(1)
    expect(aliceQuery.data.user.isFollowing).toBe(true)

    // Bob unfollows Alice
    const unfollowRes = await gql(`mutation($userId: ID!) { unfollow(userId: $userId) }`, { userId: aliceId }, bobToken)
    expect(unfollowRes.data.unfollow).toBe(true)

    // Bob queries Alice's followers after unfollow
    aliceQuery = await gql(
      `query($id: ID!) { user(id: $id) { followersCount isFollowing } }`,
      { id: aliceId },
      bobToken,
    )
    expect(aliceQuery.data.user.followersCount).toBe(0)
    expect(aliceQuery.data.user.isFollowing).toBe(false)
  })

  it('anonymous query exercises dataloader without viewerId', async () => {
    // Create a user
    const userReg = await gql(`mutation($i: RegisterInput!) { register(input: $i) { token user { id } } }`, {
      i: { name: 'PublicUser', email: `pub-${Date.now()}@x.x`, password: 'pw12345' },
    })
    const userId = userReg.data.register.user.id
    const token = userReg.data.register.token

    // Create a post as PublicUser (to verify user has content, though we don't query it anonymously)
    await gql(`mutation($content: String!) { createPost(content: $content) { id } }`, { content: 'public post' }, token)

    // Query as anonymous (no token) — should work for public data
    // Note: feed requires auth, so we query user directly
    const userRes = await gql(`query($id: ID!) { user(id: $id) { id name isFollowing } }`, { id: userId })

    expect(userRes.data.user.id).toBe(userId)
    expect(userRes.data.user.name).toBe('PublicUser')
    expect(userRes.data.user.isFollowing).toBe(false)
  })

  it('post resolver fields without async (likesCount)', async () => {
    const userReg = await gql(`mutation($i: RegisterInput!) { register(input: $i) { token user { id } } }`, {
      i: { name: 'PostUser', email: `pu-${Date.now()}@x.x`, password: 'pw12345' },
    })
    const token = userReg.data.register.token

    const postRes = await gql(
      `mutation($content: String!) { createPost(content: $content) { id likesCount } }`,
      { content: 'test likes' },
      token,
    )

    expect(postRes.data.createPost.likesCount).toBe(0)
  })

  it('user resolver field posts respects first parameter', async () => {
    const userReg = await gql(`mutation($i: RegisterInput!) { register(input: $i) { token user { id } } }`, {
      i: { name: 'MultiPoster', email: `mp-${Date.now()}@x.x`, password: 'pw12345' },
    })
    const userId = userReg.data.register.user.id
    const token = userReg.data.register.token

    // Create 3 posts
    for (let i = 0; i < 3; i++) {
      await gql(
        `mutation($content: String!) { createPost(content: $content) { id } }`,
        { content: `post ${i + 1}` },
        token,
      )
    }

    // Query with first: 2
    const userRes = await gql(`query($id: ID!, $first: Int) { user(id: $id) { posts(first: $first) { content } } }`, {
      id: userId,
      first: 2,
    })

    expect(userRes.data.user.posts).toHaveLength(2)
  })

  it('comment resolver field author returns correct user', async () => {
    const authorReg = await gql(`mutation($i: RegisterInput!) { register(input: $i) { token user { id } } }`, {
      i: { name: 'AuthorForComment', email: `afc-${Date.now()}@x.x`, password: 'pw12345' },
    })
    const authorToken = authorReg.data.register.token

    const posterReg = await gql(`mutation($i: RegisterInput!) { register(input: $i) { token user { id } } }`, {
      i: { name: 'PostAuthor2', email: `pa2-${Date.now()}@x.x`, password: 'pw12345' },
    })
    const posterToken = posterReg.data.register.token

    const postRes = await gql(
      `mutation($content: String!) { createPost(content: $content) { id } }`,
      { content: 'comment target' },
      posterToken,
    )

    const commentRes = await gql(
      `mutation($postId: ID!, $content: String!) { addComment(postId: $postId, content: $content) { id author { id name } } }`,
      { postId: postRes.data.createPost.id, content: 'test comment' },
      authorToken,
    )

    expect(commentRes.data.addComment.author.name).toBe('AuthorForComment')
  })

  it('post resolver field comments returns empty when no comments', async () => {
    const userReg = await gql(`mutation($i: RegisterInput!) { register(input: $i) { token user { id } } }`, {
      i: { name: 'NoCommentPoster', email: `ncp-${Date.now()}@x.x`, password: 'pw12345' },
    })
    const token = userReg.data.register.token

    const postRes = await gql(
      `mutation($content: String!) { createPost(content: $content) { id comments { content } } }`,
      { content: 'no comments post' },
      token,
    )

    expect(postRes.data.createPost.comments).toEqual([])
  })
})
