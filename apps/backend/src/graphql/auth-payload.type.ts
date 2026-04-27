import { Field, ObjectType } from '@nestjs/graphql'

import { UserType } from './user.type'

@ObjectType('AuthPayload')
export class AuthPayloadType {
  @Field()
  token!: string

  @Field(() => UserType)
  user!: UserType
}
