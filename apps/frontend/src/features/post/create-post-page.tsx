import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useCreatePost } from "./hooks/use-create-post";

export function CreatePostPage() {
  const { form, submit, isPending, serverError, cancel } = useCreatePost();
  const {
    register,
    formState: { errors, isValid },
  } = form;

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">New post</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
            <Textarea
              placeholder="What's on your mind?"
              rows={5}
              autoFocus
              aria-label="Post content"
              aria-invalid={Boolean(errors.content)}
              {...register("content")}
            />
            {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
            {serverError && (
              <p className="text-sm text-destructive" role="alert">
                {serverError}
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={cancel} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !isValid}>
                {isPending ? "Posting…" : "Post"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
