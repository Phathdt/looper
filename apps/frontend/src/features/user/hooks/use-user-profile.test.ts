import { createWrapper } from '@test/test-utils'
import { act, renderHook } from '@testing-library/react'

import { useUserProfile } from '@/features/user/hooks/use-user-profile'
import { authStore } from '@/lib/auth-store'

import { beforeEach, describe, expect, it, vi } from 'vitest'

let userQueryResult = {
  data: undefined as { user: { id: string; name: string } } | undefined,
  isLoading: true,
  error: null as Error | null,
}
const followMutate = vi.fn()
const unfollowMutate = vi.fn()

vi.mock('@/generated/graphql', () => ({
  useUserQuery: () => userQueryResult,
  useFollowMutation: () => ({ mutate: followMutate, isPending: false }),
  useUnfollowMutation: () => ({ mutate: unfollowMutate, isPending: false }),
}))

describe('useUserProfile', () => {
  beforeEach(() => {
    followMutate.mockReset()
    unfollowMutate.mockReset()
    authStore.getState().setAuth('tok', { id: 'u1', name: 'me', email: 'me@x.x' })
  })

  it('returns loading state initially', () => {
    userQueryResult = { data: undefined, isLoading: true, error: null }
    const { result } = renderHook(() => useUserProfile('u2'), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(true)
    expect(result.current.user).toBeUndefined()
  })

  it('returns user data when loaded', () => {
    userQueryResult = {
      data: { user: { id: 'u2', name: 'bob' } },
      isLoading: false,
      error: null,
    }
    const { result } = renderHook(() => useUserProfile('u2'), { wrapper: createWrapper() })
    expect(result.current.user?.name).toBe('bob')
    expect(result.current.isSelf).toBe(false)
  })

  it('isSelf=true when viewing own profile', () => {
    userQueryResult = {
      data: { user: { id: 'u1', name: 'me' } },
      isLoading: false,
      error: null,
    }
    const { result } = renderHook(() => useUserProfile('u1'), { wrapper: createWrapper() })
    expect(result.current.isSelf).toBe(true)
  })

  it('follow() calls mutation with target user id', () => {
    userQueryResult = {
      data: { user: { id: 'u2', name: 'bob' } },
      isLoading: false,
      error: null,
    }
    const { result } = renderHook(() => useUserProfile('u2'), { wrapper: createWrapper() })
    act(() => result.current.follow())
    expect(followMutate).toHaveBeenCalledWith({ userId: 'u2' })
  })

  it('unfollow() calls mutation with target user id', () => {
    userQueryResult = {
      data: { user: { id: 'u2', name: 'bob' } },
      isLoading: false,
      error: null,
    }
    const { result } = renderHook(() => useUserProfile('u2'), { wrapper: createWrapper() })
    act(() => result.current.unfollow())
    expect(unfollowMutate).toHaveBeenCalledWith({ userId: 'u2' })
  })

  it('follow/unfollow noop when no user', () => {
    userQueryResult = { data: undefined, isLoading: false, error: null }
    const { result } = renderHook(() => useUserProfile('u2'), { wrapper: createWrapper() })
    act(() => result.current.follow())
    act(() => result.current.unfollow())
    expect(followMutate).not.toHaveBeenCalled()
    expect(unfollowMutate).not.toHaveBeenCalled()
  })
})
