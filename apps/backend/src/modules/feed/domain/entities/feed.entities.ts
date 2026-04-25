import { Field, ObjectType } from '@nestjs/graphql'

import { Post } from '../../../post/domain/entities/post.entity'

@ObjectType()
export class PageInfo {
  @Field()
  hasNextPage!: boolean

  @Field(() => String, { nullable: true })
  endCursor?: string | null
}

@ObjectType()
export class PostEdge {
  @Field()
  cursor!: string

  @Field(() => Post)
  node!: Post
}

@ObjectType()
export class PostConnection {
  @Field(() => [PostEdge])
  edges!: PostEdge[]

  @Field(() => PageInfo)
  pageInfo!: PageInfo
}
