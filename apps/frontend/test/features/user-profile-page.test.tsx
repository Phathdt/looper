import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Routes, Route } from "react-router-dom";
import { renderWithProviders } from "../test-utils";

type UserData = {
  user: {
    id: string;
    name: string;
    email: string;
    followersCount: number;
    isFollowing: boolean;
    posts: Array<{ id: string; content: string; createdAt: string; likesCount: number }>;
  };
};

let userState: {
  data?: UserData;
  isLoading: boolean;
  error: Error | null;
} = { isLoading: true, error: null };

const followMutate = vi.fn();
const unfollowMutate = vi.fn();

vi.mock("@/generated/graphql", () => ({
  useUserQuery: () => userState,
  useFollowMutation: () => ({ mutate: followMutate, isPending: false }),
  useUnfollowMutation: () => ({ mutate: unfollowMutate, isPending: false }),
}));

import { UserProfilePage } from "@/features/user/user-profile-page";
import { authStore } from "@/lib/auth-store";

function renderPage(path = "/user/u2") {
  return renderWithProviders(
    <Routes>
      <Route path="/user/:id" element={<UserProfilePage />} />
    </Routes>,
    { initialPath: path },
  );
}

describe("<UserProfilePage />", () => {
  beforeEach(() => {
    followMutate.mockReset();
    unfollowMutate.mockReset();
    authStore.getState().setAuth("tok", { id: "u1", name: "me", email: "me@x.x" });
  });

  it("shows skeleton while loading", () => {
    userState = { isLoading: true, error: null };
    const { container } = renderPage();
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("shows error state", () => {
    userState = { isLoading: false, error: new Error("nope") };
    renderPage();
    expect(screen.getByRole("alert")).toHaveTextContent(/failed|not found|nope/i);
  });

  it("renders profile + follow button when viewer is not following", async () => {
    userState = {
      isLoading: false,
      error: null,
      data: {
        user: {
          id: "u2",
          name: "bob",
          email: "bob@x.x",
          followersCount: 5,
          isFollowing: false,
          posts: [{ id: "p1", content: "hey", createdAt: new Date().toISOString(), likesCount: 0 }],
        },
      },
    };
    renderPage();
    expect(screen.getByText("bob")).toBeInTheDocument();
    expect(screen.getByText(/5 followers/i)).toBeInTheDocument();
    expect(screen.getByText("hey")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /^follow$/i }));
    expect(followMutate).toHaveBeenCalledWith({ userId: "u2" });
  });

  it("renders unfollow button when already following", async () => {
    userState = {
      isLoading: false,
      error: null,
      data: {
        user: {
          id: "u2",
          name: "bob",
          email: "bob@x.x",
          followersCount: 1,
          isFollowing: true,
          posts: [],
        },
      },
    };
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: /^unfollow$/i }));
    expect(unfollowMutate).toHaveBeenCalledWith({ userId: "u2" });
  });

  it("hides follow button when viewing self", () => {
    authStore.getState().setAuth("tok", { id: "u2", name: "bob", email: "bob@x.x" });
    userState = {
      isLoading: false,
      error: null,
      data: {
        user: {
          id: "u2",
          name: "bob",
          email: "bob@x.x",
          followersCount: 0,
          isFollowing: false,
          posts: [],
        },
      },
    };
    renderPage();
    expect(screen.queryByRole("button", { name: /^follow$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^unfollow$/i })).not.toBeInTheDocument();
  });
});
