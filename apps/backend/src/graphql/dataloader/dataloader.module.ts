import { Global, Module } from '@nestjs/common'

import { CommentModule } from '../../modules/comment/comment.module'
import { FollowModule } from '../../modules/follow/follow.module'
import { LikeModule } from '../../modules/like/like.module'
import { UserModule } from '../../modules/user/user.module'
import { DataLoaderService } from './dataloader.service'

@Global()
@Module({
  imports: [UserModule, CommentModule, FollowModule, LikeModule],
  providers: [DataLoaderService],
  exports: [DataLoaderService],
})
export class DataLoaderModule {}
