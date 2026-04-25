import { Injectable } from '@nestjs/common'

import { CommentRepository } from '../../domain/interfaces/comment.repository'

@Injectable()
export class CommentService {
  constructor(private readonly repo: CommentRepository) {}

  create(authorId: string, postId: string, content: string) {
    return this.repo.create(authorId, postId, content)
  }
}
