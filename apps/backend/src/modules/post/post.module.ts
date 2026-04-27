import { Module } from '@nestjs/common'

import { PostService } from './application/services/post.service'
import { IPostRepository } from './domain/interfaces/post.repository'
import { IPostService } from './domain/interfaces/post.service'
import { PostPrismaRepository } from './infrastructure/repositories/post.prisma-repository'
import { PostResolver } from './infrastructure/resolvers/post.resolver'

@Module({
  providers: [
    PostResolver,
    { provide: IPostService, useClass: PostService },
    { provide: IPostRepository, useClass: PostPrismaRepository },
  ],
  exports: [IPostService, IPostRepository],
})
export class PostModule {}
