import { Field, ObjectType } from '@nestjs/graphql'

import { User } from '../../../user/domain/entities/user.entity'

@ObjectType()
export class AuthPayload {
  @Field()
  token!: string

  @Field(() => User)
  user!: User
}
