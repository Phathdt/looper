import { PostConnectionType } from '@graphql/feed.types'
import { IFeedService } from '@modules/feed'
import { UseGuards } from '@nestjs/common'
import { Args, Int, Query, Resolver } from '@nestjs/graphql'

import { CurrentUser, type AuthUser } from './current-user.decorator'
import { GqlAuthGuard } from './gql-auth.guard'

@Resolver()
@UseGuards(GqlAuthGuard)
export class FeedResolver {
  constructor(private readonly feedService: IFeedService) {}

  @Query(() => PostConnectionType, { name: 'feed' })
  getFeed(
    @CurrentUser() user: AuthUser,
    @Args('first', { type: () => Int, nullable: true, defaultValue: 10 }) first: number,
    @Args('after', { nullable: true }) after?: string,
  ) {
    return this.feedService.feed(user.id, first, after)
  }
}
