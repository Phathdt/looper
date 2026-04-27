import { CurrentUser, GqlAuthGuard, type AuthUser } from '@modules/auth'
import { UseGuards } from '@nestjs/common'
import { Args, Int, Query, Resolver } from '@nestjs/graphql'

import { IFeedService } from '../../domain/interfaces/feed.service'
import { PostConnectionType } from '../graphql/feed.types'

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
