import { Module } from '@nestjs/common'

import { FollowService } from './application/services/follow.service'
import { IFollowRepository } from './domain/interfaces/follow.repository'
import { IFollowService } from './domain/interfaces/follow.service'
import { FollowPrismaRepository } from './infrastructure/repositories/follow.prisma-repository'
import { FollowResolver } from './infrastructure/resolvers/follow.resolver'

@Module({
  providers: [
    FollowResolver,
    { provide: IFollowService, useClass: FollowService },
    { provide: IFollowRepository, useClass: FollowPrismaRepository },
  ],
  exports: [IFollowService, IFollowRepository],
})
export class FollowModule {}
