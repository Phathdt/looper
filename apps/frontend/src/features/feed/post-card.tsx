import { useState } from 'react'

import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAddComment } from '@/features/post/hooks/use-add-comment'
import { useLikePost } from '@/features/post/hooks/use-like-post'
import type { FeedQuery } from '@/generated/graphql'
import { formatRelativeTime } from '@/lib/format'

import { Link } from 'react-router-dom'

type PostNode = FeedQuery['feed']['edges'][number]['node']

interface PostCardProps {
  post: PostNode
}

export function PostCard({ post }: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const { form, submit, isPending } = useAddComment(post.id)
  const {
    register,
    formState: { isValid },
  } = form
  const commentCount = post.comments.length
  const {
    liked,
    count,
    toggle,
    isPending: likePending,
  } = useLikePost({
    postId: post.id,
    initialLiked: post.isLiked,
    initialCount: post.likesCount,
  })

  return (
    <Card data-testid='post-card'>
      <CardHeader className='pb-2'>
        <div className='flex items-center gap-3'>
          <Avatar name={post.author.name} />
          <div className='flex flex-col'>
            <Link to={`/user/${post.author.id}`} className='text-sm font-medium leading-none hover:underline'>
              {post.author.name}
            </Link>
            <span className='text-xs text-muted-foreground mt-0.5'>{formatRelativeTime(post.createdAt)}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className='flex flex-col gap-3'>
        <p className='text-sm leading-relaxed whitespace-pre-wrap'>{post.content}</p>

        <div className='flex items-center gap-4 text-xs text-muted-foreground'>
          <button
            type='button'
            onClick={toggle}
            disabled={likePending}
            data-testid='like-button'
            aria-pressed={liked}
            aria-label={liked ? 'Unlike post' : 'Like post'}
            className={`flex items-center gap-1 transition-colors disabled:opacity-50 ${
              liked ? 'text-red-500' : 'hover:text-foreground'
            }`}
          >
            <span aria-hidden='true'>{liked ? '♥' : '♡'}</span>
            <span data-testid='like-count'>{count}</span>
            <span className='sr-only'>likes</span>
          </button>
          <button
            type='button'
            onClick={() => setShowComments((v) => !v)}
            className='hover:text-foreground transition-colors'
            aria-expanded={showComments}
          >
            {commentCount === 0 ? 'No comments' : `${commentCount} comment${commentCount !== 1 ? 's' : ''}`}
          </button>
        </div>

        {showComments && (
          <>
            {commentCount > 0 ? (
              <ul className='flex flex-col gap-2 border-t pt-3' aria-label='Comments'>
                {post.comments.map((comment) => (
                  <li key={comment.id} className='flex items-start gap-2'>
                    <Avatar name={comment.author.name} className='h-6 w-6 text-[10px] shrink-0 mt-0.5' />
                    <div className='flex flex-col'>
                      <span className='text-xs font-medium'>{comment.author.name}</span>
                      <span className='text-xs text-muted-foreground'>{comment.content}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className='text-xs text-muted-foreground border-t pt-3'>No comments yet.</p>
            )}

            <form onSubmit={submit} className='flex gap-2 pt-2' noValidate>
              <Input placeholder='Add a comment…' aria-label='Add a comment' {...register('text')} />
              <Button type='submit' size='sm' disabled={isPending || !isValid}>
                {isPending ? '…' : 'Send'}
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  )
}
