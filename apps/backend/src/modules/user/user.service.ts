import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  postsByAuthor(authorId: string, first = 20) {
    return this.prisma.post.findMany({
      where: { authorId },
      orderBy: { createdAt: "desc" },
      take: first,
    });
  }
}
