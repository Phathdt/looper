import { Injectable } from '@nestjs/common'

import type { Post } from '../../domain/entities/post.entity'
import { IPostRepository } from '../../domain/interfaces/post.repository'
import { IPostService } from '../../domain/interfaces/post.service'

@Injectable()
export class PostService implements IPostService {
  constructor(private readonly repo: IPostRepository) {}

  create(authorId: string, content: string): Promise<Post> {
    return this.repo.create(authorId, content)
  }
}
