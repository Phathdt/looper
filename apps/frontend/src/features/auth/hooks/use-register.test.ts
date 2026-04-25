import { createWrapper } from '@test/test-utils'
import { act, renderHook, waitFor } from '@testing-library/react'

import { useRegister } from '@/features/auth/hooks/use-register'
import { authStore } from '@/lib/auth-store'

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mutate = vi.fn()
let mutationOptions: { onSuccess?: (d: unknown) => void; onError?: (e: Error) => void } = {}

vi.mock('@/generated/graphql', () => ({
  useRegisterMutation: (opts: typeof mutationOptions) => {
    mutationOptions = opts
    return { mutate, isPending: false }
  },
}))

describe('useRegister', () => {
  beforeEach(() => {
    mutate.mockReset()
    authStore.getState().clear()
    localStorage.clear()
  })

  function render() {
    return renderHook(() => useRegister(), { wrapper: createWrapper() })
  }

  it('rejects short name', async () => {
    const { result } = render()
    result.current.form.setValue('name', 'A')
    result.current.form.setValue('email', 'x@y.co')
    result.current.form.setValue('password', 'secret123')
    await act(async () => {
      await result.current.form.trigger()
    })
    expect(result.current.form.getFieldState('name').error?.message).toMatch(/2 characters/i)
  })

  it('submits valid input', async () => {
    const { result } = render()
    result.current.form.setValue('name', 'Alice')
    result.current.form.setValue('email', 'alice@looper.dev')
    result.current.form.setValue('password', 'password123')
    await act(async () => {
      await result.current.submit()
    })
    expect(mutate).toHaveBeenCalledWith({
      input: { name: 'Alice', email: 'alice@looper.dev', password: 'password123' },
    })
  })

  it('persists auth on success', async () => {
    const { result } = render()
    result.current.form.setValue('name', 'Alice')
    result.current.form.setValue('email', 'alice@looper.dev')
    result.current.form.setValue('password', 'password123')
    await act(async () => {
      await result.current.submit()
    })
    act(() =>
      mutationOptions.onSuccess?.({
        register: { token: 'tk', user: { id: '1', name: 'Alice', email: 'alice@looper.dev' } },
      }),
    )
    await waitFor(() => expect(authStore.getState().token).toBe('tk'))
  })
})
