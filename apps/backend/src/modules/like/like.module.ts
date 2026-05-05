import { IPostRepository } from '@modules/post'
import { Module } from '@nestjs/common'

import { PostModule } from '../post/post.module'
import { LikeService } from './application/services/like.service'
import { ILikeRepository } from './domain/interfaces/like.repository'
import { ILikeService } from './domain/interfaces/like.service'
import { LikePrismaRepository } from './infrastructure/repositories/like.prisma-repository'

@Module({
  imports: [PostModule],
  providers: [
    { provide: ILikeRepository, useClass: LikePrismaRepository },
    {
      provide: ILikeService,
      useFactory: (repo: ILikeRepository, posts: IPostRepository) => new LikeService(repo, posts),
      inject: [ILikeRepository, IPostRepository],
    },
  ],
  exports: [ILikeService, ILikeRepository],
})
export class LikeModule {}
