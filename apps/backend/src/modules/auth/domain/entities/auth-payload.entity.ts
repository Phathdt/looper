import { Field, ObjectType } from "@nestjs/graphql";
import { z } from "zod";
import { User, userEntitySchema } from "../../../user/domain/entities/user.entity";

export const authPayloadSchema = z.object({
  token: z.string(),
  user: userEntitySchema,
});

export type AuthPayloadType = z.infer<typeof authPayloadSchema>;

@ObjectType()
export class AuthPayload implements AuthPayloadType {
  @Field()
  token!: string;

  @Field(() => User)
  user!: User;
}
