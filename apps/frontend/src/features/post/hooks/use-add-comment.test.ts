import { createWrapper } from '@test/test-utils'
import { act, renderHook, waitFor } from '@testing-library/react'

import { useAddComment } from '@/features/post/hooks/use-add-comment'

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mutate = vi.fn()
let mutationOptions: { onSuccess?: () => void } = {}

vi.mock('@/generated/graphql', () => ({
  useAddCommentMutation: (opts: typeof mutationOptions) => {
    mutationOptions = opts
    return { mutate, isPending: false }
  },
}))

describe('useAddComment', () => {
  beforeEach(() => {
    mutate.mockReset()
    mutationOptions = {}
  })

  it('blocks empty submit', async () => {
    const { result } = renderHook(() => useAddComment('p1'), { wrapper: createWrapper() })
    await act(async () => {
      await result.current.submit()
    })
    expect(mutate).not.toHaveBeenCalled()
  })

  it('submits with postId binding', async () => {
    const { result } = renderHook(() => useAddComment('p123'), { wrapper: createWrapper() })
    result.current.form.setValue('text', 'Nice work')
    await act(async () => {
      await result.current.submit()
    })
    expect(mutate).toHaveBeenCalledWith({ postId: 'p123', content: 'Nice work' })
  })

  it('resets form on success', async () => {
    const { result } = renderHook(() => useAddComment('p1'), { wrapper: createWrapper() })
    result.current.form.setValue('text', 'hi')
    expect(result.current.form.getValues('text')).toBe('hi')

    act(() => mutationOptions.onSuccess?.())
    await waitFor(() => expect(result.current.form.getValues('text')).toBe(''))
  })

  it('rejects content over 500 chars', async () => {
    const { result } = renderHook(() => useAddComment('p1'), { wrapper: createWrapper() })
    result.current.form.setValue('text', 'x'.repeat(501))
    await act(async () => {
      await result.current.submit()
    })
    expect(mutate).not.toHaveBeenCalled()
  })
})
