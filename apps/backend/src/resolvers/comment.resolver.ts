import type { GqlContext } from '@common/graphql/gql-context'
import { CommentType } from '@graphql/comment.type'
import { UserType } from '@graphql/user.type'
import { ICommentService, type Comment } from '@modules/comment'
import { UseGuards } from '@nestjs/common'
import { Args, Context, ID, Mutation, Parent, ResolveField, Resolver } from '@nestjs/graphql'

import { CurrentUser, type AuthUser } from './current-user.decorator'
import { GqlAuthGuard } from './gql-auth.guard'

@Resolver(() => CommentType)
export class CommentResolver {
  constructor(private readonly comments: ICommentService) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => CommentType)
  addComment(
    @CurrentUser() user: AuthUser,
    @Args('postId', { type: () => ID }) postId: string,
    @Args('content') content: string,
  ) {
    return this.comments.create(user.id, postId, content)
  }

  @ResolveField(() => UserType)
  async author(@Parent() comment: Comment, @Context() ctx: GqlContext) {
    return ctx.loaders.userById.load(comment.authorId)
  }
}
