import type { GqlContext } from '@common/graphql/gql-context'
import { CurrentUser, GqlAuthGuard, type AuthUser } from '@modules/auth'
import { Comment } from '@modules/comment'
import { User } from '@modules/user'
import { UseGuards } from '@nestjs/common'
import { Args, Context, Mutation, Parent, ResolveField, Resolver } from '@nestjs/graphql'

import { PostService } from '../../application/services/post.service'
import { Post } from '../../domain/entities/post.entity'

@Resolver(() => Post)
export class PostResolver {
  constructor(private readonly posts: PostService) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Post)
  createPost(@CurrentUser() user: AuthUser, @Args('content') content: string) {
    return this.posts.create(user.id, content)
  }

  @ResolveField(() => User)
  async author(@Parent() post: Post & { authorId?: string }, @Context() ctx: GqlContext) {
    const authorId = (post as unknown as { authorId: string }).authorId
    return ctx.loaders.userById.load(authorId)
  }

  @ResolveField(() => [Comment])
  comments(@Parent() post: Post, @Context() ctx: GqlContext) {
    return ctx.loaders.commentsByPost.load(post.id)
  }

  @ResolveField(() => Number)
  likesCount() {
    return 0
  }
}
