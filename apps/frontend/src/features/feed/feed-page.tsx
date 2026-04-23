import { useEffect, useRef } from "react";
import { useInfiniteFeedQuery, type FeedQuery } from "@/generated/graphql";
import { PostCard } from "./post-card";
import { FeedSkeleton } from "./feed-skeleton";

export function FeedPage() {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, error } =
    useInfiniteFeedQuery(
      { first: 10 },
      {
        getNextPageParam: (lastPage: FeedQuery) =>
          lastPage.feed.pageInfo.hasNextPage
            ? { after: lastPage.feed.pageInfo.endCursor }
            : undefined,
      },
    );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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

  const posts = data?.pages.flatMap((page) => page.feed.edges) ?? [];

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

      {/* Infinite scroll sentinel */}
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
