import { Field, ID, ObjectType } from "@nestjs/graphql";
import { z } from "zod";
import { User, userEntitySchema } from "../../../user/domain/entities/user.entity";

export const commentEntitySchema = z.object({
  id: z.string(),
  content: z.string(),
  createdAt: z.date(),
  author: userEntitySchema,
});

export type CommentEntityType = z.infer<typeof commentEntitySchema>;

@ObjectType()
export class Comment implements CommentEntityType {
  @Field(() => ID)
  id!: string;

  @Field()
  content!: string;

  @Field()
  createdAt!: Date;

  @Field(() => User)
  author!: User;
}
