import { cn } from '@/lib/utils'

import { describe, expect, it } from 'vitest'

describe('cn()', () => {
  it('merges simple classnames', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('dedupes tailwind classes (last wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('handles conditional classes', () => {
    const show = false as boolean
    expect(cn('base', show && 'hidden', 'active')).toBe('base active')
  })
})
