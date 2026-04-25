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
})
