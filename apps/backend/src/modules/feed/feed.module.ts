import { IFollowRepository } from '@modules/follow'
import { IPostRepository } from '@modules/post'
import { Module } from '@nestjs/common'

import { FollowModule } from '../follow/follow.module'
import { PostModule } from '../post/post.module'
import { FeedService } from './application/services/feed.service'
import { IFeedService } from './domain/interfaces/feed.service'

@Module({
  imports: [PostModule, FollowModule],
  providers: [
    {
      provide: IFeedService,
      useFactory: (posts: IPostRepository, follows: IFollowRepository) => new FeedService(posts, follows),
      inject: [IPostRepository, IFollowRepository],
    },
  ],
  exports: [IFeedService],
})
export class FeedModule {}
