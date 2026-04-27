import type { INestApplication } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'

import { AppModule } from '../app.module'
import { PrismaService } from '../modules/prisma/prisma.service'

export interface GraphQLAppHarness {
  app: INestApplication
  moduleRef: TestingModule
  prisma: PrismaService
  port: number
  gql: (query: string, variables?: unknown, token?: string) => Promise<any>
  close: () => Promise<void>
}

export async function createGraphQLAppHarness(): Promise<GraphQLAppHarness> {
  process.env.JWT_SECRET = 'test-secret'
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
  const app = moduleRef.createNestApplication({ bufferLogs: true })
  await app.listen(0)
  const addr = app.getHttpServer().address() as { port: number }
  const port = addr.port
  const prisma = moduleRef.get(PrismaService)

  const gql = async (query: string, variables?: unknown, token?: string): Promise<any> => {
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

  const close = async () => {
    await app?.close()
    await moduleRef?.close()
  }

  return { app, moduleRef, prisma, port, gql, close }
}
