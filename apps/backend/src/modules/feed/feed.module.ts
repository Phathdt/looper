import { Module } from "@nestjs/common";
import { FeedService } from "./application/services/feed.service";
import { FeedResolver } from "./infrastructure/resolvers/feed.resolver";
import { PostModule } from "../post/post.module";
import { FollowModule } from "../follow/follow.module";

@Module({
  imports: [PostModule, FollowModule],
  providers: [FeedService, FeedResolver],
})
export class FeedModule {}
