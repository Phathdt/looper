import { BadRequestException } from '@nestjs/common'

export interface FeedCursor {
  createdAt: string
  id: string
}

export function encodeCursor(post: { createdAt: Date; id: string }): string {
  return Buffer.from(`${post.createdAt.toISOString()}|${post.id}`).toString('base64url')
}

export function decodeCursor(cursor: string): FeedCursor {
  try {
    const [createdAt, id] = Buffer.from(cursor, 'base64url').toString().split('|')
    if (!createdAt || !id || isNaN(Date.parse(createdAt))) {
      throw new BadRequestException('Invalid cursor')
    }
    return { createdAt, id }
  } catch (e) {
    if (e instanceof BadRequestException) throw e
    throw new BadRequestException('Invalid cursor')
  }
}
