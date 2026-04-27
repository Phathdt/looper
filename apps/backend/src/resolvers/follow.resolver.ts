import { IFollowService } from '@modules/follow'
import { UseGuards } from '@nestjs/common'
import { Args, ID, Mutation, Resolver } from '@nestjs/graphql'

import { CurrentUser, type AuthUser } from './current-user.decorator'
import { GqlAuthGuard } from './gql-auth.guard'

@Resolver()
@UseGuards(GqlAuthGuard)
export class FollowResolver {
  constructor(private readonly follows: IFollowService) {}

  @Mutation(() => Boolean)
  follow(@CurrentUser() user: AuthUser, @Args('userId', { type: () => ID }) userId: string) {
    return this.follows.follow(user.id, userId)
  }

  @Mutation(() => Boolean)
  unfollow(@CurrentUser() user: AuthUser, @Args('userId', { type: () => ID }) userId: string) {
    return this.follows.unfollow(user.id, userId)
  }
}
