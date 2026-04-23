import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test-utils";

const addCommentMutate = vi.fn();

vi.mock("@/generated/graphql", () => ({
  useAddCommentMutation: () => ({ mutate: addCommentMutate, isPending: false }),
}));

import { PostCard } from "@/features/feed/post-card";

const basePost = {
  id: "p1",
  content: "hello world",
  createdAt: new Date().toISOString(),
  likesCount: 3,
  author: { id: "u1", name: "alice" },
  comments: [
    { id: "c1", content: "first", author: { id: "u2", name: "bob" } },
    { id: "c2", content: "second", author: { id: "u2", name: "bob" } },
  ],
};

function renderCard(post = basePost) {
  return renderWithProviders(<PostCard post={post} />);
}

describe("<PostCard />", () => {
  it("renders author and content", () => {
    renderCard();
    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.getByText("hello world")).toBeInTheDocument();
  });

  it("shows comment count toggle", async () => {
    renderCard();
    const toggle = screen.getByRole("button", { name: /2 comments/i });
    expect(screen.queryByText("first")).not.toBeInTheDocument();
    await userEvent.click(toggle);
    expect(screen.getByText("first")).toBeInTheDocument();
    expect(screen.getByText("second")).toBeInTheDocument();
  });

  it("submits a new comment", async () => {
    renderCard();
    await userEvent.click(screen.getByRole("button", { name: /2 comments/i }));
    const input = screen.getByLabelText(/add a comment/i);
    await userEvent.type(input, "great post");
    await userEvent.click(screen.getByRole("button", { name: /send/i }));
    expect(addCommentMutate).toHaveBeenCalledWith({ postId: "p1", content: "great post" });
  });

  it("shows 'no comments yet' when empty and expanded", async () => {
    renderCard({ ...basePost, comments: [] });
    await userEvent.click(screen.getByRole("button", { name: /no comments/i }));
    expect(screen.getByText(/no comments yet/i)).toBeInTheDocument();
  });
});
