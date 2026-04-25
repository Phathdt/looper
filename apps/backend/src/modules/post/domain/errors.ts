import { NotFoundException } from '@nestjs/common'

export class PostNotFoundError extends NotFoundException {
  constructor(id: string) {
    super(`Post not found: ${id}`)
  }
}
