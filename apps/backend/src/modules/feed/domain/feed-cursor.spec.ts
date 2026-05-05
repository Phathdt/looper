import { BadRequestException } from '@nestjs/common'

import { describe, expect, it } from 'vitest'

import { decodeCursor, encodeCursor } from './feed-cursor'

describe('feed cursor', () => {
  it('encodes and decodes roundtrip', () => {
    const post = { createdAt: new Date('2026-04-23T12:34:56.789Z'), id: 'abc-123' }
    const encoded = encodeCursor(post)
    expect(typeof encoded).toBe('string')

    const decoded = decodeCursor(encoded)
    expect(decoded.id).toBe('abc-123')
    expect(new Date(decoded.createdAt).toISOString()).toBe(post.createdAt.toISOString())
  })

  it('throws BadRequestException on garbage cursor', () => {
    expect(() => decodeCursor('not-base64')).toThrow(BadRequestException)
  })

  it('throws BadRequestException on cursor missing separator', () => {
    const encoded = Buffer.from('only-one-part').toString('base64url')
    expect(() => decodeCursor(encoded)).toThrow(BadRequestException)
  })

  it('throws BadRequestException on cursor with invalid date', () => {
    const encoded = Buffer.from('not-a-date|some-id').toString('base64url')
    expect(() => decodeCursor(encoded)).toThrow(BadRequestException)
  })

  it('produces distinct cursors for different posts', () => {
    const a = encodeCursor({ createdAt: new Date(), id: 'a' })
    const b = encodeCursor({ createdAt: new Date(), id: 'b' })
    expect(a).not.toBe(b)
  })
})
