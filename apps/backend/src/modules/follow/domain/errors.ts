import { BadRequestException } from '@nestjs/common'

export class CannotFollowSelfError extends BadRequestException {
  constructor() {
    super('Cannot follow yourself')
  }
}
