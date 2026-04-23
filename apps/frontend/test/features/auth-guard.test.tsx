import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthGuard } from "@/features/auth/auth-guard";
import { authStore } from "@/lib/auth-store";

function setup(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>LOGIN</div>} />
        <Route element={<AuthGuard />}>
          <Route path="/" element={<div>HOME</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("<AuthGuard />", () => {
  beforeEach(() => {
    authStore.getState().clear();
    localStorage.clear();
  });

  it("redirects to /login when unauthenticated", () => {
    setup("/");
    expect(screen.getByText("LOGIN")).toBeInTheDocument();
  });

  it("renders children when authenticated", () => {
    authStore.getState().setAuth("tok", { id: "1", name: "a", email: "a@b.c" });
    setup("/");
    expect(screen.getByText("HOME")).toBeInTheDocument();
  });
});
