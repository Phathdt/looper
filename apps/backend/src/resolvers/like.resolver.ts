import { ILikeService } from '@modules/like'
import { UseGuards } from '@nestjs/common'
import { Args, ID, Mutation, Resolver } from '@nestjs/graphql'

import { CurrentUser, type AuthUser } from './current-user.decorator'
import { GqlAuthGuard } from './gql-auth.guard'

@Resolver()
@UseGuards(GqlAuthGuard)
export class LikeResolver {
  constructor(private readonly likes: ILikeService) {}

  @Mutation(() => Boolean)
  likePost(@CurrentUser() user: AuthUser, @Args('postId', { type: () => ID }) postId: string) {
    return this.likes.like(user.id, postId)
  }

  @Mutation(() => Boolean)
  unlikePost(@CurrentUser() user: AuthUser, @Args('postId', { type: () => ID }) postId: string) {
    return this.likes.unlike(user.id, postId)
  }
}
