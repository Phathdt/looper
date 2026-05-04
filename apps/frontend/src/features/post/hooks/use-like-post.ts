import { useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { useLikePostMutation, useUnlikePostMutation } from '@/generated/graphql'

interface UseLikePostArgs {
  postId: string
  initialLiked: boolean
  initialCount: number
}

export function useLikePost({ postId, initialLiked, initialCount }: UseLikePostArgs) {
  const queryClient = useQueryClient()
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['Feed.infinite'] })
    queryClient.invalidateQueries({ queryKey: ['User'] })
  }

  const { mutate: likeMutate, isPending: liking } = useLikePostMutation({
    onMutate: () => {
      setLiked(true)
      setCount((c) => c + 1)
    },
    onError: () => {
      setLiked(false)
      setCount((c) => Math.max(0, c - 1))
    },
    onSuccess: invalidate,
  })

  const { mutate: unlikeMutate, isPending: unliking } = useUnlikePostMutation({
    onMutate: () => {
      setLiked(false)
      setCount((c) => Math.max(0, c - 1))
    },
    onError: () => {
      setLiked(true)
      setCount((c) => c + 1)
    },
    onSuccess: invalidate,
  })

  const toggle = () => {
    if (liked) unlikeMutate({ postId })
    else likeMutate({ postId })
  }

  return { liked, count, toggle, isPending: liking || unliking }
}
