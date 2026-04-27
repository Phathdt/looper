import type { Post } from '@modules/post'

export interface FeedPageInfo {
  hasNextPage: boolean
  endCursor: string | null
}

export interface FeedEdge {
  cursor: string
  node: Post
}

export interface FeedPage {
  edges: FeedEdge[]
  pageInfo: FeedPageInfo
}

export abstract class IFeedService {
  abstract feed(viewerId: string, first?: number, after?: string): Promise<FeedPage>
}
