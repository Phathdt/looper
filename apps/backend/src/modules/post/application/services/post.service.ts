import { Injectable } from '@nestjs/common'

import { PostRepository } from '../../domain/interfaces/post.repository'

@Injectable()
export class PostService {
  constructor(private readonly repo: PostRepository) {}

  create(authorId: string, content: string) {
    return this.repo.create(authorId, content)
  }
}
