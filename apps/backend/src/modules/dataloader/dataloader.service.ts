import { Injectable } from "@nestjs/common";
import DataLoader from "dataloader";
import type { Comment, User } from "../../../prisma/generated/client";
import { UserRepository } from "../user/domain/interfaces/user.repository";
import { CommentRepository } from "../comment/domain/interfaces/comment.repository";
import { FollowRepository } from "../follow/domain/interfaces/follow.repository";

export interface RequestLoaders {
  userById: DataLoader<string, User | null>;
  commentsByPost: DataLoader<string, Comment[]>;
  followersCountByUser: DataLoader<string, number>;
  isFollowingByUser: DataLoader<string, boolean>;
}

@Injectable()
export class DataLoaderService {
  constructor(
    private readonly users: UserRepository,
    private readonly comments: CommentRepository,
    private readonly follows: FollowRepository,
  ) {}

  createLoaders(viewerId?: string): RequestLoaders {
    return {
      userById: new DataLoader(async (ids) => {
        const allUsers = await Promise.all(ids.map((id) => this.users.findById(id)));
        return allUsers;
      }),

      commentsByPost: new DataLoader(async (postIds) => {
        const all = await this.comments.findByPostIds(postIds);
        return postIds.map((id) => all.filter((c) => c.postId === id));
      }),

      followersCountByUser: new DataLoader(async (userIds) => {
        const map = await this.follows.countFollowers(userIds);
        return userIds.map((id) => map.get(id) ?? 0);
      }),

      isFollowingByUser: new DataLoader(async (userIds) => {
        if (!viewerId) return userIds.map(() => false);
        const set = await this.follows.isFollowingBatch(viewerId, userIds);
        return userIds.map((id) => set.has(id));
      }),
    };
  }
}
