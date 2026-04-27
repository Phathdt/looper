import { Args, Mutation, Resolver } from '@nestjs/graphql'

import { ZodValidationPipe } from 'nestjs-zod'

import { LoginInput, loginSchema } from '../../domain/dto/login.input'
import { RegisterInput, registerSchema } from '../../domain/dto/register.input'
import { IAuthService } from '../../domain/interfaces/auth.service'
import { AuthPayloadType } from '../graphql/auth-payload.type'

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
