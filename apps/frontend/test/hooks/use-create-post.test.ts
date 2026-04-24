import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createWrapper } from "../test-utils";

const mutate = vi.fn();
let mutationOptions: { onSuccess?: () => void; onError?: (e: Error) => void } = {};

vi.mock("@/generated/graphql", () => ({
  useCreatePostMutation: (opts: typeof mutationOptions) => {
    mutationOptions = opts;
    return { mutate, isPending: false };
  },
}));

import { useCreatePost } from "@/features/post/hooks/use-create-post";

describe("useCreatePost", () => {
  beforeEach(() => {
    mutate.mockReset();
    mutationOptions = {};
  });

  it("rejects empty content", async () => {
    const { result } = renderHook(() => useCreatePost(), { wrapper: createWrapper() });
    await act(async () => {
      await result.current.form.trigger();
    });
    expect(result.current.form.getFieldState("content").error?.message).toMatch(/required/i);
  });

  it("rejects content over 1000 chars", async () => {
    const { result } = renderHook(() => useCreatePost(), { wrapper: createWrapper() });
    result.current.form.setValue("content", "x".repeat(1001));
    await act(async () => {
      await result.current.form.trigger();
    });
    expect(result.current.form.getFieldState("content").error?.message).toMatch(/1000/);
  });

  it("submits valid content", async () => {
    const { result } = renderHook(() => useCreatePost(), { wrapper: createWrapper() });
    result.current.form.setValue("content", "  hello world  ");
    await act(async () => {
      await result.current.submit();
    });
    expect(mutate).toHaveBeenCalledWith({ content: "hello world" });
  });

  it("captures server error", async () => {
    const { result } = renderHook(() => useCreatePost(), { wrapper: createWrapper() });
    act(() => mutationOptions.onError?.(new Error("Server boom")));
    expect(result.current.serverError).toBe("Server boom");
  });
});
