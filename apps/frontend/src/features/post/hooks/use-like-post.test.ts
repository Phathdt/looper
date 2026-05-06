import { createWrapper } from '@test/test-utils'
import { act, renderHook } from '@testing-library/react'

import { useLikePost } from '@/features/post/hooks/use-like-post'

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockInvalidateQueries = vi.fn()

let likeOptions: { onMutate?: () => void; onError?: () => void; onSuccess?: () => void } = {}
let unlikeOptions: { onMutate?: () => void; onError?: () => void; onSuccess?: () => void } = {}
const likeMutate = vi.fn()
const unlikeMutate = vi.fn()

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
  }
})

vi.mock('@/generated/graphql', () => ({
  useLikePostMutation: (opts: typeof likeOptions) => {
    likeOptions = opts
    return { mutate: likeMutate, isPending: false }
  },
  useUnlikePostMutation: (opts: typeof unlikeOptions) => {
    unlikeOptions = opts
    return { mutate: unlikeMutate, isPending: false }
  },
}))

describe('useLikePost', () => {
  beforeEach(() => {
    likeMutate.mockReset()
    unlikeMutate.mockReset()
    mockInvalidateQueries.mockReset()
    likeOptions = {}
    unlikeOptions = {}
  })

  it('initializes with provided values', () => {
    const { result } = renderHook(() => useLikePost({ postId: '123', initialLiked: true, initialCount: 5 }), {
      wrapper: createWrapper(),
    })
    expect(result.current.liked).toBe(true)
    expect(result.current.count).toBe(5)
    expect(result.current.isPending).toBe(false)
  })

  it('toggles to like when not liked', async () => {
    const { result } = renderHook(() => useLikePost({ postId: '123', initialLiked: false, initialCount: 5 }), {
      wrapper: createWrapper(),
    })
    await act(async () => {
      result.current.toggle()
    })
    expect(likeMutate).toHaveBeenCalledWith({ postId: '123' })
  })

  it('toggles to unlike when liked', async () => {
    const { result } = renderHook(() => useLikePost({ postId: '123', initialLiked: true, initialCount: 5 }), {
      wrapper: createWrapper(),
    })
    await act(async () => {
      result.current.toggle()
    })
    expect(unlikeMutate).toHaveBeenCalledWith({ postId: '123' })
  })

  it('optimistically updates on like mutate', async () => {
    const { result } = renderHook(() => useLikePost({ postId: '123', initialLiked: false, initialCount: 5 }), {
      wrapper: createWrapper(),
    })
    await act(async () => {
      likeOptions.onMutate?.()
    })
    expect(result.current.liked).toBe(true)
    expect(result.current.count).toBe(6)
  })

  it('optimistically updates on unlike mutate', async () => {
    const { result } = renderHook(() => useLikePost({ postId: '123', initialLiked: true, initialCount: 5 }), {
      wrapper: createWrapper(),
    })
    await act(async () => {
      unlikeOptions.onMutate?.()
    })
    expect(result.current.liked).toBe(false)
    expect(result.current.count).toBe(4)
  })

  it('rollsback like on error', async () => {
    const { result } = renderHook(() => useLikePost({ postId: '123', initialLiked: false, initialCount: 5 }), {
      wrapper: createWrapper(),
    })
    await act(async () => {
      likeOptions.onMutate?.()
    })
    expect(result.current.liked).toBe(true)
    expect(result.current.count).toBe(6)

    await act(async () => {
      likeOptions.onError?.()
    })
    expect(result.current.liked).toBe(false)
    expect(result.current.count).toBe(5)
  })

  it('rollsback unlike on error', async () => {
    const { result } = renderHook(() => useLikePost({ postId: '123', initialLiked: true, initialCount: 5 }), {
      wrapper: createWrapper(),
    })
    await act(async () => {
      unlikeOptions.onMutate?.()
    })
    expect(result.current.liked).toBe(false)
    expect(result.current.count).toBe(4)

    await act(async () => {
      unlikeOptions.onError?.()
    })
    expect(result.current.liked).toBe(true)
    expect(result.current.count).toBe(5)
  })

  it('does not allow count to go below zero on unlike error', async () => {
    const { result } = renderHook(() => useLikePost({ postId: '123', initialLiked: true, initialCount: 0 }), {
      wrapper: createWrapper(),
    })
    await act(async () => {
      unlikeOptions.onMutate?.()
    })
    expect(result.current.count).toBe(0)

    await act(async () => {
      unlikeOptions.onError?.()
    })
    expect(result.current.count).toBe(1)
  })

  it('invalidates Feed and User queries on like success', async () => {
    renderHook(() => useLikePost({ postId: '123', initialLiked: false, initialCount: 5 }), {
      wrapper: createWrapper(),
    })
    await act(async () => {
      likeOptions.onSuccess?.()
    })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['Feed.infinite'] })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['User'] })
  })

  it('invalidates Feed and User queries on unlike success', async () => {
    renderHook(() => useLikePost({ postId: '123', initialLiked: true, initialCount: 5 }), {
      wrapper: createWrapper(),
    })
    await act(async () => {
      unlikeOptions.onSuccess?.()
    })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['Feed.infinite'] })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['User'] })
  })
})
