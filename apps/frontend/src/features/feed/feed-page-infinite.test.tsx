import { renderWithProviders } from '@test/test-utils'
import { screen } from '@testing-library/react'

import { FeedPage } from '@/features/feed/feed-page'

import { describe, expect, it, vi } from 'vitest'

type HookResult = {
  data?: { pages: Array<{ feed: { edges: Array<{ node: unknown; cursor: string }> } }> }
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  fetchNextPage: () => void
  error: Error | null
}

const fetchNextPage = vi.fn()
let state: HookResult = {
  isLoading: false,
  isFetchingNextPage: true,
  hasNextPage: true,
  fetchNextPage,
  error: null,
  data: {
    pages: [
      {
        feed: {
          edges: [
            {
              cursor: 'c1',
              node: {
                id: 'p1',
                content: 'x',
                createdAt: new Date().toISOString(),
                likesCount: 0,
                author: { id: 'u', name: 'a' },
                comments: [],
              },
            },
          ],
        },
      },
    ],
  },
}

vi.mock('@/generated/graphql', () => ({
  useInfiniteFeedQuery: () => state,
  useAddCommentMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

describe('<FeedPage /> more states', () => {
  it("shows 'Loading more' indicator when fetching next page", () => {
    renderWithProviders(<FeedPage />)
    expect(screen.getByText(/loading more/i)).toBeInTheDocument()
  })

  it('triggers fetchNextPage when sentinel is intersected', () => {
    const observerSpies: Array<(entries: IntersectionObserverEntry[]) => void> = []
    class CapturingObserver {
      constructor(cb: (entries: IntersectionObserverEntry[]) => void) {
        observerSpies.push(cb)
      }
      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() {
        return []
      }
      root = null
      rootMargin = ''
      thresholds = []
    }
    ;(globalThis as unknown as { IntersectionObserver: typeof IntersectionObserver }).IntersectionObserver =
      CapturingObserver as unknown as typeof IntersectionObserver

    fetchNextPage.mockReset()
    state = { ...state, isFetchingNextPage: false }
    renderWithProviders(<FeedPage />)

    // Simulate intersection
    observerSpies[0]([{ isIntersecting: true } as IntersectionObserverEntry])
    expect(fetchNextPage).toHaveBeenCalled()
  })
})
