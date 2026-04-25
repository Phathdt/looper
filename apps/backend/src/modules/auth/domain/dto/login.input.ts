import { Field, InputType } from '@nestjs/graphql'

import { z } from 'zod'

// Matches validator.js isEmail behavior (accepts short TLDs like x@x.x)
const emailSchema = z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email')

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6),
})

export type LoginInputType = z.infer<typeof loginSchema>

@InputType()
export class LoginInput implements LoginInputType {
  @Field()
  email!: string

  @Field()
  password!: string
}
