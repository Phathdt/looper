import { Module } from '@nestjs/common'

import { FollowService } from './application/services/follow.service'
import { IFollowRepository } from './domain/interfaces/follow.repository'
import { IFollowService } from './domain/interfaces/follow.service'
import { FollowPrismaRepository } from './infrastructure/repositories/follow.prisma-repository'

@Module({
  providers: [
    { provide: IFollowRepository, useClass: FollowPrismaRepository },
    {
      provide: IFollowService,
      useFactory: (repo: IFollowRepository) => new FollowService(repo),
      inject: [IFollowRepository],
    },
  ],
  exports: [IFollowService, IFollowRepository],
})
export class FollowModule {}
