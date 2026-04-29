import { Comment, ICommentRepository } from '@modules/comment'
import { IFollowRepository } from '@modules/follow'
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
      }
    }

    return {
      userById: new DataLoader(async (ids) => {
        const allUsers = await Promise.all(ids.map((id) => this.users.findById(id)))
        return allUsers
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
    }
  }
}
