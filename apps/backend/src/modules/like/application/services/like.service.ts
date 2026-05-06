import { IPostRepository } from '@modules/post'

import { PostNotFoundError } from '../../domain/errors'
import { ILikeRepository } from '../../domain/interfaces/like.repository'
import { ILikeService } from '../../domain/interfaces/like.service'

export class LikeService implements ILikeService {
  constructor(
    private readonly repo: ILikeRepository,
    private readonly posts: IPostRepository,
  ) {}

  async like(userId: string, postId: string): Promise<boolean> {
    const post = await this.posts.findById(postId)
    if (!post) throw new PostNotFoundError(postId)
    await this.repo.like(userId, postId)
    return true
  }

  async unlike(userId: string, postId: string): Promise<boolean> {
    await this.repo.unlike(userId, postId)
    return true
  }
}
