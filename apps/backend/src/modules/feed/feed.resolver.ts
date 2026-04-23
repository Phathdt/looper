import { UseGuards } from "@nestjs/common";
import { Args, Int, Query, Resolver } from "@nestjs/graphql";
import { PostConnection } from "./feed.models";
import { FeedService } from "./feed.service";
import { GqlAuthGuard } from "../auth/gql-auth.guard";
import { CurrentUser, type AuthUser } from "../auth/current-user.decorator";

@Resolver()
@UseGuards(GqlAuthGuard)
export class FeedResolver {
  constructor(private readonly feedService: FeedService) {}

  @Query(() => PostConnection, { name: "feed" })
  getFeed(
    @CurrentUser() user: AuthUser,
    @Args("first", { type: () => Int, nullable: true, defaultValue: 10 }) first: number,
    @Args("after", { nullable: true }) after?: string,
  ) {
    return this.feedService.feed(user.id, first, after);
  }
}
