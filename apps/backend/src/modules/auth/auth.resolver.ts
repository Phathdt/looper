import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { AuthService } from "./auth.service";
import { AuthPayload } from "./dto/auth.payload";
import { RegisterInput } from "./dto/register.input";
import { LoginInput } from "./dto/login.input";

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
