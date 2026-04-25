import { Module } from '@nestjs/common'

import { FollowService } from './application/services/follow.service'
import { FollowRepository } from './domain/interfaces/follow.repository'
import { FollowPrismaRepository } from './infrastructure/repositories/follow.prisma-repository'
import { FollowResolver } from './infrastructure/resolvers/follow.resolver'

@Module({
  providers: [FollowService, FollowResolver, { provide: FollowRepository, useClass: FollowPrismaRepository }],
  exports: [FollowService, FollowRepository],
})
export class FollowModule {}
