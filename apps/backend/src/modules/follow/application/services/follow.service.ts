import { CannotFollowSelfError } from '../../domain/errors'
import { IFollowRepository } from '../../domain/interfaces/follow.repository'
import { IFollowService } from '../../domain/interfaces/follow.service'

export class FollowService implements IFollowService {
  constructor(private readonly repo: IFollowRepository) {}

  async follow(followerId: string, followingId: string): Promise<boolean> {
    if (followerId === followingId) throw new CannotFollowSelfError()
    await this.repo.follow(followerId, followingId)
    return true
  }

  async unfollow(followerId: string, followingId: string): Promise<boolean> {
    await this.repo.unfollow(followerId, followingId)
    return true
  }
}
