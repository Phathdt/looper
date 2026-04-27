import type { GqlContext } from '@common/graphql/gql-context'
import { PostType } from '@modules/post'
import { Args, Context, ID, Int, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql'

import { IUserService } from '../../domain/interfaces/user.service'
import { UserType } from '../graphql/user.type'

@Resolver(() => UserType)
export class UserResolver {
  constructor(private readonly users: IUserService) {}

  @Query(() => UserType)
  user(@Args('id', { type: () => ID }) id: string) {
    return this.users.findById(id)
  }

  @ResolveField(() => [PostType])
  posts(@Parent() user: UserType, @Args('first', { type: () => Int, nullable: true, defaultValue: 20 }) first: number) {
    return this.users.postsByAuthor(user.id, first)
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
