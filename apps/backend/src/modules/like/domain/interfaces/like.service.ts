export abstract class ILikeService {
  abstract like(userId: string, postId: string): Promise<boolean>
  abstract unlike(userId: string, postId: string): Promise<boolean>
}
