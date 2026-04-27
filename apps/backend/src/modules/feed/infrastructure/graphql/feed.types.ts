import { PostType } from '@modules/post'
import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType('PageInfo')
export class PageInfoType {
  @Field()
  hasNextPage!: boolean

  @Field(() => String, { nullable: true })
  endCursor?: string | null
}

@ObjectType('PostEdge')
export class PostEdgeType {
  @Field()
  cursor!: string

  @Field(() => PostType)
  node!: PostType
}

@ObjectType('PostConnection')
export class PostConnectionType {
  @Field(() => [PostEdgeType])
  edges!: PostEdgeType[]

  @Field(() => PageInfoType)
  pageInfo!: PageInfoType
}
