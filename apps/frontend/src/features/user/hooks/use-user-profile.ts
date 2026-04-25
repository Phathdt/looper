import { useQueryClient } from '@tanstack/react-query'

import { useFollowMutation, useUnfollowMutation, useUserQuery } from '@/generated/graphql'
import { authStore } from '@/lib/auth-store'

export function useUserProfile(userId: string | undefined) {
  const queryClient = useQueryClient()
  const currentUser = authStore((state) => state.user)

  const { data, isLoading, error } = useUserQuery({ id: userId ?? '' }, { enabled: Boolean(userId) })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['User'] })

  const { mutate: followMutate, isPending: isFollowing } = useFollowMutation({
    onSuccess: invalidate,
  })
  const { mutate: unfollowMutate, isPending: isUnfollowing } = useUnfollowMutation({
    onSuccess: invalidate,
  })

  const user = data?.user
  const isSelf = currentUser?.id === user?.id
  const mutating = isFollowing || isUnfollowing

  return {
    user,
    isLoading,
    error,
    isSelf,
    mutating,
    isFollowing,
    isUnfollowing,
    follow: () => user && followMutate({ userId: user.id }),
    unfollow: () => user && unfollowMutate({ userId: user.id }),
  }
}
