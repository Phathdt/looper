import type { GqlContext } from '@common/graphql/gql-context'
import { PostType } from '@graphql/post.type'
import { UserType } from '@graphql/user.type'
import { IUserService } from '@modules/user'
import { Args, Context, ID, Int, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql'

@Resolver(() => UserType)
export class UserResolver {
  constructor(private readonly users: IUserService) {}

  @Query(() => UserType)
  user(@Args('id', { type: () => ID }) id: string) {
    return this.users.findById(id)
  }

  @ResolveField(() => [PostType])
  async posts(
    @Parent() user: UserType,
    @Args('first', { type: () => Int, nullable: true, defaultValue: 20 }) first: number,
    @Context() ctx: GqlContext,
  ) {
    const all = await ctx.loaders.postsByAuthor.load(user.id)
    return first >= all.length ? all : all.slice(0, first)
  }

  @ResolveField(() => Int)
  followersCount(@Parent() user: UserType, @Context() ctx: GqlContext) {
    return ctx.loaders.followersCountByUser.load(user.id)
  }

  @ResolveField(() => Boolean)
  isFollowing(@Parent() user: UserType, @Context() ctx: GqlContext) {
    return ctx.loaders.isFollowingByUser.load(user.id)
  }
}
