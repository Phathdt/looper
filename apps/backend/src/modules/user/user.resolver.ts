import { Args, Context, ID, Int, Parent, Query, ResolveField, Resolver } from "@nestjs/graphql";
import { User } from "./user.model";
import { UserService } from "./user.service";
import { Post } from "../post/post.model";
import type { GqlContext } from "../graphql/gql-context";

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly users: UserService) {}

  @Query(() => User)
  user(@Args("id", { type: () => ID }) id: string) {
    return this.users.findById(id);
  }

  @ResolveField(() => [Post])
  posts(
    @Parent() user: User,
    @Args("first", { type: () => Int, nullable: true, defaultValue: 20 }) first: number,
  ) {
    return this.users.postsByAuthor(user.id, first);
  }

  @ResolveField(() => Int)
  followersCount(@Parent() user: User, @Context() ctx: GqlContext) {
    return ctx.loaders.followersCountByUser.load(user.id);
  }

  @ResolveField(() => Boolean)
  isFollowing(@Parent() user: User, @Context() ctx: GqlContext) {
    return ctx.loaders.isFollowingByUser.load(user.id);
  }
}
