import { Module } from '@nestjs/common'

import { FollowModule } from '../follow/follow.module'
import { PostModule } from '../post/post.module'
import { FeedService } from './application/services/feed.service'
import { IFeedService } from './domain/interfaces/feed.service'
import { FeedResolver } from './infrastructure/resolvers/feed.resolver'

@Module({
  imports: [PostModule, FollowModule],
  providers: [FeedResolver, { provide: IFeedService, useClass: FeedService }],
})
export class FeedModule {}
