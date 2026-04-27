import { Module } from '@nestjs/common'

import { CommentService } from './application/services/comment.service'
import { ICommentRepository } from './domain/interfaces/comment.repository'
import { ICommentService } from './domain/interfaces/comment.service'
import { CommentPrismaRepository } from './infrastructure/repositories/comment.prisma-repository'

@Module({
  providers: [
    { provide: ICommentRepository, useClass: CommentPrismaRepository },
    {
      provide: ICommentService,
      useFactory: (repo: ICommentRepository) => new CommentService(repo),
      inject: [ICommentRepository],
    },
  ],
  exports: [ICommentService, ICommentRepository],
})
export class CommentModule {}
