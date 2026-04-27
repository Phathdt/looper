import { AuthPayloadType } from '@graphql/auth-payload.type'
import { IAuthService, LoginInput, loginSchema, RegisterInput, registerSchema } from '@modules/auth'
import { Args, Mutation, Resolver } from '@nestjs/graphql'

import { ZodValidationPipe } from 'nestjs-zod'

@Resolver(() => AuthPayloadType)
export class AuthResolver {
  constructor(private readonly auth: IAuthService) {}

  @Mutation(() => AuthPayloadType)
  register(@Args('input', new ZodValidationPipe(registerSchema)) input: RegisterInput) {
    return this.auth.register(input)
  }

  @Mutation(() => AuthPayloadType)
  login(@Args('input', new ZodValidationPipe(loginSchema)) input: LoginInput) {
    return this.auth.login(input)
  }
}
