import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Routes, Route } from "react-router-dom";
import { renderWithProviders } from "@test/test-utils";

const mutate = vi.fn();
let mutationOptions: { onSuccess?: (d: unknown) => void; onError?: (e: Error) => void } = {};

vi.mock("@/generated/graphql", () => ({
  useRegisterMutation: (opts: typeof mutationOptions) => {
    mutationOptions = opts;
    return { mutate, isPending: false };
  },
}));

import { RegisterPage } from "@/features/auth/register-page";
import { authStore } from "@/lib/auth-store";

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<div>HOME</div>} />
    </Routes>,
    { initialPath: "/register" },
  );
}

describe("<RegisterPage />", () => {
  beforeEach(() => {
    mutate.mockReset();
    authStore.getState().clear();
    localStorage.clear();
  });

  it("submits form with all fields", async () => {
    renderPage();
    await userEvent.type(screen.getByPlaceholderText(/^name$/i), "Alice");
    await userEvent.type(screen.getByPlaceholderText(/email/i), "a@b.co");
    await userEvent.type(screen.getByPlaceholderText(/password/i), "pw12345");
    await userEvent.click(screen.getByRole("button", { name: /register|sign up|create/i }));
    expect(mutate).toHaveBeenCalledWith({
      input: { name: "Alice", email: "a@b.co", password: "pw12345" },
    });
  });

  it("persists auth and navigates on success", async () => {
    renderPage();
    await userEvent.type(screen.getByPlaceholderText(/^name$/i), "Alice");
    await userEvent.type(screen.getByPlaceholderText(/email/i), "a@b.co");
    await userEvent.type(screen.getByPlaceholderText(/password/i), "pw12345");
    await userEvent.click(screen.getByRole("button", { name: /register|sign up|create/i }));

    mutationOptions.onSuccess?.({
      register: { token: "tok", user: { id: "1", name: "Alice", email: "a@b.co" } },
    });
    expect(authStore.getState().token).toBe("tok");
    expect(await screen.findByText("HOME")).toBeInTheDocument();
  });

  it("displays server error", async () => {
    renderPage();
    await userEvent.type(screen.getByPlaceholderText(/^name$/i), "A");
    await userEvent.type(screen.getByPlaceholderText(/email/i), "a@b.co");
    await userEvent.type(screen.getByPlaceholderText(/password/i), "pw12345");
    await userEvent.click(screen.getByRole("button", { name: /register|sign up|create/i }));
    mutationOptions.onError?.(new Error("Email already registered"));
    expect(await screen.findByRole("alert")).toHaveTextContent(/already/i);
  });

  it("falls back to generic error when err not Error", async () => {
    renderPage();
    await userEvent.type(screen.getByPlaceholderText(/^name$/i), "A");
    await userEvent.type(screen.getByPlaceholderText(/email/i), "a@b.co");
    await userEvent.type(screen.getByPlaceholderText(/password/i), "pw12345");
    await userEvent.click(screen.getByRole("button", { name: /register|sign up|create/i }));
    mutationOptions.onError?.("weird" as unknown as Error);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
