import { Module } from '@nestjs/common'

import { PostService } from './application/services/post.service'
import { PostRepository } from './domain/interfaces/post.repository'
import { PostPrismaRepository } from './infrastructure/repositories/post.prisma-repository'
import { PostResolver } from './infrastructure/resolvers/post.resolver'

@Module({
  providers: [PostService, PostResolver, { provide: PostRepository, useClass: PostPrismaRepository }],
  exports: [PostService, PostRepository],
})
export class PostModule {}
