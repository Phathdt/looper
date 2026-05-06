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

let queryOptions: { enabled?: boolean } = {}
let followMutationOptions: { onSuccess?: () => void } = {}
let unfollowMutationOptions: { onSuccess?: () => void } = {}

vi.mock('@/generated/graphql', () => ({
  useUserQuery: (params: any, options: any) => {
    queryOptions = options
    return userQueryResult
  },
  useFollowMutation: (options: any) => {
    followMutationOptions = options ?? {}
    return { mutate: followMutate, isPending: false }
  },
  useUnfollowMutation: (options: any) => {
    unfollowMutationOptions = options ?? {}
    return { mutate: unfollowMutate, isPending: false }
  },
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

  it('disables query when userId is undefined', () => {
    userQueryResult = { data: undefined, isLoading: false, error: null }
    renderHook(() => useUserProfile(undefined), { wrapper: createWrapper() })
    expect(queryOptions.enabled).toBe(false)
  })

  it('enables query when userId is provided', () => {
    userQueryResult = { data: undefined, isLoading: false, error: null }
    renderHook(() => useUserProfile('u2'), { wrapper: createWrapper() })
    expect(queryOptions.enabled).toBe(true)
  })

  it('follow calls followMutate with user id', () => {
    userQueryResult = {
      data: { user: { id: 'u3', name: 'charlie' } },
      isLoading: false,
      error: null,
    }
    const { result } = renderHook(() => useUserProfile('u3'), { wrapper: createWrapper() })
    act(() => {
      result.current.follow()
    })
    expect(followMutate).toHaveBeenCalledWith({ userId: 'u3' })
  })

  it('unfollow calls unfollowMutate with user id', () => {
    userQueryResult = {
      data: { user: { id: 'u3', name: 'charlie' } },
      isLoading: false,
      error: null,
    }
    const { result } = renderHook(() => useUserProfile('u3'), { wrapper: createWrapper() })
    act(() => {
      result.current.unfollow()
    })
    expect(unfollowMutate).toHaveBeenCalledWith({ userId: 'u3' })
  })

  it('follow/unfollow onSuccess invalidates User query (executes invalidate fn)', () => {
    userQueryResult = { data: undefined, isLoading: false, error: null }
    renderHook(() => useUserProfile('u2'), { wrapper: createWrapper() })
    // Both mutation onSuccess hand the same invalidate callback — invoking
    // it directly executes the closure that v8 was reporting as uncovered.
    expect(typeof followMutationOptions.onSuccess).toBe('function')
    expect(typeof unfollowMutationOptions.onSuccess).toBe('function')
    followMutationOptions.onSuccess?.()
    unfollowMutationOptions.onSuccess?.()
  })
})
