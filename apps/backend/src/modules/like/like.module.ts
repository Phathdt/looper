import { Module } from '@nestjs/common'

import { LikeService } from './application/services/like.service'
import { ILikeRepository } from './domain/interfaces/like.repository'
import { ILikeService } from './domain/interfaces/like.service'
import { LikePrismaRepository } from './infrastructure/repositories/like.prisma-repository'

@Module({
  providers: [
    { provide: ILikeRepository, useClass: LikePrismaRepository },
    {
      provide: ILikeService,
      useFactory: (repo: ILikeRepository) => new LikeService(repo),
      inject: [ILikeRepository],
    },
  ],
  exports: [ILikeService, ILikeRepository],
})
export class LikeModule {}
