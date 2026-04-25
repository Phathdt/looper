import { Field, ObjectType } from "@nestjs/graphql";
import { z } from "zod";
import { Post, postEntitySchema } from "../../../post/domain/entities/post.entity";

export const pageInfoSchema = z.object({
  hasNextPage: z.boolean(),
  endCursor: z.string().nullable().optional(),
});

export type PageInfoType = z.infer<typeof pageInfoSchema>;

@ObjectType()
export class PageInfo implements PageInfoType {
  @Field()
  hasNextPage!: boolean;

  @Field(() => String, { nullable: true })
  endCursor?: string | null;
}

export const postEdgeSchema = z.object({
  cursor: z.string(),
  node: postEntitySchema,
});

export type PostEdgeType = z.infer<typeof postEdgeSchema>;

@ObjectType()
export class PostEdge implements PostEdgeType {
  @Field()
  cursor!: string;

  @Field(() => Post)
  node!: Post;
}

export const postConnectionSchema = z.object({
  edges: z.array(postEdgeSchema),
  pageInfo: pageInfoSchema,
});

export type PostConnectionType = z.infer<typeof postConnectionSchema>;

@ObjectType()
export class PostConnection implements PostConnectionType {
  @Field(() => [PostEdge])
  edges!: PostEdge[];

  @Field(() => PageInfo)
  pageInfo!: PageInfo;
}
