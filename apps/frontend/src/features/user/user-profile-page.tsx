import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRelativeTime } from '@/lib/format'

import { useParams } from 'react-router-dom'

import { useUserProfile } from './hooks/use-user-profile'

function ProfileSkeleton() {
  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center gap-4'>
        <Skeleton className='h-16 w-16 rounded-full' />
        <div className='flex flex-col gap-2'>
          <Skeleton className='h-5 w-32' />
          <Skeleton className='h-4 w-24' />
        </div>
      </div>
      <div className='flex flex-col gap-3'>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className='h-20 w-full rounded-lg' />
        ))}
      </div>
    </div>
  )
}

export function UserProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { user, isLoading, error, isSelf, mutating, isFollowing, isUnfollowing, follow, unfollow } = useUserProfile(id)

  if (isLoading) {
    return (
      <div className='max-w-xl mx-auto px-4 py-6'>
        <ProfileSkeleton />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className='max-w-xl mx-auto px-4 py-6'>
        <p className='text-sm text-destructive' role='alert'>
          Failed to load profile.
        </p>
      </div>
    )
  }

  return (
    <div className='max-w-xl mx-auto px-4 py-6 flex flex-col gap-6'>
      <div className='flex items-center justify-between gap-4'>
        <div className='flex items-center gap-4'>
          <Avatar name={user.name} className='h-16 w-16 text-2xl' />
          <div className='flex flex-col gap-0.5'>
            <h2 className='text-lg font-semibold leading-none'>{user.name}</h2>
            <span className='text-sm text-muted-foreground'>{user.email}</span>
            <span className='text-sm text-muted-foreground mt-1'>
              {user.followersCount} follower{user.followersCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {!isSelf && (
          <div>
            {user.isFollowing ? (
              <Button variant='outline' size='sm' disabled={mutating} onClick={unfollow}>
                {isUnfollowing ? 'Unfollowing…' : 'Unfollow'}
              </Button>
            ) : (
              <Button size='sm' disabled={mutating} onClick={follow}>
                {isFollowing ? 'Following…' : 'Follow'}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className='flex flex-col gap-3'>
        <h3 className='text-sm font-medium text-muted-foreground uppercase tracking-wide'>Posts</h3>
        {user.posts.length === 0 ? (
          <p className='text-sm text-muted-foreground'>No posts yet.</p>
        ) : (
          user.posts.map((post) => (
            <Card key={post.id}>
              <CardContent className='pt-4 flex flex-col gap-2'>
                <p className='text-sm leading-relaxed whitespace-pre-wrap'>{post.content}</p>
                <div className='flex items-center gap-3 text-xs text-muted-foreground'>
                  <span>{post.likesCount} likes</span>
                  <span>{formatRelativeTime(post.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
