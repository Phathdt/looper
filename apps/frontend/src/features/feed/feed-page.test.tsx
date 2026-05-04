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

let feedState: HookResult = {
  isLoading: true,
  isFetchingNextPage: false,
  hasNextPage: false,
  fetchNextPage: vi.fn(),
  error: null,
}

vi.mock('@/generated/graphql', () => ({
  useInfiniteFeedQuery: () => feedState,
  useAddCommentMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useLikePostMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useUnlikePostMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

function renderPage() {
  return renderWithProviders(<FeedPage />)
}

const samplePost = {
  id: 'p1',
  content: 'hello world',
  createdAt: new Date().toISOString(),
  likesCount: 1,
  isLiked: false,
  author: { id: 'u1', name: 'alice' },
  comments: [],
}

describe('<FeedPage />', () => {
  it('shows skeleton while loading', () => {
    feedState = {
      isLoading: true,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: vi.fn(),
      error: null,
    }
    const { container } = renderPage()
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('shows error message on failure', () => {
    feedState = {
      isLoading: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: vi.fn(),
      error: new Error('boom'),
    }
    renderPage()
    expect(screen.getByRole('alert')).toHaveTextContent(/failed/i)
  })

  it('renders posts', () => {
    feedState = {
      isLoading: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: vi.fn(),
      error: null,
      data: {
        pages: [{ feed: { edges: [{ cursor: 'c1', node: samplePost }] } }],
      },
    }
    renderPage()
    expect(screen.getByText('hello world')).toBeInTheDocument()
    expect(screen.getByText('All caught up.')).toBeInTheDocument()
  })

  it('shows empty state when no posts', () => {
    feedState = {
      isLoading: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: vi.fn(),
      error: null,
      data: { pages: [{ feed: { edges: [] } }] },
    }
    renderPage()
    expect(screen.getByText(/no posts yet/i)).toBeInTheDocument()
  })
})
