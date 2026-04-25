import { renderWithProviders } from '@test/test-utils'
import { screen } from '@testing-library/react'

import { PostCard } from '@/features/feed/post-card'

import { describe, expect, it, vi } from 'vitest'

vi.mock('@/generated/graphql', () => ({
  useAddCommentMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

const makePost = (createdAt: string) => ({
  id: 'p',
  content: 'hi',
  createdAt,
  likesCount: 0,
  author: { id: 'u', name: 'alice' },
  comments: [],
})

describe('PostCard relative time formatting', () => {
  it("shows 'just now' for <1min", () => {
    renderWithProviders(<PostCard post={makePost(new Date().toISOString())} />)
    expect(screen.getByText(/just now/i)).toBeInTheDocument()
  })

  it('shows minutes ago', () => {
    const d = new Date(Date.now() - 5 * 60_000).toISOString()
    renderWithProviders(<PostCard post={makePost(d)} />)
    expect(screen.getByText(/5m ago/)).toBeInTheDocument()
  })

  it('shows hours ago', () => {
    const d = new Date(Date.now() - 3 * 60 * 60_000).toISOString()
    renderWithProviders(<PostCard post={makePost(d)} />)
    expect(screen.getByText(/3h ago/)).toBeInTheDocument()
  })

  it('shows days ago', () => {
    const d = new Date(Date.now() - 4 * 24 * 60 * 60_000).toISOString()
    renderWithProviders(<PostCard post={makePost(d)} />)
    expect(screen.getByText(/4d ago/)).toBeInTheDocument()
  })

  it("shows singular '1 comment' when exactly 1", () => {
    renderWithProviders(
      <PostCard
        post={{
          ...makePost(new Date().toISOString()),
          comments: [{ id: 'c', content: 'x', author: { id: 'u2', name: 'bob' } }],
        }}
      />,
    )
    expect(screen.getByRole('button', { name: /^1 comment$/i })).toBeInTheDocument()
  })
})
