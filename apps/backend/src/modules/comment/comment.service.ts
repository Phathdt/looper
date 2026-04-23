import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  create(authorId: string, postId: string, content: string) {
    return this.prisma.comment.create({ data: { authorId, postId, content } });
  }
}
