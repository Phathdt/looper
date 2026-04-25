import { createWrapper } from '@test/test-utils'
import { act, renderHook, waitFor } from '@testing-library/react'

import { useLogin } from '@/features/auth/hooks/use-login'
import { authStore } from '@/lib/auth-store'

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mutate = vi.fn()
let mutationOptions: { onSuccess?: (d: unknown) => void; onError?: (e: Error) => void } = {}

vi.mock('@/generated/graphql', () => ({
  useLoginMutation: (opts: typeof mutationOptions) => {
    mutationOptions = opts
    return { mutate, isPending: false }
  },
}))

describe('useLogin', () => {
  beforeEach(() => {
    mutate.mockReset()
    authStore.getState().clear()
    localStorage.clear()
  })

  function render() {
    return renderHook(() => useLogin(), { wrapper: createWrapper() })
  }

  it('blocks submit when fields empty', async () => {
    const { result } = render()
    await act(async () => {
      await result.current.submit()
    })
    expect(mutate).not.toHaveBeenCalled()
  })

  it('rejects invalid email format', async () => {
    const { result } = render()
    result.current.form.setValue('email', 'not-an-email')
    result.current.form.setValue('password', 'secret123')
    let valid: boolean | undefined
    await act(async () => {
      valid = await result.current.form.trigger()
    })
    expect(valid).toBe(false)
    expect(result.current.form.getFieldState('email').error?.message).toMatch(/invalid/i)
  })

  it('rejects short password', async () => {
    const { result } = render()
    result.current.form.setValue('email', 'a@b.co')
    result.current.form.setValue('password', '12')
    await act(async () => {
      await result.current.form.trigger()
    })
    expect(result.current.form.getFieldState('password').error?.message).toMatch(/6 characters/i)
  })

  it('calls mutate with valid input', async () => {
    const { result } = render()
    result.current.form.setValue('email', 'alice@looper.dev')
    result.current.form.setValue('password', 'password123')
    await act(async () => {
      await result.current.submit()
    })
    expect(mutate).toHaveBeenCalledWith({
      input: { email: 'alice@looper.dev', password: 'password123' },
    })
  })

  it('persists auth on success', async () => {
    const { result } = render()
    result.current.form.setValue('email', 'alice@looper.dev')
    result.current.form.setValue('password', 'password123')
    await act(async () => {
      await result.current.submit()
    })
    act(() =>
      mutationOptions.onSuccess?.({
        login: { token: 'tk', user: { id: '1', name: 'alice', email: 'alice@looper.dev' } },
      }),
    )
    await waitFor(() => expect(authStore.getState().token).toBe('tk'))
  })

  it('captures Error message into serverError', async () => {
    const { result } = render()
    act(() => mutationOptions.onError?.(new Error('Invalid credentials')))
    await waitFor(() => expect(result.current.serverError).toBe('Invalid credentials'))
  })

  it('falls back to generic message when err not Error', async () => {
    const { result } = render()
    act(() => mutationOptions.onError?.('oops' as unknown as Error))
    await waitFor(() => expect(result.current.serverError).toBe('Login failed'))
  })
})
