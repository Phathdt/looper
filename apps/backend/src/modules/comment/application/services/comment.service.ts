import { Injectable } from '@nestjs/common'

import type { Comment } from '../../domain/entities/comment.entity'
import { ICommentRepository } from '../../domain/interfaces/comment.repository'
import { ICommentService } from '../../domain/interfaces/comment.service'

@Injectable()
export class CommentService implements ICommentService {
  constructor(private readonly repo: ICommentRepository) {}

  create(authorId: string, postId: string, content: string): Promise<Comment> {
    return this.repo.create(authorId, postId, content)
  }
}
