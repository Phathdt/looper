import { CurrentUser, GqlAuthGuard, type AuthUser } from '@modules/auth'
import { UseGuards } from '@nestjs/common'
import { Args, ID, Mutation, Resolver } from '@nestjs/graphql'

import { FollowService } from '../../application/services/follow.service'

@Resolver()
@UseGuards(GqlAuthGuard)
export class FollowResolver {
  constructor(private readonly follows: FollowService) {}

  @Mutation(() => Boolean)
  follow(@CurrentUser() user: AuthUser, @Args('userId', { type: () => ID }) userId: string) {
    return this.follows.follow(user.id, userId)
  }

  @Mutation(() => Boolean)
  unfollow(@CurrentUser() user: AuthUser, @Args('userId', { type: () => ID }) userId: string) {
    return this.follows.unfollow(user.id, userId)
  }
}
