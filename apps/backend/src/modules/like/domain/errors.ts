import { BadRequestException, NotFoundException } from '@nestjs/common'

export class CannotLikeOwnPostError extends BadRequestException {
  constructor() {
    super('Cannot like your own post')
  }
}

export class PostNotFoundError extends NotFoundException {
  constructor(id: string) {
    super(`Post ${id} not found`)
  }
}
