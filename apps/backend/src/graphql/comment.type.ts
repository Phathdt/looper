import { Field, ID, ObjectType } from '@nestjs/graphql'

import { UserType } from './user.type'

@ObjectType('Comment')
export class CommentType {
  @Field(() => ID)
  id!: string

  @Field()
  content!: string

  @Field()
  createdAt!: Date

  @Field(() => UserType)
  author?: UserType
}
