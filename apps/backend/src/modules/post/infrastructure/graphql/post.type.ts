import { CommentType } from '@modules/comment'
import { UserType } from '@modules/user'
import { Field, ID, Int, ObjectType } from '@nestjs/graphql'

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
