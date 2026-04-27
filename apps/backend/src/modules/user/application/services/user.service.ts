import type { Post } from '@modules/post'
import { Injectable } from '@nestjs/common'

import type { User } from '../../domain/entities/user.entity'
import { UserNotFoundError } from '../../domain/errors'
import { IUserRepository } from '../../domain/interfaces/user.repository'
import { IUserService } from '../../domain/interfaces/user.service'

@Injectable()
export class UserService implements IUserService {
  constructor(private readonly repo: IUserRepository) {}

  async findById(id: string): Promise<User> {
    const user = await this.repo.findById(id)
    if (!user) throw new UserNotFoundError(id)
    return user
  }

  postsByAuthor(authorId: string, first = 20): Promise<Post[]> {
    return this.repo.postsByAuthor(authorId, first)
  }
}
