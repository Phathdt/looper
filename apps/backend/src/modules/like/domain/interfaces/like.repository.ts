export abstract class ILikeRepository {
  abstract like(userId: string, postId: string): Promise<void>
  abstract unlike(userId: string, postId: string): Promise<void>
  abstract countByPostIds(postIds: readonly string[]): Promise<Map<string, number>>
  abstract likedByViewer(viewerId: string, postIds: readonly string[]): Promise<Set<string>>
}
