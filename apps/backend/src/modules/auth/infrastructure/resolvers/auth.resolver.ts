import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { AuthService } from "../../application/services/auth.service";
import { AuthPayload } from "../../domain/entities/auth-payload.entity";
import { RegisterInput } from "../../domain/dto/register.input";
import { LoginInput } from "../../domain/dto/login.input";

@Resolver(() => AuthPayload)
export class AuthResolver {
  constructor(private readonly auth: AuthService) {}

  @Mutation(() => AuthPayload)
  register(@Args("input") input: RegisterInput) {
    return this.auth.register(input);
  }

  @Mutation(() => AuthPayload)
  login(@Args("input") input: LoginInput) {
    return this.auth.login(input);
  }
}
