import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAddCommentMutation, type FeedQuery } from "@/generated/graphql";

type PostNode = FeedQuery["feed"]["edges"][number]["node"];

interface PostCardProps {
  post: PostNode;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function PostCard({ post }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const queryClient = useQueryClient();
  const commentCount = post.comments.length;

  const { mutate: addComment, isPending } = useAddCommentMutation({
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries(["Feed.infinite"]);
    },
  });

  function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    const content = commentText.trim();
    if (!content) return;
    addComment({ postId: post.id, content });
  }

  return (
    <Card data-testid="post-card">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <Avatar name={post.author.name} />
          <div className="flex flex-col">
            <Link
              to={`/user/${post.author.id}`}
              className="text-sm font-medium leading-none hover:underline"
            >
              {post.author.name}
            </Link>
            <span className="text-xs text-muted-foreground mt-0.5">
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{post.likesCount} likes</span>
          <button
            type="button"
            onClick={() => setShowComments((v) => !v)}
            className="hover:text-foreground transition-colors"
            aria-expanded={showComments}
          >
            {commentCount === 0
              ? "No comments"
              : `${commentCount} comment${commentCount !== 1 ? "s" : ""}`}
          </button>
        </div>

        {showComments && (
          <>
            {commentCount > 0 ? (
              <ul className="flex flex-col gap-2 border-t pt-3" aria-label="Comments">
                {post.comments.map((comment) => (
                  <li key={comment.id} className="flex items-start gap-2">
                    <Avatar
                      name={comment.author.name}
                      className="h-6 w-6 text-[10px] shrink-0 mt-0.5"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">{comment.author.name}</span>
                      <span className="text-xs text-muted-foreground">{comment.content}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground border-t pt-3">No comments yet.</p>
            )}

            <form onSubmit={handleSubmitComment} className="flex gap-2 pt-2">
              <Input
                placeholder="Add a comment…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                aria-label="Add a comment"
              />
              <Button type="submit" size="sm" disabled={isPending || !commentText.trim()}>
                {isPending ? "…" : "Send"}
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
}
