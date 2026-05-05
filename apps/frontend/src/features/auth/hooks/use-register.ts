import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'

import { useRegisterMutation } from '@/generated/graphql'
import { authStore } from '@/lib/auth-store'

import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type RegisterValues = z.infer<typeof registerSchema>

export function useRegister() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
    mode: 'onChange',
  })

  const { mutate, isPending } = useRegisterMutation({
    onSuccess: (data) => {
      const { token, user } = data.register
      authStore.getState().setAuth(token, user)
      navigate('/')
    },
    onError: (err) => {
      setServerError(err instanceof Error ? err.message : 'Registration failed')
    },
  })

  const submit = form.handleSubmit((values) => {
    setServerError(null)
    mutate({ input: values })
  })

  return { form, submit, isPending, serverError }
}
