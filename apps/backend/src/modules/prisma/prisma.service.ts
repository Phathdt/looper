import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '../../../prisma/generated/client'
import { incrementQueryCount } from '../../common/request-context'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    })
    super({
      adapter,
      log:
        process.env.NODE_ENV === 'production'
          ? ['error']
          : [
              { emit: 'event', level: 'query' },
              { emit: 'stdout', level: 'warn' },
              { emit: 'stdout', level: 'error' },
            ],
    })
  }

  async onModuleInit() {
    // @ts-expect-error — generated client types $on with the runtime log config
    this.$on('query', () => incrementQueryCount())
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
