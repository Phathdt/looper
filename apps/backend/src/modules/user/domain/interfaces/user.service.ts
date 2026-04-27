import type { Post } from '@modules/post'

import type { User } from '../entities/user.entity'

export abstract class IUserService {
  abstract findById(id: string): Promise<User>
  abstract postsByAuthor(authorId: string, first?: number): Promise<Post[]>
}
