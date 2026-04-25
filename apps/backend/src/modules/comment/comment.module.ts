import { Module } from '@nestjs/common'

import { CommentService } from './application/services/comment.service'
import { CommentRepository } from './domain/interfaces/comment.repository'
import { CommentPrismaRepository } from './infrastructure/repositories/comment.prisma-repository'
import { CommentResolver } from './infrastructure/resolvers/comment.resolver'

@Module({
  providers: [CommentService, CommentResolver, { provide: CommentRepository, useClass: CommentPrismaRepository }],
  exports: [CommentService, CommentRepository],
})
export class CommentModule {}
