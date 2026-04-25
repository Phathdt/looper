import { Field, ID, Int, ObjectType } from "@nestjs/graphql";
import { z } from "zod";
import { User, userEntitySchema } from "../../../user/domain/entities/user.entity";
import { Comment, commentEntitySchema } from "../../../comment/domain/entities/comment.entity";

export const postEntitySchema = z.object({
  id: z.string(),
  content: z.string(),
  createdAt: z.date(),
  author: userEntitySchema,
  comments: z.array(commentEntitySchema),
  likesCount: z.number().int(),
});

export type PostEntityType = z.infer<typeof postEntitySchema>;

@ObjectType()
export class Post implements PostEntityType {
  @Field(() => ID)
  id!: string;

  @Field()
  content!: string;

  @Field()
  createdAt!: Date;

  @Field(() => User)
  author!: User;

  @Field(() => [Comment])
  comments!: Comment[];

  @Field(() => Int)
  likesCount!: number;
}
