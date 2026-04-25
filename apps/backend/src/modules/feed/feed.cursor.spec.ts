import { describe, expect, it } from "vitest";
import { decodeCursor, encodeCursor } from "./domain/feed-cursor";

describe("feed cursor", () => {
  it("encodes and decodes roundtrip", () => {
    const post = { createdAt: new Date("2026-04-23T12:34:56.789Z"), id: "abc-123" };
    const encoded = encodeCursor(post);
    expect(typeof encoded).toBe("string");

    const decoded = decodeCursor(encoded);
    expect(decoded.id).toBe("abc-123");
    expect(new Date(decoded.createdAt).toISOString()).toBe(post.createdAt.toISOString());
  });

  it("throws on invalid cursor", () => {
    expect(() => decodeCursor("not-base64")).toThrow();
  });

  it("produces distinct cursors for different posts", () => {
    const a = encodeCursor({ createdAt: new Date(), id: "a" });
    const b = encodeCursor({ createdAt: new Date(), id: "b" });
    expect(a).not.toBe(b);
  });
});
