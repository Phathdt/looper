import { renderWithProviders } from '@test/test-utils'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { PostCard } from '@/features/feed/post-card'

import { describe, expect, it, vi } from 'vitest'

const addCommentMutate = vi.fn()
const likeMutate = vi.fn()
const unlikeMutate = vi.fn()

vi.mock('@/generated/graphql', () => ({
  useAddCommentMutation: () => ({ mutate: addCommentMutate, isPending: false }),
  useLikePostMutation: (opts?: { onMutate?: () => void }) => ({
    mutate: (vars: unknown) => {
      opts?.onMutate?.()
      likeMutate(vars)
    },
    isPending: false,
  }),
  useUnlikePostMutation: (opts?: { onMutate?: () => void }) => ({
    mutate: (vars: unknown) => {
      opts?.onMutate?.()
      unlikeMutate(vars)
    },
    isPending: false,
  }),
}))

const basePost = {
  id: 'p1',
  content: 'hello world',
  createdAt: new Date().toISOString(),
  likesCount: 3,
  isLiked: false,
  author: { id: 'u1', name: 'alice' },
  comments: [
    { id: 'c1', content: 'first', author: { id: 'u2', name: 'bob' } },
    { id: 'c2', content: 'second', author: { id: 'u2', name: 'bob' } },
  ],
}

function renderCard(post = basePost) {
  return renderWithProviders(<PostCard post={post} />)
}

describe('<PostCard />', () => {
  it('renders author and content', () => {
    renderCard()
    expect(screen.getByText('alice')).toBeInTheDocument()
    expect(screen.getByText('hello world')).toBeInTheDocument()
  })

  it('shows comment count toggle', async () => {
    renderCard()
    const toggle = screen.getByRole('button', { name: /2 comments/i })
    expect(screen.queryByText('first')).not.toBeInTheDocument()
    await userEvent.click(toggle)
    expect(screen.getByText('first')).toBeInTheDocument()
    expect(screen.getByText('second')).toBeInTheDocument()
  })

  it('submits a new comment', async () => {
    renderCard()
    await userEvent.click(screen.getByRole('button', { name: /2 comments/i }))
    const input = screen.getByLabelText(/add a comment/i)
    await userEvent.type(input, 'great post')
    await userEvent.click(screen.getByRole('button', { name: /send/i }))
    expect(addCommentMutate).toHaveBeenCalledWith({ postId: 'p1', content: 'great post' })
  })

  it("shows 'no comments yet' when empty and expanded", async () => {
    renderCard({ ...basePost, comments: [] })
    await userEvent.click(screen.getByRole('button', { name: /no comments/i }))
    expect(screen.getByText(/no comments yet/i)).toBeInTheDocument()
  })

  it('renders like button with initial count and unliked state', () => {
    renderCard()
    const button = screen.getByTestId('like-button')
    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByTestId('like-count')).toHaveTextContent('3')
  })

  it('renders liked state when post.isLiked is true', () => {
    renderCard({ ...basePost, isLiked: true })
    const button = screen.getByTestId('like-button')
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })

  it('clicking like increments count and triggers likePost mutation', async () => {
    likeMutate.mockClear()
    renderCard()
    await userEvent.click(screen.getByTestId('like-button'))
    expect(likeMutate).toHaveBeenCalledWith({ postId: 'p1' })
    expect(screen.getByTestId('like-count')).toHaveTextContent('4')
    expect(screen.getByTestId('like-button')).toHaveAttribute('aria-pressed', 'true')
  })

  it('clicking unlike on already-liked post decrements and triggers unlikePost', async () => {
    unlikeMutate.mockClear()
    renderCard({ ...basePost, isLiked: true })
    await userEvent.click(screen.getByTestId('like-button'))
    expect(unlikeMutate).toHaveBeenCalledWith({ postId: 'p1' })
    expect(screen.getByTestId('like-count')).toHaveTextContent('2')
    expect(screen.getByTestId('like-button')).toHaveAttribute('aria-pressed', 'false')
  })
})
