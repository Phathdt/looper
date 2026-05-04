import { ILikeRepository } from '../../domain/interfaces/like.repository'
import { ILikeService } from '../../domain/interfaces/like.service'

export class LikeService implements ILikeService {
  constructor(private readonly repo: ILikeRepository) {}

  async like(userId: string, postId: string): Promise<boolean> {
    await this.repo.like(userId, postId)
    return true
  }

  async unlike(userId: string, postId: string): Promise<boolean> {
    await this.repo.unlike(userId, postId)
    return true
  }
}
