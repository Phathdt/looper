export abstract class IFollowService {
  abstract follow(followerId: string, followingId: string): Promise<boolean>
  abstract unfollow(followerId: string, followingId: string): Promise<boolean>
}
