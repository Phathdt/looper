import { NotFoundException } from '@nestjs/common'

export class PostNotFoundError extends NotFoundException {
  constructor(id: string) {
    super(`Post ${id} not found`)
  }
}
