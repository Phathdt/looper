import { Field, ObjectType } from "@nestjs/graphql";
import { User } from "../../user/user.model";

@ObjectType()
export class AuthPayload {
  @Field()
  token!: string;

  @Field(() => User)
  user!: User;
}
