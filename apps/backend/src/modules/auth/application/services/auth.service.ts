import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcryptjs";
import { UserRepository } from "../../../user/domain/interfaces/user.repository";
import { RegisterInput } from "../../domain/dto/register.input";
import { LoginInput } from "../../domain/dto/login.input";
import { EmailAlreadyRegisteredError, InvalidCredentialsError } from "../../domain/errors";

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly jwt: JwtService,
  ) {}

  async register(input: RegisterInput) {
    const existing = await this.users.findByEmail(input.email);
    if (existing) throw new EmailAlreadyRegisteredError();

    const password = await bcrypt.hash(input.password, 10);
    const user = await this.users.create({ name: input.name, email: input.email, password });
    return this.sign(user);
  }

  async login(input: LoginInput) {
    const user = await this.users.findByEmail(input.email);
    if (!user) throw new InvalidCredentialsError();

    const ok = await bcrypt.compare(input.password, user.password);
    if (!ok) throw new InvalidCredentialsError();

    return this.sign(user);
  }

  private sign(user: { id: string; email: string; name: string; createdAt: Date }) {
    const token = this.jwt.sign({ sub: user.id, email: user.email });
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        followersCount: 0,
        isFollowing: false,
      },
    };
  }
}
