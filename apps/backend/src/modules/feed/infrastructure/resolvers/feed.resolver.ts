import { UseGuards } from '@nestjs/common'
import { Args, Int, Query, Resolver } from '@nestjs/graphql'

import { CurrentUser, type AuthUser } from '../../../auth/infrastructure/current-user.decorator'
import { GqlAuthGuard } from '../../../auth/infrastructure/gql-auth.guard'
import { FeedService } from '../../application/services/feed.service'
import { PostConnection } from '../../domain/entities/feed.entities'

@Resolver()
@UseGuards(GqlAuthGuard)
export class FeedResolver {
  constructor(private readonly feedService: FeedService) {}

  @Query(() => PostConnection, { name: 'feed' })
  getFeed(
    @CurrentUser() user: AuthUser,
    @Args('first', { type: () => Int, nullable: true, defaultValue: 10 }) first: number,
    @Args('after', { nullable: true }) after?: string,
  ) {
    return this.feedService.feed(user.id, first, after)
  }
}
