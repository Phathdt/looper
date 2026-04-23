import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Routes, Route } from "react-router-dom";
import { renderWithProviders } from "../test-utils";

const mutate = vi.fn();
let mutationOptions: { onSuccess?: (d: unknown) => void; onError?: (e: Error) => void } = {};

vi.mock("@/generated/graphql", () => ({
  useLoginMutation: (opts: typeof mutationOptions) => {
    mutationOptions = opts;
    return { mutate, isPending: false };
  },
}));

import { LoginPage } from "@/features/auth/login-page";
import { authStore } from "@/lib/auth-store";

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<div>HOME</div>} />
    </Routes>,
    { initialPath: "/login" },
  );
}

describe("<LoginPage />", () => {
  beforeEach(() => {
    mutate.mockReset();
    authStore.getState().clear();
    localStorage.clear();
  });

  it("renders form", () => {
    renderPage();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("submits with entered credentials", async () => {
    renderPage();
    await userEvent.type(screen.getByPlaceholderText(/email/i), "a@b.c");
    await userEvent.type(screen.getByPlaceholderText(/password/i), "pw12345");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(mutate).toHaveBeenCalledWith({ input: { email: "a@b.c", password: "pw12345" } });
  });

  it("persists auth and navigates home on success", async () => {
    renderPage();
    await userEvent.type(screen.getByPlaceholderText(/email/i), "a@b.c");
    await userEvent.type(screen.getByPlaceholderText(/password/i), "pw12345");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    mutationOptions.onSuccess?.({
      login: { token: "tok", user: { id: "1", name: "a", email: "a@b.c" } },
    });
    expect(authStore.getState().token).toBe("tok");
    expect(await screen.findByText("HOME")).toBeInTheDocument();
  });

  it("shows error message on failure", async () => {
    renderPage();
    await userEvent.type(screen.getByPlaceholderText(/email/i), "a@b.c");
    await userEvent.type(screen.getByPlaceholderText(/password/i), "pw12345");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    mutationOptions.onError?.(new Error("Invalid credentials"));
    expect(await screen.findByRole("alert")).toHaveTextContent(/invalid credentials/i);
  });

  it("falls back to generic error when err is not Error", async () => {
    renderPage();
    await userEvent.type(screen.getByPlaceholderText(/email/i), "a@b.c");
    await userEvent.type(screen.getByPlaceholderText(/password/i), "pw12345");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    mutationOptions.onError?.("oops" as unknown as Error);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
