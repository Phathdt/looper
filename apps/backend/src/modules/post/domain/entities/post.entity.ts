import { Field, ID, Int, ObjectType } from "@nestjs/graphql";
import { User } from "../../../user/domain/entities/user.entity";
import { Comment } from "../../../comment/domain/entities/comment.entity";

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
