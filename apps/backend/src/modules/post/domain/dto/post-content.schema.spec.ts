import { describe, expect, it } from 'vitest'

import { postContentSchema } from './post-content.schema'

describe('postContentSchema', () => {
  it('parses valid content', () => {
    const result = postContentSchema.parse('This is a valid post')
    expect(result).toBe('This is a valid post')
  })

  it('rejects empty string', () => {
    expect(() => postContentSchema.parse('')).toThrow()
  })

  it('rejects whitespace-only string', () => {
    expect(() => postContentSchema.parse('   ')).toThrow()
  })

  it('rejects string exceeding 5000 characters', () => {
    const longString = 'a'.repeat(5001)
    expect(() => postContentSchema.parse(longString)).toThrow()
  })

  it('accepts string at maximum length (5000)', () => {
    const maxString = 'a'.repeat(5000)
    const result = postContentSchema.parse(maxString)
    expect(result).toBe(maxString)
  })

  it('trims leading and trailing whitespace', () => {
    const result = postContentSchema.parse('  content with spaces  ')
    expect(result).toBe('content with spaces')
  })

  it('accepts string with newlines and special characters', () => {
    const content = 'Hello\nWorld\nWith\tTabs'
    const result = postContentSchema.parse(content)
    expect(result).toBe(content)
  })

  it('trims then validates length (trim happens before validation)', () => {
    const paddedLongString = '  ' + 'a'.repeat(5000) + '  '
    const result = postContentSchema.parse(paddedLongString)
    expect(result).toBe('a'.repeat(5000))
  })
})
