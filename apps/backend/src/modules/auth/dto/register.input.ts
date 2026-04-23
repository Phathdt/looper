import { Field, InputType } from "@nestjs/graphql";
import { IsEmail, MinLength } from "class-validator";

@InputType()
export class RegisterInput {
  @Field()
  @MinLength(2)
  name!: string;

  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @MinLength(6)
  password!: string;
}
