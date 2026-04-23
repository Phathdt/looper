import { Field, ID, Int, ObjectType } from "@nestjs/graphql";
import { User } from "../user/user.model";
import { Comment } from "../comment/comment.model";

@ObjectType()
export class Post {
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
