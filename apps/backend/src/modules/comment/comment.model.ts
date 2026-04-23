import { Field, ID, ObjectType } from "@nestjs/graphql";
import { User } from "../user/user.model";

@ObjectType()
export class Comment {
  @Field(() => ID)
  id!: string;

  @Field()
  content!: string;

  @Field()
  createdAt!: Date;

  @Field(() => User)
  author!: User;
}
