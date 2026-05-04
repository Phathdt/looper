import { Comment, ICommentRepository } from '@modules/comment'
import { IFollowRepository } from '@modules/follow'
import { ILikeRepository } from '@modules/like'
import { IUserRepository, User } from '@modules/user'
import { Injectable } from '@nestjs/common'

import DataLoader from 'dataloader'

export interface KeyedLoader<K, V> {
  load(key: K): Promise<V>
}

export interface RequestLoaders {
  userById: KeyedLoader<string, User | null>
  commentsByPost: KeyedLoader<string, Comment[]>
  followersCountByUser: KeyedLoader<string, number>
  isFollowingByUser: KeyedLoader<string, boolean>
  likesCountByPost: KeyedLoader<string, number>
  isLikedByPost: KeyedLoader<string, boolean>
}

export interface CreateLoadersOptions {
  batch?: boolean
}

@Injectable()
export class DataLoaderService {
  constructor(
    private readonly users: IUserRepository,
    private readonly comments: ICommentRepository,
    private readonly follows: IFollowRepository,
    private readonly likes: ILikeRepository,
  ) {}

  createLoaders(viewerId?: string, opts: CreateLoadersOptions = {}): RequestLoaders {
    const batch = opts.batch !== false

    if (!batch) {
      return {
        userById: { load: (id) => this.users.findById(id) },
        commentsByPost: {
          load: async (postId) => {
            const all = await this.comments.findByPostIds([postId])
            return all.filter((c) => c.postId === postId)
          },
        },
        followersCountByUser: {
          load: async (userId) => {
            const map = await this.follows.countFollowers([userId])
            return map.get(userId) ?? 0
          },
        },
        isFollowingByUser: {
          load: async (userId) => {
            if (!viewerId) return false
            const set = await this.follows.isFollowingBatch(viewerId, [userId])
            return set.has(userId)
          },
        },
        likesCountByPost: {
          load: async (postId) => {
            const map = await this.likes.countByPostIds([postId])
            return map.get(postId) ?? 0
          },
        },
        isLikedByPost: {
          load: async (postId) => {
            if (!viewerId) return false
            const set = await this.likes.likedByViewer(viewerId, [postId])
            return set.has(postId)
          },
        },
      }
    }

    return {
      userById: new DataLoader(async (ids) => {
        const all = await this.users.findByIds([...ids])
        const byId = new Map(all.map((u) => [u.id, u]))
        return ids.map((id) => byId.get(id) ?? null)
      }),

      commentsByPost: new DataLoader(async (postIds) => {
        const all = await this.comments.findByPostIds(postIds)
        return postIds.map((id) => all.filter((c) => c.postId === id))
      }),

      followersCountByUser: new DataLoader(async (userIds) => {
        const map = await this.follows.countFollowers(userIds)
        return userIds.map((id) => map.get(id) ?? 0)
      }),

      isFollowingByUser: new DataLoader(async (userIds) => {
        if (!viewerId) return userIds.map(() => false)
        const set = await this.follows.isFollowingBatch(viewerId, userIds)
        return userIds.map((id) => set.has(id))
      }),

      likesCountByPost: new DataLoader(async (postIds) => {
        const map = await this.likes.countByPostIds(postIds)
        return postIds.map((id) => map.get(id) ?? 0)
      }),

      isLikedByPost: new DataLoader(async (postIds) => {
        if (!viewerId) return postIds.map(() => false)
        const set = await this.likes.likedByViewer(viewerId, postIds)
        return postIds.map((id) => set.has(id))
      }),
    }
  }
}
