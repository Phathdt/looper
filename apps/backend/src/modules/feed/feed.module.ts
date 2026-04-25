import { Module } from '@nestjs/common'

import { FollowModule } from '../follow/follow.module'
import { PostModule } from '../post/post.module'
import { FeedService } from './application/services/feed.service'
import { FeedResolver } from './infrastructure/resolvers/feed.resolver'

@Module({
  imports: [PostModule, FollowModule],
  providers: [FeedService, FeedResolver],
})
export class FeedModule {}
