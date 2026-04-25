import { Field, InputType } from '@nestjs/graphql'

import { z } from 'zod'

// Matches validator.js isEmail behavior (accepts short TLDs like x@x.x)
const emailSchema = z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email')

export const registerSchema = z.object({
  name: z.string().min(2),
  email: emailSchema,
  password: z.string().min(6),
})

export type RegisterInputType = z.infer<typeof registerSchema>

@InputType()
export class RegisterInput implements RegisterInputType {
  @Field()
  name!: string

  @Field()
  email!: string

  @Field()
  password!: string
}
