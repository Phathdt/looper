import { Field, ID, Int, ObjectType } from "@nestjs/graphql";
import { z } from "zod";

export const userEntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  createdAt: z.date(),
  followersCount: z.number().int(),
  isFollowing: z.boolean(),
});

export type UserEntityType = z.infer<typeof userEntitySchema>;

@ObjectType()
export class User implements UserEntityType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  email!: string;

  @Field()
  createdAt!: Date;

  @Field(() => Int)
  followersCount!: number;

  @Field()
  isFollowing!: boolean;
}
