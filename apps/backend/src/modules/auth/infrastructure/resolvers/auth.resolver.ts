import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { AuthService } from "../../application/services/auth.service";
import { AuthPayload } from "../../domain/entities/auth-payload.entity";
import { RegisterInput, registerSchema } from "../../domain/dto/register.input";
import { LoginInput, loginSchema } from "../../domain/dto/login.input";
import { ZodValidationPipe } from "../../../../common/zod-validation.pipe";

@Resolver(() => AuthPayload)
export class AuthResolver {
  constructor(private readonly auth: AuthService) {}

  @Mutation(() => AuthPayload)
  register(@Args("input", new ZodValidationPipe(registerSchema)) input: RegisterInput) {
    return this.auth.register(input);
  }

  @Mutation(() => AuthPayload)
  login(@Args("input", new ZodValidationPipe(loginSchema)) input: LoginInput) {
    return this.auth.login(input);
  }
}
