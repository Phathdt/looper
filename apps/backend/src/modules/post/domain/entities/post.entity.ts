import { Comment } from '@modules/comment'
import { User } from '@modules/user'
import { Field, ID, Int, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class Post {
  @Field(() => ID)
  id!: string

  @Field()
  content!: string

  @Field()
  createdAt!: Date

  @Field(() => User)
  author!: User

  @Field(() => [Comment])
  comments!: Comment[]

  @Field(() => Int)
  likesCount!: number
}
