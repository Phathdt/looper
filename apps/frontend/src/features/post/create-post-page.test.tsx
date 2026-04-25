import { renderWithProviders } from '@test/test-utils'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CreatePostPage } from '@/features/post/create-post-page'

import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mutate = vi.fn()
let mutationOptions: { onSuccess?: () => void; onError?: (e: Error) => void } = {}

vi.mock('@/generated/graphql', () => ({
  useCreatePostMutation: (opts: typeof mutationOptions) => {
    mutationOptions = opts
    return { mutate, isPending: false }
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
})
