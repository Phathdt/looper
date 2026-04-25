import { Global, Module } from '@nestjs/common'

import { CommentModule } from '../comment/comment.module'
import { FollowModule } from '../follow/follow.module'
import { UserModule } from '../user/user.module'
import { DataLoaderService } from './dataloader.service'

@Global()
@Module({
  imports: [UserModule, CommentModule, FollowModule],
  providers: [DataLoaderService],
  exports: [DataLoaderService],
})
export class DataLoaderModule {}
