import { renderWithProviders } from '@test/test-utils'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CreatePostPage } from '@/features/post/create-post-page'

import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mutate = vi.fn()
let mutationOptions: { onSuccess?: () => void; onError?: (e: Error) => void } = {}
let isPending = false

vi.mock('@/generated/graphql', () => ({
  useCreatePostMutation: (opts: typeof mutationOptions) => {
    mutationOptions = opts
    return {
      mutate,
      get isPending() {
        return isPending
      },
    }
  },
}))

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path='/create' element={<CreatePostPage />} />
      <Route path='/' element={<div>HOME</div>} />
    </Routes>,
    { initialPath: '/create' },
  )
}

describe('<CreatePostPage />', () => {
  beforeEach(() => {
    mutate.mockReset()
  })

  it('disables submit with empty content', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /^post$/i })).toBeDisabled()
  })

  it('submits post content', async () => {
    renderPage()
    await userEvent.type(screen.getByPlaceholderText(/mind/i), 'Hello world')
    await userEvent.click(screen.getByRole('button', { name: /^post$/i }))
    expect(mutate).toHaveBeenCalledWith({ content: 'Hello world' })
  })

  it('navigates home on success', async () => {
    renderPage()
    await userEvent.type(screen.getByPlaceholderText(/mind/i), 'hi')
    await userEvent.click(screen.getByRole('button', { name: /^post$/i }))
    mutationOptions.onSuccess?.()
    expect(await screen.findByText('HOME')).toBeInTheDocument()
  })

  it('shows server error', async () => {
    renderPage()
    await userEvent.type(screen.getByPlaceholderText(/mind/i), 'hi')
    await userEvent.click(screen.getByRole('button', { name: /^post$/i }))
    mutationOptions.onError?.(new Error('Server boom'))
    expect(await screen.findByRole('alert')).toHaveTextContent(/boom/i)
  })

  it('falls back to generic error when err not Error', async () => {
    renderPage()
    await userEvent.type(screen.getByPlaceholderText(/mind/i), 'hi')
    await userEvent.click(screen.getByRole('button', { name: /^post$/i }))
    mutationOptions.onError?.('x' as unknown as Error)
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('shows posting state when mutation is pending', () => {
    isPending = true
    renderPage()
    expect(screen.getByRole('button', { name: /posting/i })).toBeDisabled()
    isPending = false
  })

  it('disables cancel button when mutation is pending', () => {
    isPending = true
    renderPage()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled()
    isPending = false
  })

  it('clears server error on successful submit', async () => {
    renderPage()
    await userEvent.type(screen.getByPlaceholderText(/mind/i), 'hi')
    await userEvent.click(screen.getByRole('button', { name: /^post$/i }))
    mutationOptions.onError?.(new Error('Previous error'))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    await userEvent.clear(screen.getByPlaceholderText(/mind/i))
    await userEvent.type(screen.getByPlaceholderText(/mind/i), 'new post')
    await userEvent.click(screen.getByRole('button', { name: /^post$/i }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
