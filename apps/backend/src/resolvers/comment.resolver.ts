import type { GqlContext } from '@common/graphql/gql-context'
import { CommentType } from '@graphql/comment.type'
import { UserType } from '@graphql/user.type'
import { ICommentService, type Comment } from '@modules/comment'
import { commentContentSchema } from '@modules/comment/domain/dto/comment-content.schema'
import { UseGuards } from '@nestjs/common'
import { Args, Context, ID, Mutation, Parent, ResolveField, Resolver } from '@nestjs/graphql'
import { Throttle } from '@nestjs/throttler'

import { ZodValidationPipe } from 'nestjs-zod'

import { CurrentUser, type AuthUser } from './current-user.decorator'
import { GqlAuthGuard } from './gql-auth.guard'

@Resolver(() => CommentType)
export class CommentResolver {
  constructor(private readonly comments: ICommentService) {}

  @UseGuards(GqlAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Mutation(() => CommentType)
  addComment(
    @CurrentUser() user: AuthUser,
    @Args('postId', { type: () => ID }) postId: string,
    @Args('content', new ZodValidationPipe(commentContentSchema)) content: string,
  ) {
    return this.comments.create(user.id, postId, content)
  }

  @ResolveField(() => UserType)
  async author(@Parent() comment: Comment, @Context() ctx: GqlContext) {
    return ctx.loaders.userById.load(comment.authorId)
  }
}
