import { UseGuards } from '@nestjs/common'
import { Args, ID, Mutation, Resolver } from '@nestjs/graphql'

import { CurrentUser, type AuthUser } from '../../../auth/infrastructure/current-user.decorator'
import { GqlAuthGuard } from '../../../auth/infrastructure/gql-auth.guard'
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
