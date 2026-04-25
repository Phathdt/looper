import { Injectable } from '@nestjs/common'

import { CannotFollowSelfError } from '../../domain/errors'
import { FollowRepository } from '../../domain/interfaces/follow.repository'

@Injectable()
export class FollowService {
  constructor(private readonly repo: FollowRepository) {}

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
