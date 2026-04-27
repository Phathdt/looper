import type { GqlContext } from '@common/graphql/gql-context'
import { CurrentUser, GqlAuthGuard, type AuthUser } from '@modules/auth'
import { CommentType } from '@modules/comment'
import { UserType } from '@modules/user'
import { UseGuards } from '@nestjs/common'
import { Args, Context, Mutation, Parent, ResolveField, Resolver } from '@nestjs/graphql'

import type { Post } from '../../domain/entities/post.entity'
import { IPostService } from '../../domain/interfaces/post.service'
import { PostType } from '../graphql/post.type'

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
  likesCount() {
    return 0
  }
}
