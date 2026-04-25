import { UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Parent, ResolveField, Resolver } from "@nestjs/graphql";
import { Post } from "../../domain/entities/post.entity";
import { PostService } from "../../application/services/post.service";
import { User } from "../../../user/domain/entities/user.entity";
import { Comment } from "../../../comment/domain/entities/comment.entity";
import { GqlAuthGuard } from "../../../auth/infrastructure/gql-auth.guard";
import { CurrentUser, type AuthUser } from "../../../auth/infrastructure/current-user.decorator";
import type { GqlContext } from "../../../../common/graphql/gql-context";

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

  @ResolveField(() => Number)
  likesCount() {
    return 0;
  }
}
