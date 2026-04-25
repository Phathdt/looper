import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'

import { useCreatePostMutation } from '@/generated/graphql'

import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

export const createPostSchema = z.object({
  content: z.string().trim().min(1, 'Content is required').max(1000, 'Content must be 1000 characters or fewer'),
})

export type CreatePostValues = z.infer<typeof createPostSchema>

export function useCreatePost() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<CreatePostValues>({
    resolver: zodResolver(createPostSchema),
    defaultValues: { content: '' },
  })

  const { mutate, isPending } = useCreatePostMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Feed.infinite'] })
      navigate('/')
    },
    onError: (err) => {
      setServerError(err instanceof Error ? err.message : 'Failed to create post')
    },
  })

  const submit = form.handleSubmit(({ content }) => {
    setServerError(null)
    mutate({ content })
  })

  return { form, submit, isPending, serverError, cancel: () => navigate('/') }
}
