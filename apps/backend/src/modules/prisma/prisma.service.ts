import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '../../../prisma/generated/client'
import { incrementQueryCount, requestContext } from '../../common/request-context'

interface PrismaQueryEvent {
  query: string
  params: string
  duration: number
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly sqlLogger = new Logger('PrismaSQL')

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
    this.$on('query', (e: PrismaQueryEvent) => {
      incrementQueryCount()
      if (process.env.NODE_ENV === 'production' && process.env.LOG_SQL !== '1') return

      const stats = requestContext.getStore()
      const seq = stats ? `#${stats.queryCount}` : ''
      const dl = stats ? (stats.dataLoaderEnabled ? 'dl=on' : 'dl=off') : ''
      const params = e.params.length > 200 ? `${e.params.slice(0, 200)}…` : e.params
      this.sqlLogger.debug(`${seq} ${dl} (${e.duration}ms) ${e.query} -- params=${params}`)
    })
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
