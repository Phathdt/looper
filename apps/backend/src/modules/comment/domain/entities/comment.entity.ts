import { User } from '@modules/user'
import { Field, ID, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class Comment {
  @Field(() => ID)
  id!: string

  @Field()
  content!: string

  @Field()
  createdAt!: Date

  @Field(() => User)
  author!: User
}
