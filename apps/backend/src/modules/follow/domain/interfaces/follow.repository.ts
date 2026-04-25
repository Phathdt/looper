export abstract class FollowRepository {
  abstract follow(followerId: string, followingId: string): Promise<void>;
  abstract unfollow(followerId: string, followingId: string): Promise<void>;
  abstract listFollowingIds(followerId: string): Promise<string[]>;
  abstract countFollowers(userIds: readonly string[]): Promise<Map<string, number>>;
  abstract isFollowingBatch(viewerId: string, targetIds: readonly string[]): Promise<Set<string>>;
}
