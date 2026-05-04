import type { GqlContext } from '@common/graphql/gql-context'
import { CommentType } from '@graphql/comment.type'
import { PostType } from '@graphql/post.type'
import { UserType } from '@graphql/user.type'
import { IPostService, type Post } from '@modules/post'
import { UseGuards } from '@nestjs/common'
import { Args, Context, Mutation, Parent, ResolveField, Resolver } from '@nestjs/graphql'

import { CurrentUser, type AuthUser } from './current-user.decorator'
import { GqlAuthGuard } from './gql-auth.guard'

@Resolver(() => PostType)
export class PostResolver {
  constructor(private readonly posts: IPostService) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => PostType)
  createPost(@CurrentUser() user: AuthUser, @Args('content') content: string) {
    return this.posts.create(user.id, content)
  }

  @ResolveField(() => UserType)
  async author(@Parent() post: Post, @Context() ctx: GqlContext) {
    return ctx.loaders.userById.load(post.authorId)
  }

  @ResolveField(() => [CommentType])
  comments(@Parent() post: Post, @Context() ctx: GqlContext) {
    return ctx.loaders.commentsByPost.load(post.id)
  }

  @ResolveField(() => Number)
  likesCount(@Parent() post: Post, @Context() ctx: GqlContext) {
    return ctx.loaders.likesCountByPost.load(post.id)
  }

  @ResolveField(() => Boolean)
  isLiked(@Parent() post: Post, @Context() ctx: GqlContext) {
    return ctx.loaders.isLikedByPost.load(post.id)
  }
}
