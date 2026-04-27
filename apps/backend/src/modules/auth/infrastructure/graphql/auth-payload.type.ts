import { UserType } from '@modules/user'
import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType('AuthPayload')
export class AuthPayloadType {
  @Field()
  token!: string

  @Field(() => UserType)
  user!: UserType
}
