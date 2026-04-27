import type { GqlContext } from '@common/graphql/gql-context'
import { CurrentUser, GqlAuthGuard, type AuthUser } from '@modules/auth'
import { UserType } from '@modules/user'
import { UseGuards } from '@nestjs/common'
import { Args, Context, ID, Mutation, Parent, ResolveField, Resolver } from '@nestjs/graphql'

import type { Comment } from '../../domain/entities/comment.entity'
import { ICommentService } from '../../domain/interfaces/comment.service'
import { CommentType } from '../graphql/comment.type'

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
