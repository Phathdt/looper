import { describe, expect, it } from 'vitest'

import { commentContentSchema } from './comment-content.schema'

describe('commentContentSchema', () => {
  it('parses valid content', () => {
    const result = commentContentSchema.parse('This is a valid comment')
    expect(result).toBe('This is a valid comment')
  })

  it('rejects empty string', () => {
    expect(() => commentContentSchema.parse('')).toThrow()
  })

  it('rejects whitespace-only string', () => {
    expect(() => commentContentSchema.parse('   ')).toThrow()
  })

  it('rejects string exceeding 500 characters', () => {
    const longString = 'a'.repeat(501)
    expect(() => commentContentSchema.parse(longString)).toThrow()
  })

  it('accepts string at maximum length (500)', () => {
    const maxString = 'a'.repeat(500)
    const result = commentContentSchema.parse(maxString)
    expect(result).toBe(maxString)
  })

  it('trims leading and trailing whitespace', () => {
    const result = commentContentSchema.parse('  comment text  ')
    expect(result).toBe('comment text')
  })

  it('accepts string with newlines and special characters', () => {
    const content = 'Hello\nWorld\nWith\tTabs'
    const result = commentContentSchema.parse(content)
    expect(result).toBe(content)
  })

  it('trims then validates length (trim happens before validation)', () => {
    const paddedLongString = '  ' + 'a'.repeat(500) + '  '
    const result = commentContentSchema.parse(paddedLongString)
    expect(result).toBe('a'.repeat(500))
  })
})
