import { Module } from "@nestjs/common";
import { CommentResolver } from "./comment.resolver";
import { CommentService } from "./comment.service";

@Module({
  providers: [CommentResolver, CommentService],
  exports: [CommentService],
})
export class CommentModule {}
