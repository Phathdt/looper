import type { GqlContext } from '@common/graphql/gql-context'
import { CurrentUser, GqlAuthGuard, type AuthUser } from '@modules/auth'
import { User } from '@modules/user'
import { UseGuards } from '@nestjs/common'
import { Args, Context, ID, Mutation, Parent, ResolveField, Resolver } from '@nestjs/graphql'

import { CommentService } from '../../application/services/comment.service'
import { Comment } from '../../domain/entities/comment.entity'

@Resolver(() => Comment)
export class CommentResolver {
  constructor(private readonly comments: CommentService) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Comment)
  addComment(
    @CurrentUser() user: AuthUser,
    @Args('postId', { type: () => ID }) postId: string,
    @Args('content') content: string,
  ) {
    return this.comments.create(user.id, postId, content)
  }

  @ResolveField(() => User)
  async author(@Parent() comment: Comment, @Context() ctx: GqlContext) {
    const authorId = (comment as unknown as { authorId: string }).authorId
    return ctx.loaders.userById.load(authorId)
  }
}
