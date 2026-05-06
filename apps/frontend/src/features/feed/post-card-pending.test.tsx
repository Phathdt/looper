import { renderWithProviders } from '@test/test-utils'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { PostCard } from '@/features/feed/post-card'

import { describe, expect, it, vi } from 'vitest'

vi.mock('@/generated/graphql', () => ({
  useAddCommentMutation: () => ({ mutate: vi.fn(), isPending: true }),
  useLikePostMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useUnlikePostMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

const post = {
  id: 'p1',
  content: 'hi',
  createdAt: new Date().toISOString(),
  likesCount: 0,
  isLiked: false,
  author: { id: 'u', name: 'alice' },
  comments: [],
}

describe('<PostCard /> comment submit pending state', () => {
  it("shows '…' label and disables send button while comment mutation pending", async () => {
    renderWithProviders(<PostCard post={post} />)
    await userEvent.click(screen.getByRole('button', { name: /no comments/i }))
    const sendButton = screen.getByRole('button', { name: /^…$/ })
    expect(sendButton).toBeDisabled()
  })
})
