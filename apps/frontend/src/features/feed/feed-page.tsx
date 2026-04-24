import { PostCard } from "./post-card";
import { FeedSkeleton } from "./feed-skeleton";
import { useFeed } from "./hooks/use-feed";

export function FeedPage() {
  const { sentinelRef, posts, isLoading, isFetchingNextPage, hasNextPage, error } = useFeed();

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6">
        <FeedSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6">
        <p className="text-sm text-destructive" role="alert">
          Failed to load feed. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          No posts yet. Be the first to share something!
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((edge) => (
            <PostCard key={edge.node.id} post={edge.node} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-1" aria-hidden="true" />

      {isFetchingNextPage && (
        <p className="text-sm text-muted-foreground text-center py-4">Loading more…</p>
      )}
      {!hasNextPage && posts.length > 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">All caught up.</p>
      )}
    </div>
  );
}
