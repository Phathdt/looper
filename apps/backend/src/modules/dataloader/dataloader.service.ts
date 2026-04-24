import { Injectable } from "@nestjs/common";
import DataLoader from "dataloader";
import type { Comment, User } from "../../../prisma/generated/client";
import { PrismaService } from "../prisma/prisma.service";

export interface RequestLoaders {
  userById: DataLoader<string, User | null>;
  commentsByPost: DataLoader<string, Comment[]>;
  followersCountByUser: DataLoader<string, number>;
  isFollowingByUser: DataLoader<string, boolean>;
}

@Injectable()
export class DataLoaderService {
  constructor(private readonly prisma: PrismaService) {}

  createLoaders(viewerId?: string): RequestLoaders {
    return {
      userById: new DataLoader(async (ids) => {
        const users = await this.prisma.user.findMany({
          where: { id: { in: [...ids] } },
        });
        const map = new Map(users.map((u) => [u.id, u]));
        return ids.map((id) => map.get(id) ?? null);
      }),

      commentsByPost: new DataLoader(async (postIds) => {
        const comments = await this.prisma.comment.findMany({
          where: { postId: { in: [...postIds] } },
          orderBy: { createdAt: "asc" },
        });
        return postIds.map((id) => comments.filter((c) => c.postId === id));
      }),

      followersCountByUser: new DataLoader(async (userIds) => {
        const groups = await this.prisma.follow.groupBy({
          by: ["followingId"],
          where: { followingId: { in: [...userIds] } },
          _count: { followerId: true },
        });
        const map = new Map(groups.map((g) => [g.followingId, g._count.followerId]));
        return userIds.map((id) => map.get(id) ?? 0);
      }),

      isFollowingByUser: new DataLoader(async (userIds) => {
        if (!viewerId) return userIds.map(() => false);
        const follows = await this.prisma.follow.findMany({
          where: { followerId: viewerId, followingId: { in: [...userIds] } },
          select: { followingId: true },
        });
        const set = new Set(follows.map((f) => f.followingId));
        return userIds.map((id) => set.has(id));
      }),
    };
  }
}
