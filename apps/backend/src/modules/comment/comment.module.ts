import { Module } from '@nestjs/common'

import { CommentService } from './application/services/comment.service'
import { ICommentRepository } from './domain/interfaces/comment.repository'
import { ICommentService } from './domain/interfaces/comment.service'
import { CommentPrismaRepository } from './infrastructure/repositories/comment.prisma-repository'
import { CommentResolver } from './infrastructure/resolvers/comment.resolver'

@Module({
  providers: [
    CommentResolver,
    { provide: ICommentService, useClass: CommentService },
    { provide: ICommentRepository, useClass: CommentPrismaRepository },
  ],
  exports: [ICommentService, ICommentRepository],
})
export class CommentModule {}
