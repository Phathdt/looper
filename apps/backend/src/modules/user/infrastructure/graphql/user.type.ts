import { Field, ID, Int, ObjectType } from '@nestjs/graphql'

@ObjectType('User')
export class UserType {
  @Field(() => ID)
  id!: string

  @Field()
  name!: string

  @Field()
  email!: string

  @Field()
  createdAt!: Date

  @Field(() => Int)
  followersCount?: number

  @Field()
  isFollowing?: boolean
}
