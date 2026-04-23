import { Module } from "@nestjs/common";
import { FollowResolver } from "./follow.resolver";
import { FollowService } from "./follow.service";

@Module({
  providers: [FollowResolver, FollowService],
  exports: [FollowService],
})
export class FollowModule {}
