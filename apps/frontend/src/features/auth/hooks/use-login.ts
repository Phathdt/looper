import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'

import { useLoginMutation } from '@/generated/graphql'
import { authStore } from '@/lib/auth-store'

import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type LoginValues = z.infer<typeof loginSchema>

export function useLogin() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onChange',
  })

  const { mutate, isPending } = useLoginMutation({
    onSuccess: (data) => {
      const { token, user } = data.login
      authStore.getState().setAuth(token, user)
      navigate('/')
    },
    onError: (err) => {
      setServerError(err instanceof Error ? err.message : 'Login failed')
    },
  })

  const submit = form.handleSubmit((values) => {
    setServerError(null)
    mutate({ input: values })
  })

  return { form, submit, isPending, serverError }
}
