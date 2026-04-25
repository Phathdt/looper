import { Field, ID, Int, ObjectType } from '@nestjs/graphql'

import { Comment } from '../../../comment/domain/entities/comment.entity'
import { User } from '../../../user/domain/entities/user.entity'

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
