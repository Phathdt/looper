import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useAddCommentMutation } from "@/generated/graphql";

export const addCommentSchema = z.object({
  text: z.string().trim().min(1).max(500, "Comment must be 500 characters or fewer"),
});

export type AddCommentValues = z.infer<typeof addCommentSchema>;

export function useAddComment(postId: string) {
  const queryClient = useQueryClient();

  const form = useForm<AddCommentValues>({
    resolver: zodResolver(addCommentSchema),
    defaultValues: { text: "" },
  });

  const { mutate, isPending } = useAddCommentMutation({
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["Feed.infinite"] });
    },
  });

  const submit = form.handleSubmit(({ text }) => {
    mutate({ postId, content: text });
  });

  return { form, submit, isPending };
}
