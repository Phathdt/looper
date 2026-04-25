import { User } from '@modules/user'
import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class AuthPayload {
  @Field()
  token!: string

  @Field(() => User)
  user!: User
}
