import { Injectable } from '@nestjs/common'

import { UserNotFoundError } from '../../domain/errors'
import { UserRepository } from '../../domain/interfaces/user.repository'

@Injectable()
export class UserService {
  constructor(private readonly repo: UserRepository) {}

  async findById(id: string) {
    const user = await this.repo.findById(id)
    if (!user) throw new UserNotFoundError(id)
    return user
  }

  postsByAuthor(authorId: string, first = 20) {
    return this.repo.postsByAuthor(authorId, first)
  }
}
