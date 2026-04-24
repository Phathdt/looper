import { useEffect, useRef } from "react";
import { useInfiniteFeedQuery, type FeedQuery } from "@/generated/graphql";

const PAGE_SIZE = 10;

export function useFeed() {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const query = useInfiniteFeedQuery(
    { first: PAGE_SIZE },
    {
      initialPageParam: { first: PAGE_SIZE },
      getNextPageParam: (lastPage: FeedQuery) =>
        lastPage.feed.pageInfo.hasNextPage
          ? { first: PAGE_SIZE, after: lastPage.feed.pageInfo.endCursor }
          : undefined,
    },
  );

  const { data, isFetchingNextPage, hasNextPage, fetchNextPage } = query;

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

  const posts = data?.pages.flatMap((page) => page.feed.edges) ?? [];

  return {
    sentinelRef,
    posts,
    isLoading: query.isLoading,
    isFetchingNextPage,
    hasNextPage,
    error: query.error,
  };
}
