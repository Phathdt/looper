import { UserType } from '@modules/user'
import { Field, ID, ObjectType } from '@nestjs/graphql'

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
