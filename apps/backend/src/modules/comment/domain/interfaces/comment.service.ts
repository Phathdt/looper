import type { Comment } from '../entities/comment.entity'

export abstract class ICommentService {
  abstract create(authorId: string, postId: string, content: string): Promise<Comment>
}
