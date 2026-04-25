import { NotFoundException } from "@nestjs/common";

export class CommentNotFoundError extends NotFoundException {
  constructor(id: string) {
    super(`Comment not found: ${id}`);
  }
}
