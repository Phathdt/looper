import type { Post } from '../entities/post.entity'

export abstract class IPostService {
  abstract create(authorId: string, content: string): Promise<Post>
}
