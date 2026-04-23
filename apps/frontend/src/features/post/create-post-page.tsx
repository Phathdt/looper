import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useCreatePostMutation } from "@/generated/graphql";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function CreatePostPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending } = useCreatePostMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["Feed.infinite"] });
      navigate("/");
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to create post");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    setError(null);
    mutate({ content: trimmed });
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">New post</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              required
              autoFocus
              aria-label="Post content"
            />
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !content.trim()}>
                {isPending ? "Posting…" : "Post"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
