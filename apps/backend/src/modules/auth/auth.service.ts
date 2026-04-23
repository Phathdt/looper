import { Injectable, UnauthorizedException, ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterInput } from "./dto/register.input";
import { LoginInput } from "./dto/login.input";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(input: RegisterInput) {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictException("Email already registered");

    const password = await bcrypt.hash(input.password, 10);
    const user = await this.prisma.user.create({
      data: { name: input.name, email: input.email, password },
    });
    return this.sign(user);
  }

  async login(input: LoginInput) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw new UnauthorizedException("Invalid credentials");

    const ok = await bcrypt.compare(input.password, user.password);
    if (!ok) throw new UnauthorizedException("Invalid credentials");

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
