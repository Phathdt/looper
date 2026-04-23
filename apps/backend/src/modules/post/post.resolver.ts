import { UseGuards } from "@nestjs/common";
import { Args, Context, Int, Mutation, Parent, ResolveField, Resolver } from "@nestjs/graphql";
import { Post } from "./post.model";
import { PostService } from "./post.service";
import { User } from "../user/user.model";
import { Comment } from "../comment/comment.model";
import { GqlAuthGuard } from "../auth/gql-auth.guard";
import { CurrentUser, type AuthUser } from "../auth/current-user.decorator";
import type { GqlContext } from "../graphql/gql-context";

@Resolver(() => Post)
export class PostResolver {
  constructor(private readonly posts: PostService) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Post)
  createPost(@CurrentUser() user: AuthUser, @Args("content") content: string) {
    return this.posts.create(user.id, content);
  }

  @ResolveField(() => User)
  async author(@Parent() post: Post & { authorId?: string }, @Context() ctx: GqlContext) {
    const authorId = (post as unknown as { authorId: string }).authorId;
    return ctx.loaders.userById.load(authorId);
  }

  @ResolveField(() => [Comment])
  comments(@Parent() post: Post, @Context() ctx: GqlContext) {
    return ctx.loaders.commentsByPost.load(post.id);
  }

  @ResolveField(() => Int)
  likesCount() {
    return 0;
  }
}
