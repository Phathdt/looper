import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) {}

  create(authorId: string, content: string) {
    return this.prisma.post.create({ data: { authorId, content } });
  }
}
