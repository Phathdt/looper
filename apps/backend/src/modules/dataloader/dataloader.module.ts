import { Global, Module } from "@nestjs/common";
import { DataLoaderService } from "./dataloader.service";
import { UserModule } from "../user/user.module";
import { CommentModule } from "../comment/comment.module";
import { FollowModule } from "../follow/follow.module";

@Global()
@Module({
  imports: [UserModule, CommentModule, FollowModule],
  providers: [DataLoaderService],
  exports: [DataLoaderService],
})
export class DataLoaderModule {}
