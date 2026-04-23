import { beforeEach, describe, expect, it } from "vitest";
import { authStore } from "@/lib/auth-store";

describe("authStore", () => {
  beforeEach(() => {
    authStore.getState().clear();
    localStorage.clear();
  });

  it("starts empty", () => {
    expect(authStore.getState().token).toBeNull();
    expect(authStore.getState().user).toBeNull();
  });

  it("setAuth stores token and user", () => {
    authStore.getState().setAuth("tok", { id: "1", name: "alice", email: "a@b.c" });
    expect(authStore.getState().token).toBe("tok");
    expect(authStore.getState().user?.name).toBe("alice");
  });

  it("clear resets state", () => {
    authStore.getState().setAuth("tok", { id: "1", name: "x", email: "x@x.x" });
    authStore.getState().clear();
    expect(authStore.getState().token).toBeNull();
    expect(authStore.getState().user).toBeNull();
  });
});
