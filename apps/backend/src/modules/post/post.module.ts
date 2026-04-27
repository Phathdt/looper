import { Module } from '@nestjs/common'

import { PostService } from './application/services/post.service'
import { IPostRepository } from './domain/interfaces/post.repository'
import { IPostService } from './domain/interfaces/post.service'
import { PostPrismaRepository } from './infrastructure/repositories/post.prisma-repository'

@Module({
  providers: [
    { provide: IPostRepository, useClass: PostPrismaRepository },
    {
      provide: IPostService,
      useFactory: (repo: IPostRepository) => new PostService(repo),
      inject: [IPostRepository],
    },
  ],
  exports: [IPostService, IPostRepository],
})
export class PostModule {}
