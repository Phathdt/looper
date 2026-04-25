import { render } from '@testing-library/react'

import { FeedSkeleton } from '@/features/feed/feed-skeleton'

import { describe, expect, it } from 'vitest'

describe('<FeedSkeleton />', () => {
  it('renders multiple skeleton placeholders', () => {
    const { container } = render(<FeedSkeleton />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })
})
