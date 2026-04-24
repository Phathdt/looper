import { describe, expect, it, vi, beforeEach } from "vitest";
import { fetcher } from "@/lib/fetcher";
import { authStore } from "@/lib/auth-store";

describe("fetcher fallback branches", () => {
  beforeEach(() => {
    authStore.getState().clear();
  });

  it("uses default error message when errors[0].message missing", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue({ json: async () => ({ errors: [{}] }) }) as unknown as typeof fetch;
    await expect(fetcher("{}")()).rejects.toThrow("GraphQL error");
  });

  it("passes custom headers through", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ data: {} }) });
    global.fetch = fetchMock as unknown as typeof fetch;
    await fetcher("{}", undefined, { "X-Trace": "abc" })();
    const init = fetchMock.mock.calls[0][1];
    expect(init.headers["X-Trace"]).toBe("abc");
  });
});
