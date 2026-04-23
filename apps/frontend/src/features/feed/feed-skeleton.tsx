import { Skeleton } from "@/components/ui/skeleton";

function PostSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex flex-col gap-1.5 flex-1">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  );
}
