import { UseGuards } from "@nestjs/common";
import { Args, Context, ID, Mutation, Parent, ResolveField, Resolver } from "@nestjs/graphql";
import { Comment } from "./comment.model";
import { CommentService } from "./comment.service";
import { User } from "../user/user.model";
import { GqlAuthGuard } from "../auth/gql-auth.guard";
import { CurrentUser, type AuthUser } from "../auth/current-user.decorator";
import type { GqlContext } from "../graphql/gql-context";

@Resolver(() => Comment)
export class CommentResolver {
  constructor(private readonly comments: CommentService) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Comment)
  addComment(
    @CurrentUser() user: AuthUser,
    @Args("postId", { type: () => ID }) postId: string,
    @Args("content") content: string,
  ) {
    return this.comments.create(user.id, postId, content);
  }

  @ResolveField(() => User)
  async author(@Parent() comment: Comment, @Context() ctx: GqlContext) {
    const authorId = (comment as unknown as { authorId: string }).authorId;
    return ctx.loaders.userById.load(authorId);
  }
}
