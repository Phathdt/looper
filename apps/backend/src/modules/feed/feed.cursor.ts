export interface FeedCursor {
  createdAt: string;
  id: string;
}

export function encodeCursor(post: { createdAt: Date; id: string }): string {
  return Buffer.from(`${post.createdAt.toISOString()}|${post.id}`).toString("base64url");
}

export function decodeCursor(cursor: string): FeedCursor {
  const [createdAt, id] = Buffer.from(cursor, "base64url").toString().split("|");
  if (!createdAt || !id) throw new Error("Invalid cursor");
  return { createdAt, id };
}
