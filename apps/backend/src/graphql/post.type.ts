import { Field, ID, Int, ObjectType } from '@nestjs/graphql'

import { CommentType } from './comment.type'
import { UserType } from './user.type'

@ObjectType('Post')
export class PostType {
  @Field(() => ID)
  id!: string

  @Field()
  content!: string

  @Field()
  createdAt!: Date

  @Field(() => UserType)
  author?: UserType

  @Field(() => [CommentType])
  comments?: CommentType[]

  @Field(() => Int)
  likesCount?: number
}
